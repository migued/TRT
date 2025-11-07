import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs' // Need Node runtime for file handling

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get audio file from form data
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    // Convert to format Whisper expects
    const audioBuffer = await audioFile.arrayBuffer()
    const audioBlob = new Blob([audioBuffer], { type: audioFile.type })

    // Create form data for Whisper API
    const whisperFormData = new FormData()
    whisperFormData.append('file', audioBlob, 'audio.webm')
    whisperFormData.append('model', 'whisper-1')
    whisperFormData.append('language', 'es') // Spanish, change to 'en' if needed

    // Call Whisper API
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: whisperFormData,
    })

    if (!whisperResponse.ok) {
      const error = await whisperResponse.text()
      console.error('Whisper API error:', error)
      return NextResponse.json(
        { error: 'Failed to transcribe audio' },
        { status: whisperResponse.status }
      )
    }

    const transcription = await whisperResponse.json()

    return NextResponse.json({
      text: transcription.text,
      language: transcription.language,
    })

  } catch (error: any) {
    console.error('Voice input error:', error)
    return NextResponse.json(
      { error: 'Failed to process audio', message: error.message },
      { status: 500 }
    )
  }
}
