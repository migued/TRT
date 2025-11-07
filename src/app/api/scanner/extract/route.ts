import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const maxDuration = 60 // Allow up to 60 seconds for processing

interface ExtractionResult {
  confidence: number
  data: Record<string, any>
  raw_text?: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { image, type } = body // type: 'business-card' | 'receipt' | 'invoice' | 'document'

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    if (!type) {
      return NextResponse.json({ error: 'No extraction type provided' }, { status: 400 })
    }

    // Get the appropriate prompt for the extraction type
    const prompt = getExtractionPrompt(type)

    // Call OpenRouter with Qwen2.5-VL-32B
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'TRT CRM',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen/qwen-2.5-vl-32b-instruct',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: image, // base64 data URL
                },
              },
            ],
          },
        ],
        temperature: 0.1, // Low temperature for accurate extraction
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenRouter API error:', error)
      return NextResponse.json(
        { error: 'Failed to extract data from image' },
        { status: response.status }
      )
    }

    const result = await response.json()
    const content = result.choices[0]?.message?.content

    if (!content) {
      return NextResponse.json(
        { error: 'No content returned from AI' },
        { status: 500 }
      )
    }

    // Parse the JSON response from the AI
    const extractedData = parseAIResponse(content, type)

    return NextResponse.json({
      success: true,
      ...extractedData,
    })

  } catch (error: any) {
    console.error('Scanner error:', error)
    return NextResponse.json(
      { error: 'Failed to process image', message: error.message },
      { status: 500 }
    )
  }
}

function getExtractionPrompt(type: string): string {
  switch (type) {
    case 'business-card':
      return `Extract all contact information from this business card image.
Return ONLY a valid JSON object with these fields:
{
  "name": "full name or null",
  "title": "job title or null",
  "company": "company name or null",
  "email": "email address or null",
  "phone": "phone number or null",
  "website": "website URL or null",
  "address": "physical address or null",
  "confidence": {
    "name": 0-100,
    "title": 0-100,
    "company": 0-100,
    "email": 0-100,
    "phone": 0-100,
    "website": 0-100,
    "address": 0-100
  }
}

For confidence scores:
- 90-100: Very clear and certain
- 70-89: Readable but might need verification
- 50-69: Unclear or partially visible
- 0-49: Very uncertain or not found

Use null for any field that is not visible or cannot be read. Do not make up information.`

    case 'receipt':
    case 'invoice':
      return `Extract transaction details from this receipt or invoice image.
Return ONLY a valid JSON object with these fields:
{
  "vendor_name": "business name or null",
  "total_amount": number or null,
  "tax_amount": number or null,
  "date": "YYYY-MM-DD format or null",
  "currency": "USD, MXN, EUR, etc. or null",
  "category": "food, office, travel, etc. or null",
  "payment_method": "cash, card, etc. or null",
  "items": [
    {
      "description": "item name",
      "quantity": number,
      "price": number
    }
  ],
  "confidence": {
    "vendor_name": 0-100,
    "total_amount": 0-100,
    "tax_amount": 0-100,
    "date": 0-100
  }
}

For confidence scores:
- 90-100: Very clear and certain
- 70-89: Readable but might need verification
- 50-69: Unclear or partially visible
- 0-49: Very uncertain or not found

Extract numbers accurately. Use null for fields not found. Do not make up information.`

    case 'document':
      return `Extract key information from this document image.
Return ONLY a valid JSON object with:
{
  "document_type": "contract, proposal, letter, etc.",
  "title": "document title or null",
  "date": "YYYY-MM-DD or null",
  "parties": ["name1", "name2"],
  "key_points": ["point1", "point2"],
  "amounts": [{"description": "...", "value": number}],
  "summary": "brief summary of document content",
  "confidence": {
    "document_type": 0-100,
    "title": 0-100,
    "date": 0-100
  }
}

Use null for fields not found.`

    default:
      return `Extract all visible text and information from this image in structured JSON format.`
  }
}

function parseAIResponse(content: string, type: string): ExtractionResult {
  try {
    // Try to find JSON in the response (AI might wrap it in markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const parsed = JSON.parse(jsonMatch[0])

    // Calculate overall confidence (average of field confidences)
    let overallConfidence = 85 // Default
    if (parsed.confidence) {
      const confidenceValues = Object.values(parsed.confidence).filter(v => typeof v === 'number') as number[]
      if (confidenceValues.length > 0) {
        overallConfidence = Math.round(
          confidenceValues.reduce((sum, val) => sum + val, 0) / confidenceValues.length
        )
      }
    }

    return {
      confidence: overallConfidence,
      data: parsed,
      raw_text: content,
    }

  } catch (error) {
    console.error('Failed to parse AI response:', error)

    // Fallback: return the raw content
    return {
      confidence: 50,
      data: { raw_content: content },
      raw_text: content,
    }
  }
}
