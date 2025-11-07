/**
 * OpenRouter AI Client with reasoning token support
 * Supports deepseek-r1 and other reasoning models
 */

export interface ReasoningConfig {
  // One of the following (not both):
  effort?: 'high' | 'medium' | 'low' // OpenAI-style
  max_tokens?: number // Anthropic-style

  // Optional: Default is false
  exclude?: boolean // Set to true to exclude reasoning tokens from response

  // Or enable reasoning with default parameters
  enabled?: boolean
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string | MessageContent[]
  reasoning?: string
  reasoning_details?: ReasoningDetail[]
}

export interface MessageContent {
  type: 'text' | 'image_url'
  text?: string
  image_url?: {
    url: string
  }
}

export interface ReasoningDetail {
  type: 'reasoning.summary' | 'reasoning.encrypted' | 'reasoning.text'
  id?: string | null
  format?: string
  index?: number
  summary?: string
  data?: string
  text?: string
  signature?: string | null
}

export interface OpenRouterResponse {
  id: string
  choices: Array<{
    message: {
      role: string
      content: string
      reasoning?: string
      reasoning_details?: ReasoningDetail[]
    }
    finish_reason: string
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  model?: string
}

export interface OpenRouterStreamChunk {
  id: string
  choices: Array<{
    delta: {
      role?: string
      content?: string
      reasoning?: string
      reasoning_details?: ReasoningDetail[]
    }
    finish_reason?: string
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface ChatCompletionOptions {
  model: string
  messages: ChatMessage[]
  reasoning?: ReasoningConfig
  temperature?: number
  max_tokens?: number
  stream?: boolean
  stop?: string | string[]
}

export class OpenRouterClient {
  private apiKey: string
  private baseUrl = 'https://openrouter.ai/api/v1'
  private appUrl: string
  private appName: string

  constructor(apiKey: string, appUrl?: string, appName?: string) {
    this.apiKey = apiKey
    this.appUrl = appUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    this.appName = appName || 'TRT CRM'
  }

  /**
   * Create a chat completion with optional reasoning tokens
   */
  async createChatCompletion(options: ChatCompletionOptions): Promise<OpenRouterResponse> {
    const body: any = {
      model: options.model,
      messages: options.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        ...(msg.reasoning_details && { reasoning_details: msg.reasoning_details })
      })),
      temperature: options.temperature ?? 0.7,
    }

    // Add max_tokens if specified
    if (options.max_tokens) {
      body.max_tokens = options.max_tokens
    }

    // Add reasoning config if specified
    if (options.reasoning) {
      body.reasoning = options.reasoning
    }

    // Add stop sequences if specified
    if (options.stop) {
      body.stop = options.stop
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': this.appUrl,
        'X-Title': this.appName,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  /**
   * Create a streaming chat completion with optional reasoning tokens
   */
  async *createStreamingChatCompletion(options: ChatCompletionOptions): AsyncGenerator<OpenRouterStreamChunk> {
    const body: any = {
      model: options.model,
      messages: options.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        ...(msg.reasoning_details && { reasoning_details: msg.reasoning_details })
      })),
      temperature: options.temperature ?? 0.7,
      stream: true,
    }

    // Add max_tokens if specified
    if (options.max_tokens) {
      body.max_tokens = options.max_tokens
    }

    // Add reasoning config if specified
    if (options.reasoning) {
      body.reasoning = options.reasoning
    }

    // Add stop sequences if specified
    if (options.stop) {
      body.stop = options.stop
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': this.appUrl,
        'X-Title': this.appName,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`)
    }

    if (!response.body) {
      throw new Error('No response body')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || trimmed === 'data: [DONE]') continue

          if (trimmed.startsWith('data: ')) {
            try {
              const json = JSON.parse(trimmed.slice(6))
              yield json as OpenRouterStreamChunk
            } catch (e) {
              console.error('Failed to parse SSE chunk:', e)
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  /**
   * Extract data from an image using vision model
   */
  async extractFromImage(
    imageData: string,
    prompt: string,
    model = 'qwen/qwen-2.5-vl-32b-instruct'
  ): Promise<OpenRouterResponse> {
    return this.createChatCompletion({
      model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageData } }
          ]
        }
      ],
      temperature: 0.1, // Low temperature for accurate extraction
      max_tokens: 2000,
    })
  }

  /**
   * Generate a conversation title from messages
   */
  async generateConversationTitle(messages: ChatMessage[]): Promise<string> {
    const response = await this.createChatCompletion({
      model: 'deepseek/deepseek-r1', // Fast and cheap for this task
      messages: [
        {
          role: 'system',
          content: 'Generate a short, concise title (3-6 words) for this conversation. Respond with ONLY the title, no quotes or extra text.'
        },
        {
          role: 'user',
          content: `Conversation:\n${messages.slice(0, 4).map(m => `${m.role}: ${typeof m.content === 'string' ? m.content : JSON.stringify(m.content)}`).join('\n')}`
        }
      ],
      temperature: 0.7,
      max_tokens: 20,
    })

    return response.choices[0]?.message?.content?.trim() || 'Nueva conversación'
  }
}

// Default export for easy importing
export const createOpenRouterClient = () => {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable is not set')
  }
  return new OpenRouterClient(apiKey)
}

// Model presets
export const Models = {
  // Reasoning models
  GROK_4_FAST: 'x-ai/grok-2-vision-1212', // Using Grok for reasoning with vision support
  DEEPSEEK_R1: 'deepseek/deepseek-r1',

  // Vision models
  QWEN_VL: 'qwen/qwen-2.5-vl-32b-instruct',

  // Fast models for quick tasks
  DEEPSEEK_CHAT: 'deepseek/deepseek-chat',
} as const

// Reasoning presets
export const ReasoningPresets = {
  HIGH: { effort: 'high' as const },
  MEDIUM: { effort: 'medium' as const },
  LOW: { effort: 'low' as const },
  CUSTOM: (tokens: number) => ({ max_tokens: tokens }),
} as const
