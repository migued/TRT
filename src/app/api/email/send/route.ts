import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import nodemailer from 'nodemailer'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY || '')

interface EmailSettings {
  smtp_enabled: boolean
  smtp_host: string
  smtp_port: number
  smtp_secure: boolean
  smtp_user: string
  smtp_password: string
  from_name: string
  from_email: string
  reply_to?: string
  use_resend_for_system: boolean
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      to,
      subject,
      html,
      text,
      contactId,
      quoteId,
      orderId,
      workspaceId,
      isSystemEmail = false, // For account creation, password reset, etc.
      replyTo,
      cc,
      bcc,
      attachments,
      inReplyTo,
      references
    } = await req.json()

    // Validate required fields
    if (!to || !subject || (!html && !text)) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, and (html or text)' },
        { status: 400 }
      )
    }

    // Get workspace settings
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('name, email_settings')
      .eq('id', workspaceId)
      .single()

    if (workspaceError || !workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    const emailSettings = (workspace.email_settings as EmailSettings) || {
      smtp_enabled: false,
      use_resend_for_system: true
    }

    let emailId: string | undefined
    let fromEmail: string
    let fromName: string

    // Determine which email service to use
    const useResend = isSystemEmail
      ? emailSettings.use_resend_for_system
      : !emailSettings.smtp_enabled

    if (useResend) {
      // Use Resend for system emails or when SMTP is not configured
      fromName = workspace.name
      fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

      const { data: emailData, error: emailError } = await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: Array.isArray(to) ? to : [to],
        subject,
        html: html || text,
        text,
        reply_to: replyTo || emailSettings.reply_to,
        cc,
        bcc,
        attachments,
        tags: [
          { name: 'workspace_id', value: workspaceId },
          ...(contactId ? [{ name: 'contact_id', value: contactId }] : []),
          ...(quoteId ? [{ name: 'quote_id', value: quoteId }] : []),
          ...(orderId ? [{ name: 'order_id', value: orderId }] : []),
          ...(isSystemEmail ? [{ name: 'type', value: 'system' }] : [{ name: 'type', value: 'user' }])
        ],
        headers: {
          ...(inReplyTo && { 'In-Reply-To': inReplyTo }),
          ...(references && { 'References': references })
        }
      })

      if (emailError) {
        console.error('Resend error:', emailError)
        return NextResponse.json({ error: emailError.message }, { status: 500 })
      }

      emailId = emailData?.id

    } else {
      // Use SMTP for regular user emails
      fromName = emailSettings.from_name || workspace.name
      fromEmail = emailSettings.from_email

      if (!fromEmail) {
        return NextResponse.json(
          { error: 'SMTP is enabled but from_email is not configured' },
          { status: 400 }
        )
      }

      // Create SMTP transporter
      const transporter = nodemailer.createTransport({
        host: emailSettings.smtp_host,
        port: emailSettings.smtp_port,
        secure: emailSettings.smtp_secure,
        auth: {
          user: emailSettings.smtp_user,
          pass: emailSettings.smtp_password
        }
      })

      // Send email via SMTP
      const info = await transporter.sendMail({
        from: `${fromName} <${fromEmail}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html: html || text,
        text,
        replyTo: replyTo || emailSettings.reply_to,
        cc: cc ? (Array.isArray(cc) ? cc.join(', ') : cc) : undefined,
        bcc: bcc ? (Array.isArray(bcc) ? bcc.join(', ') : bcc) : undefined,
        attachments: attachments?.map((att: any) => ({
          filename: att.filename,
          content: att.content,
          contentType: att.content_type || att.contentType
        })),
        headers: {
          ...(inReplyTo && { 'In-Reply-To': inReplyTo }),
          ...(references && { 'References': references })
        }
      })

      emailId = info.messageId
    }

    // Store email in conversations table for history (skip system emails)
    if (!isSystemEmail) {
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
          body: html || text,
          from_email: fromEmail,
          to_email: Array.isArray(to) ? to[0] : to,
          cc_email: cc ? (Array.isArray(cc) ? cc : [cc]) : null,
          bcc_email: bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : null,
          external_id: emailId,
          status: 'sent',
          sent_by: user.id,
          sent_at: new Date().toISOString(),
          in_reply_to: inReplyTo,
          email_headers: {
            'message-id': emailId,
            'in-reply-to': inReplyTo,
            'references': references
          }
        })

      if (conversationError) {
        console.error('Error storing conversation:', conversationError)
        // Don't fail the request if storing fails, email was already sent
      }

      // Handle attachments if provided
      if (attachments && Array.isArray(attachments) && attachments.length > 0) {
        // Attachments would need to be uploaded to storage first
        // This is a placeholder for attachment handling
        console.log('Attachments received but not yet stored:', attachments.length)
      }
    }

    return NextResponse.json({
      success: true,
      emailId,
      service: useResend ? 'resend' : 'smtp',
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
