-- Add SMTP and Email settings to workspaces
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS email_settings JSONB DEFAULT '{
  "smtp_enabled": false,
  "smtp_host": "",
  "smtp_port": 587,
  "smtp_secure": false,
  "smtp_user": "",
  "smtp_password": "",
  "from_name": "",
  "from_email": "",
  "reply_to": "",
  "use_resend_for_system": true
}'::jsonb;

-- Add email threading support to conversations table
-- Add parent_id for email threading
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES conversations(id) ON DELETE SET NULL;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS thread_id UUID;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS in_reply_to TEXT; -- Email Message-ID for threading

-- Add email headers storage (for proper threading and reply handling)
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS email_headers JSONB;

-- Add attachment support
CREATE TABLE IF NOT EXISTS email_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,

  -- File metadata
  file_name TEXT NOT NULL,
  file_size INT NOT NULL,
  mime_type TEXT NOT NULL,

  -- Storage
  storage_path TEXT NOT NULL,
  storage_url TEXT,

  -- Content ID for inline images
  content_id TEXT,
  is_inline BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for email attachments
CREATE INDEX IF NOT EXISTS idx_email_attachments_conversation ON email_attachments(conversation_id);
CREATE INDEX IF NOT EXISTS idx_email_attachments_content_id ON email_attachments(content_id) WHERE content_id IS NOT NULL;

-- Index for email threading
CREATE INDEX IF NOT EXISTS idx_conversations_parent ON conversations(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conversations_thread ON conversations(thread_id) WHERE thread_id IS NOT NULL;

-- RLS for email_attachments
ALTER TABLE email_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view attachments in their workspace"
  ON email_attachments FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE workspace_id IN (
        SELECT workspace_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert attachments in their workspace"
  ON email_attachments FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations WHERE workspace_id IN (
        SELECT workspace_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete attachments in their workspace"
  ON email_attachments FOR DELETE
  USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE workspace_id IN (
        SELECT workspace_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Function to get email thread
CREATE OR REPLACE FUNCTION get_email_thread(conversation_uuid UUID)
RETURNS TABLE (
  id UUID,
  workspace_id UUID,
  contact_id UUID,
  type TEXT,
  direction TEXT,
  subject TEXT,
  body TEXT,
  from_email TEXT,
  to_email TEXT,
  status TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  parent_id UUID,
  thread_id UUID
) AS $$
BEGIN
  -- Get the thread_id from the conversation
  DECLARE
    v_thread_id UUID;
  BEGIN
    SELECT COALESCE(c.thread_id, c.id)
    INTO v_thread_id
    FROM conversations c
    WHERE c.id = conversation_uuid;

    -- Return all conversations in this thread
    RETURN QUERY
    SELECT
      c.id,
      c.workspace_id,
      c.contact_id,
      c.type,
      c.direction,
      c.subject,
      c.body,
      c.from_email,
      c.to_email,
      c.status,
      c.sent_at,
      c.created_at,
      c.parent_id,
      c.thread_id
    FROM conversations c
    WHERE c.thread_id = v_thread_id OR c.id = v_thread_id
    ORDER BY c.sent_at ASC, c.created_at ASC;
  END;
END;
$$ LANGUAGE plpgsql;
