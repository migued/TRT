-- Conversations table for email and message history
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,

  -- Relationships
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,

  -- Type and Direction
  type TEXT NOT NULL CHECK (type IN ('email', 'whatsapp', 'sms', 'note')),
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),

  -- Content
  subject TEXT,
  body TEXT NOT NULL,

  -- Email specific
  from_email TEXT,
  to_email TEXT,
  cc_email TEXT[],
  bcc_email TEXT[],

  -- Status and tracking
  status TEXT DEFAULT 'sent' CHECK (status IN ('draft', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')),
  external_id TEXT, -- Resend email ID or WhatsApp message ID

  -- Engagement tracking
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,

  -- Metadata
  sent_by UUID REFERENCES profiles(id),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_workspace ON conversations(workspace_id);
CREATE INDEX idx_conversations_contact ON conversations(contact_id);
CREATE INDEX idx_conversations_quote ON conversations(quote_id);
CREATE INDEX idx_conversations_order ON conversations(order_id);
CREATE INDEX idx_conversations_type ON conversations(type);
CREATE INDEX idx_conversations_sent_at ON conversations(sent_at);

-- RLS Policies
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view conversations in their workspace"
  ON conversations FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert conversations in their workspace"
  ON conversations FOR INSERT
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update conversations in their workspace"
  ON conversations FOR UPDATE
  USING (workspace_id IN (
    SELECT workspace_id FROM profiles WHERE id = auth.uid()
  ));
