import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { text, voice = 'nova' } = await request.json()

    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 })
    }

    // Get user's voice preference
    const { data: userSettings } = await supabase
      .from('user_settings')
      .select('voice_settings')
      .eq('user_id', user.id)
      .single()

    const selectedVoice = userSettings?.voice_settings?.openai_voice || voice

    // Call OpenAI TTS API
    const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1', // tts-1 is faster, tts-1-hd is higher quality
        voice: selectedVoice,
        input: text,
        response_format: 'mp3',
        speed: userSettings?.voice_settings?.speech_speed || 1.0,
      }),
    })

    if (!ttsResponse.ok) {
      const error = await ttsResponse.text()
      console.error('TTS API error:', error)
      return NextResponse.json(
        { error: 'Failed to generate speech' },
        { status: ttsResponse.status }
      )
    }

    // Get the audio data
    const audioBuffer = await ttsResponse.arrayBuffer()

    // Return audio file
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    })

  } catch (error: any) {
    console.error('Voice output error:', error)
    return NextResponse.json(
      { error: 'Failed to generate speech', message: error.message },
      { status: 500 }
    )
  }
}
