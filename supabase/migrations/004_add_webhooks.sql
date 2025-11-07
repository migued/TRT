-- Create webhooks table for both incoming and outgoing webhooks
create table if not exists webhooks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade not null,
  name text not null,
  type text not null check (type in ('incoming', 'outgoing')),

  -- For incoming webhooks
  webhook_key text unique, -- Unique key for incoming webhook URL
  allowed_events text[], -- Events this incoming webhook can create (e.g., ['contact', 'lead'])

  -- For outgoing webhooks
  target_url text, -- URL to POST to for outgoing webhooks
  events text[], -- Events that trigger this webhook (e.g., ['contact.created', 'opportunity.won'])
  headers jsonb default '{}'::jsonb, -- Custom headers for outgoing webhooks

  -- Common fields
  secret text, -- Secret for signature validation
  is_active boolean default true,
  description text,
  metadata jsonb default '{}'::jsonb,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create webhook_logs table for tracking all webhook activity
create table if not exists webhook_logs (
  id uuid primary key default gen_random_uuid(),
  webhook_id uuid references webhooks(id) on delete cascade not null,
  workspace_id uuid references workspaces(id) on delete cascade not null,

  type text not null check (type in ('incoming', 'outgoing')),
  event text, -- Event type (e.g., 'contact.created', 'form.submitted')

  -- Request details
  request_method text,
  request_url text,
  request_headers jsonb,
  request_body jsonb,

  -- Response details
  response_status integer,
  response_body jsonb,
  response_time_ms integer,

  -- Error handling
  success boolean default false,
  error_message text,
  retry_count integer default 0,

  created_at timestamptz default now()
);

-- Create indexes for better query performance
create index if not exists idx_webhooks_workspace_id on webhooks(workspace_id);
create index if not exists idx_webhooks_type on webhooks(type);
create index if not exists idx_webhooks_webhook_key on webhooks(webhook_key);
create index if not exists idx_webhook_logs_webhook_id on webhook_logs(webhook_id);
create index if not exists idx_webhook_logs_workspace_id on webhook_logs(workspace_id);
create index if not exists idx_webhook_logs_created_at on webhook_logs(created_at desc);

-- Enable RLS
alter table webhooks enable row level security;
alter table webhook_logs enable row level security;

-- RLS Policies for webhooks
create policy "Users can view webhooks in their workspace"
  on webhooks for select
  using (
    workspace_id in (
      select workspace_id from workspace_members where user_id = auth.uid()
    )
  );

create policy "Users can create webhooks in their workspace"
  on webhooks for insert
  with check (
    workspace_id in (
      select workspace_id from workspace_members where user_id = auth.uid()
    )
  );

create policy "Users can update webhooks in their workspace"
  on webhooks for update
  using (
    workspace_id in (
      select workspace_id from workspace_members where user_id = auth.uid()
    )
  );

create policy "Users can delete webhooks in their workspace"
  on webhooks for delete
  using (
    workspace_id in (
      select workspace_id from workspace_members where user_id = auth.uid()
    )
  );

-- RLS Policies for webhook_logs
create policy "Users can view webhook logs in their workspace"
  on webhook_logs for select
  using (
    workspace_id in (
      select workspace_id from workspace_members where user_id = auth.uid()
    )
  );

create policy "Service role can insert webhook logs"
  on webhook_logs for insert
  with check (true); -- Logs can be created by service

-- Create function to update updated_at timestamp
create or replace function update_webhook_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger for updated_at
create trigger update_webhooks_updated_at
  before update on webhooks
  for each row
  execute function update_webhook_updated_at();

-- Generate webhook key function
create or replace function generate_webhook_key()
returns text as $$
begin
  return 'whk_' || encode(gen_random_bytes(32), 'hex');
end;
$$ language plpgsql;
