'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, X, Send, Sparkles, Loader2, Mic, MicOff, Volume2, VolumeX } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  audioUrl?: string // For voice responses
}

interface AIAssistantProps {
  workspaceId?: string
  contactId?: string
  opportunityId?: string
  quoteId?: string
  orderId?: string
  projectId?: string
  companyId?: string
  includeAnalytics?: boolean
}

export function AIAssistant({
  workspaceId,
  contactId,
  opportunityId,
  quoteId,
  orderId,
  projectId,
  companyId,
  includeAnalytics = false
}: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Voice state
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent, textOverride?: string) => {
    e.preventDefault()
    const messageText = textOverride || input
    if (!messageText.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: messageText }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const context = {
        workspaceId,
        contactId,
        opportunityId,
        quoteId,
        orderId,
        projectId,
        companyId,
        includeAnalytics
      }

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          context
        })
      })

      if (!response.ok) throw new Error('AI request failed')

      // Stream the response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = ''

      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          assistantMessage += chunk

          setMessages(prev => {
            const newMessages = [...prev]
            newMessages[newMessages.length - 1] = {
              role: 'assistant',
              content: assistantMessage
            }
            return newMessages
          })
        }
      }

      // Generate voice response if voice is enabled
      if (voiceEnabled && assistantMessage) {
        try {
          const voiceResponse = await fetch('/api/ai/voice-output', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: assistantMessage })
          })

          if (voiceResponse.ok) {
            const audioBlob = await voiceResponse.blob()
            const audioUrl = URL.createObjectURL(audioBlob)

            // Update the last message with audio URL
            setMessages(prev => {
              const newMessages = [...prev]
              newMessages[newMessages.length - 1] = {
                ...newMessages[newMessages.length - 1],
                audioUrl
              }
              return newMessages
            })

            // Auto-play the audio
            playAudio(audioUrl)
          }
        } catch (error) {
          console.error('Voice generation error:', error)
          // Continue without voice if it fails
        }
      }
    } catch (error) {
      console.error('AI chat error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Lo siento, hubo un error al procesar tu solicitud. Por favor intenta de nuevo.'
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)

      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await transcribeAudio(audioBlob)

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('No se pudo acceder al micrófono. Por favor verifica los permisos.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true)

    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')

      const response = await fetch('/api/ai/voice-input', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) throw new Error('Transcription failed')

      const { text } = await response.json()

      // Submit the transcribed text
      if (text) {
        const fakeEvent = { preventDefault: () => {} } as React.FormEvent
        await handleSubmit(fakeEvent, text)
      }
    } catch (error) {
      console.error('Transcription error:', error)
      alert('Error al transcribir el audio. Por favor intenta de nuevo.')
    } finally {
      setIsTranscribing(false)
    }
  }

  const playAudio = (audioUrl: string) => {
    if (audioRef.current) {
      audioRef.current.pause()
    }

    const audio = new Audio(audioUrl)
    audioRef.current = audio

    audio.onplay = () => setIsPlayingAudio(true)
    audio.onended = () => setIsPlayingAudio(false)
    audio.onerror = () => setIsPlayingAudio(false)

    audio.play().catch(error => {
      console.error('Error playing audio:', error)
    })
  }

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlayingAudio(false)
    }
  }

  const suggestedQuestions = [
    "¿Qué debo hacer a continuación?",
    "Redacta un email de seguimiento",
    "Analiza esta oportunidad",
    "Sugiere productos para este cliente"
  ]

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 p-4 bg-gradient-to-r from-purple-600 to-orange-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 z-50 group"
        >
          <Bot className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
          </span>
          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-slate-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Asistente IA
          </div>
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-slate-200">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-purple-600 to-orange-600 rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Asistente IA</h3>
                <p className="text-xs text-white/80">Powered by Claude</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="inline-flex p-4 bg-gradient-to-br from-purple-100 to-orange-100 rounded-full mb-4">
                  <Bot className="h-8 w-8 text-purple-600" />
                </div>
                <h4 className="font-semibold text-slate-900 mb-2">¡Hola! Soy tu asistente IA</h4>
                <p className="text-sm text-slate-600 mb-4">
                  Puedo ayudarte con análisis, redacción y sugerencias.
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {suggestedQuestions.map((question, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(question)}
                      className="text-left px-3 py-2 text-sm bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-700 transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message, i) => (
              <div
                key={i}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-orange-600 text-white'
                      : 'bg-slate-100 text-slate-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {/* Audio playback button for assistant messages */}
                  {message.role === 'assistant' && message.audioUrl && (
                    <button
                      onClick={() => playAudio(message.audioUrl!)}
                      className="mt-2 flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700"
                    >
                      <Volume2 className="h-3 w-3" />
                      Reproducir respuesta
                    </button>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-lg px-4 py-3">
                  <Loader2 className="h-4 w-4 text-purple-600 animate-spin" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-slate-200">
            {/* Voice toggle and status */}
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-900 transition-colors"
              >
                {voiceEnabled ? (
                  <>
                    <Volume2 className="h-3 w-3 text-green-600" />
                    <span>Voz activada</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="h-3 w-3 text-slate-400" />
                    <span>Voz desactivada</span>
                  </>
                )}
              </button>

              {isTranscribing && (
                <span className="text-xs text-purple-600 flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Transcribiendo...
                </span>
              )}

              {isPlayingAudio && (
                <button
                  type="button"
                  onClick={stopAudio}
                  className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1"
                >
                  <Volume2 className="h-3 w-3 animate-pulse" />
                  Reproduciendo...
                </button>
              )}
            </div>

            <div className="flex gap-2">
              {/* Voice recording button */}
              <button
                type="button"
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                disabled={isLoading || isTranscribing}
                className={`px-3 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  isRecording
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                title="Mantén presionado para hablar"
              >
                {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>

              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
                placeholder={isRecording ? "Hablando..." : "Escribe o usa el micrófono..."}
                rows={2}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-sm"
                disabled={isLoading || isRecording}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading || isRecording}
                className="px-4 bg-gradient-to-r from-purple-600 to-orange-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Presiona Enter para enviar, o mantén el 🎤 para hablar
            </p>
          </form>
        </div>
      )}
    </>
  )
}
