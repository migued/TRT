-- Create user_settings table for storing user preferences
create table if not exists user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,

  -- Voice settings
  voice_settings jsonb default '{
    "enabled": true,
    "openai_voice": "nova",
    "speech_speed": 1.0,
    "auto_play": false
  }'::jsonb,

  -- Future settings can be added here
  ui_preferences jsonb default '{}'::jsonb,
  notification_preferences jsonb default '{}'::jsonb,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create index for faster lookups
create index if not exists idx_user_settings_user_id on user_settings(user_id);

-- Enable RLS
alter table user_settings enable row level security;

-- RLS Policies
create policy "Users can view their own settings"
  on user_settings for select
  using (auth.uid() = user_id);

create policy "Users can insert their own settings"
  on user_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own settings"
  on user_settings for update
  using (auth.uid() = user_id);

-- Create function to update updated_at timestamp
create or replace function update_user_settings_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger for updated_at
create trigger update_user_settings_updated_at
  before update on user_settings
  for each row
  execute function update_user_settings_updated_at();

-- Function to ensure user_settings exists for a user (create if not exists)
create or replace function ensure_user_settings(p_user_id uuid)
returns void as $$
begin
  insert into user_settings (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;
end;
$$ language plpgsql;
