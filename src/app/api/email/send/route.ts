import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY || '')

export async function POST(req: Request) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { to, subject, html, contactId, quoteId, orderId, workspaceId } = await req.json()

    // Validate required fields
    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, html' },
        { status: 400 }
      )
    }

    // Get workspace to use from email
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('name')
      .eq('id', workspaceId)
      .single()

    const fromName = workspace?.name || 'TRT CRM'
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

    // Send email via Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      tags: [
        { name: 'workspace_id', value: workspaceId },
        ...(contactId ? [{ name: 'contact_id', value: contactId }] : []),
        ...(quoteId ? [{ name: 'quote_id', value: quoteId }] : []),
        ...(orderId ? [{ name: 'order_id', value: orderId }] : []),
      ]
    })

    if (emailError) {
      console.error('Resend error:', emailError)
      return NextResponse.json({ error: emailError.message }, { status: 500 })
    }

    // Store email in conversations table for history
    const { error: conversationError } = await supabase
      .from('conversations')
      .insert({
        workspace_id: workspaceId,
        contact_id: contactId,
        quote_id: quoteId,
        order_id: orderId,
        type: 'email',
        direction: 'outbound',
        subject,
        body: html,
        from_email: fromEmail,
        to_email: Array.isArray(to) ? to[0] : to,
        external_id: emailData?.id,
        status: 'sent',
        sent_by: user.id,
        sent_at: new Date().toISOString()
      })

    if (conversationError) {
      console.error('Error storing conversation:', conversationError)
      // Don't fail the request if storing fails, email was already sent
    }

    return NextResponse.json({
      success: true,
      emailId: emailData?.id,
      message: 'Email sent successfully'
    })

  } catch (error: any) {
    console.error('Email send error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    )
  }
}
