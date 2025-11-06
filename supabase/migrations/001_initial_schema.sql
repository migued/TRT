-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Workspaces (Multi-tenancy root)
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Basic Info
  name TEXT NOT NULL,
  slug TEXT UNIQUE,

  -- Branding
  logo_url TEXT,
  primary_color TEXT DEFAULT '#000000',
  secondary_color TEXT,

  -- Configuration
  currency TEXT DEFAULT 'MXN',
  timezone TEXT DEFAULT 'America/Mexico_City',
  language TEXT DEFAULT 'es',

  -- Enterprise Features
  custom_domain TEXT UNIQUE,
  custom_supabase_url TEXT,
  custom_supabase_anon_key TEXT,

  -- Plan & Limits
  plan TEXT DEFAULT 'starter' CHECK (plan IN ('starter', 'pro', 'business', 'enterprise')),
  seats_limit INT DEFAULT 1,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workspaces_slug ON workspaces(slug);
CREATE INDEX idx_workspaces_custom_domain ON workspaces(custom_domain);

-- Profiles (Users in workspaces)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,

  -- User Info
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,

  -- Role & Permissions
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  permissions JSONB DEFAULT '{}',

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'invited', 'inactive')),
  invited_by UUID REFERENCES profiles(id),
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(workspace_id, email)
);

CREATE INDEX idx_profiles_workspace ON profiles(workspace_id);
CREATE INDEX idx_profiles_email ON profiles(email);

-- ============================================================================
-- CRM TABLES
-- ============================================================================

-- Companies
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,

  name TEXT NOT NULL,
  website TEXT,
  industry TEXT,
  size TEXT,
  tax_id TEXT,
  notes TEXT,
  custom_fields JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_companies_workspace ON companies(workspace_id);

-- Contacts
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,

  -- Required
  name TEXT NOT NULL,

  -- Optional
  email TEXT,
  phone TEXT,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,

  -- Organization
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  custom_fields JSONB DEFAULT '{}',

  -- Source
  source TEXT CHECK (source IN ('whatsapp', 'website', 'manual', 'import')),

  -- Metadata
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contacts_workspace ON contacts(workspace_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_phone ON contacts(phone);
CREATE INDEX idx_contacts_company ON contacts(company_id);
CREATE INDEX idx_contacts_tags ON contacts USING GIN(tags);
CREATE INDEX idx_contacts_name_trgm ON contacts USING GIN(name gin_trgm_ops);

-- ============================================================================
-- SALES TABLES
-- ============================================================================

-- Custom Stages
CREATE TABLE custom_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,

  type TEXT NOT NULL CHECK (type IN ('opportunity', 'project')),
  name TEXT NOT NULL,
  color TEXT,
  order_index INT NOT NULL,
  stage_type TEXT DEFAULT 'active' CHECK (stage_type IN ('active', 'won', 'lost')),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(workspace_id, type, name)
);

CREATE INDEX idx_custom_stages_workspace ON custom_stages(workspace_id);
CREATE INDEX idx_custom_stages_type ON custom_stages(type);

-- Opportunities
CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,

  -- Required
  title TEXT NOT NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  stage TEXT NOT NULL,

  -- Optional
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'MXN',
  probability INT DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
  expected_close_date DATE,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Products
  products JSONB DEFAULT '[]',

  -- Fields
  notes TEXT,
  custom_fields JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',

  -- Status
  won_at TIMESTAMPTZ,
  lost_at TIMESTAMPTZ,
  lost_reason TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_opportunities_workspace ON opportunities(workspace_id);
CREATE INDEX idx_opportunities_contact ON opportunities(contact_id);
CREATE INDEX idx_opportunities_stage ON opportunities(stage);
CREATE INDEX idx_opportunities_assigned ON opportunities(assigned_to);

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,

  -- Basic Info
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  sku TEXT,

  -- Pricing
  base_price DECIMAL(10,2),
  currency TEXT DEFAULT 'MXN',

  -- Type
  type TEXT DEFAULT 'service' CHECK (type IN ('physical', 'digital', 'service')),

  -- Physical Product Fields
  weight_kg DECIMAL(6,2),
  dimensions_cm JSONB,

  -- Media
  images TEXT[] DEFAULT '{}',

  -- Specifications
  specs JSONB DEFAULT '{}',
  deliverables TEXT[] DEFAULT '{}',
  delivery_time_days INT,

  -- Status
  active BOOLEAN DEFAULT TRUE,
  tags TEXT[] DEFAULT '{}',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_workspace ON products(workspace_id);
CREATE INDEX idx_products_active ON products(active);
CREATE INDEX idx_products_tags ON products USING GIN(tags);

-- Quotes
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,

  -- Identification
  quote_number TEXT UNIQUE NOT NULL,

  -- Parties
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,

  -- Items
  items JSONB NOT NULL,

  -- Amounts
  subtotal DECIMAL(10,2),
  tax DECIMAL(10,2),
  discount DECIMAL(10,2),
  total DECIMAL(10,2),
  currency TEXT DEFAULT 'MXN',

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'expired')),
  valid_until DATE,

  -- Tracking
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,

  -- Public Access
  public_token TEXT UNIQUE,

  -- Content
  notes TEXT,
  terms TEXT,

  -- Metadata
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quotes_workspace ON quotes(workspace_id);
CREATE INDEX idx_quotes_contact ON quotes(contact_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_public_token ON quotes(public_token);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,

  -- Identification
  order_number TEXT UNIQUE NOT NULL,

  -- Parties
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,

  -- Relationships
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,

  -- Items
  items JSONB NOT NULL,

  -- Amounts
  subtotal DECIMAL(10,2),
  tax DECIMAL(10,2),
  discount DECIMAL(10,2),
  total DECIMAL(10,2),
  currency TEXT DEFAULT 'MXN',

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),

  -- Invoicing
  alegra_invoice_id TEXT,
  alegra_invoice_number TEXT,
  invoiced_at TIMESTAMPTZ,

  -- Public Access
  public_token TEXT UNIQUE,

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_workspace ON orders(workspace_id);
CREATE INDEX idx_orders_contact ON orders(contact_id);
CREATE INDEX idx_orders_status ON orders(status);

-- ============================================================================
-- PROJECT MANAGEMENT TABLES
-- ============================================================================

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,

  -- Basic Info
  title TEXT NOT NULL,
  description TEXT,

  -- Relationships
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,

  -- Status
  stage TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold', 'cancelled')),

  -- Dates
  start_date DATE,
  due_date DATE,
  completed_at TIMESTAMPTZ,

  -- Assignment
  assigned_to UUID[] DEFAULT '{}',

  -- Public Access
  public_token TEXT UNIQUE,

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_workspace ON projects(workspace_id);
CREATE INDEX idx_projects_contact ON projects(contact_id);
CREATE INDEX idx_projects_order ON projects(order_id);
CREATE INDEX idx_projects_stage ON projects(stage);

-- Add project_id to orders (circular reference)
ALTER TABLE orders ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
CREATE INDEX idx_orders_project ON orders(project_id);

-- Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,

  -- Relationship (opportunity OR project)
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  -- Task Info
  title TEXT NOT NULL,
  description TEXT,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  completed_at TIMESTAMPTZ,

  -- Assignment
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  due_date TIMESTAMPTZ,

  -- Priority
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CHECK (
    (opportunity_id IS NOT NULL AND project_id IS NULL) OR
    (opportunity_id IS NULL AND project_id IS NOT NULL)
  )
);

CREATE INDEX idx_tasks_workspace ON tasks(workspace_id);
CREATE INDEX idx_tasks_opportunity ON tasks(opportunity_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- ============================================================================
-- FINANCIAL TABLES
-- ============================================================================

-- Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,

  -- Type
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),

  -- Relationship
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,

  -- Amount
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'MXN',

  -- Details
  category TEXT,
  description TEXT NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'transfer', 'other')),
  reference TEXT,

  -- Attachments
  attachments TEXT[] DEFAULT '{}',

  -- Date
  transaction_date DATE NOT NULL,

  -- Metadata
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_workspace ON transactions(workspace_id);
CREATE INDEX idx_transactions_order ON transactions(order_id);
CREATE INDEX idx_transactions_project ON transactions(project_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);

-- ============================================================================
-- CONFIGURATION TABLES
-- ============================================================================

-- Tags
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,

  name TEXT NOT NULL,
  category TEXT CHECK (category IN ('contact', 'opportunity', 'conversation', 'general')),
  color TEXT,
  use_count INT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(workspace_id, name)
);

CREATE INDEX idx_tags_workspace ON tags(workspace_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's workspace
CREATE OR REPLACE FUNCTION get_user_workspace_id()
RETURNS UUID AS $$
  SELECT workspace_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Workspaces: Users can only see their own workspace
CREATE POLICY "Users can view their workspace"
  ON workspaces FOR SELECT
  USING (id = get_user_workspace_id());

CREATE POLICY "Users can update their workspace"
  ON workspaces FOR UPDATE
  USING (id = get_user_workspace_id());

-- Profiles: Users can view profiles in their workspace
CREATE POLICY "Users can view profiles in their workspace"
  ON profiles FOR SELECT
  USING (workspace_id = get_user_workspace_id());

-- Generic policies for all workspace-scoped tables
CREATE POLICY "Users can view data from their workspace"
  ON contacts FOR SELECT
  USING (workspace_id = get_user_workspace_id());

CREATE POLICY "Users can insert data to their workspace"
  ON contacts FOR INSERT
  WITH CHECK (workspace_id = get_user_workspace_id());

CREATE POLICY "Users can update data in their workspace"
  ON contacts FOR UPDATE
  USING (workspace_id = get_user_workspace_id());

CREATE POLICY "Users can delete data in their workspace"
  ON contacts FOR DELETE
  USING (workspace_id = get_user_workspace_id());

-- Repeat for other tables (companies, opportunities, products, quotes, orders, projects, tasks, transactions, tags)
-- Using the same pattern

-- Companies
CREATE POLICY "workspace_select" ON companies FOR SELECT USING (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_insert" ON companies FOR INSERT WITH CHECK (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_update" ON companies FOR UPDATE USING (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_delete" ON companies FOR DELETE USING (workspace_id = get_user_workspace_id());

-- Custom Stages
CREATE POLICY "workspace_select" ON custom_stages FOR SELECT USING (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_insert" ON custom_stages FOR INSERT WITH CHECK (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_update" ON custom_stages FOR UPDATE USING (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_delete" ON custom_stages FOR DELETE USING (workspace_id = get_user_workspace_id());

-- Opportunities
CREATE POLICY "workspace_select" ON opportunities FOR SELECT USING (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_insert" ON opportunities FOR INSERT WITH CHECK (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_update" ON opportunities FOR UPDATE USING (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_delete" ON opportunities FOR DELETE USING (workspace_id = get_user_workspace_id());

-- Products
CREATE POLICY "workspace_select" ON products FOR SELECT USING (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_insert" ON products FOR INSERT WITH CHECK (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_update" ON products FOR UPDATE USING (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_delete" ON products FOR DELETE USING (workspace_id = get_user_workspace_id());

-- Quotes
CREATE POLICY "workspace_select" ON quotes FOR SELECT USING (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_insert" ON quotes FOR INSERT WITH CHECK (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_update" ON quotes FOR UPDATE USING (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_delete" ON quotes FOR DELETE USING (workspace_id = get_user_workspace_id());

-- Orders
CREATE POLICY "workspace_select" ON orders FOR SELECT USING (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_insert" ON orders FOR INSERT WITH CHECK (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_update" ON orders FOR UPDATE USING (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_delete" ON orders FOR DELETE USING (workspace_id = get_user_workspace_id());

-- Projects
CREATE POLICY "workspace_select" ON projects FOR SELECT USING (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_insert" ON projects FOR INSERT WITH CHECK (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_update" ON projects FOR UPDATE USING (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_delete" ON projects FOR DELETE USING (workspace_id = get_user_workspace_id());

-- Tasks
CREATE POLICY "workspace_select" ON tasks FOR SELECT USING (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_insert" ON tasks FOR INSERT WITH CHECK (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_update" ON tasks FOR UPDATE USING (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_delete" ON tasks FOR DELETE USING (workspace_id = get_user_workspace_id());

-- Transactions
CREATE POLICY "workspace_select" ON transactions FOR SELECT USING (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_insert" ON transactions FOR INSERT WITH CHECK (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_update" ON transactions FOR UPDATE USING (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_delete" ON transactions FOR DELETE USING (workspace_id = get_user_workspace_id());

-- Tags
CREATE POLICY "workspace_select" ON tags FOR SELECT USING (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_insert" ON tags FOR INSERT WITH CHECK (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_update" ON tags FOR UPDATE USING (workspace_id = get_user_workspace_id());
CREATE POLICY "workspace_delete" ON tags FOR DELETE USING (workspace_id = get_user_workspace_id());

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON opportunities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA: Default Pipeline Stages
-- ============================================================================

-- This will be populated per workspace when a workspace is created
-- For now, we'll create a function to initialize default stages

CREATE OR REPLACE FUNCTION initialize_default_stages(p_workspace_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Opportunity stages
  INSERT INTO custom_stages (workspace_id, type, name, color, order_index, stage_type) VALUES
    (p_workspace_id, 'opportunity', 'Lead', '#6B7280', 1, 'active'),
    (p_workspace_id, 'opportunity', 'Qualified', '#3B82F6', 2, 'active'),
    (p_workspace_id, 'opportunity', 'Proposal Sent', '#8B5CF6', 3, 'active'),
    (p_workspace_id, 'opportunity', 'Negotiation', '#F59E0B', 4, 'active'),
    (p_workspace_id, 'opportunity', 'Won', '#10B981', 5, 'won'),
    (p_workspace_id, 'opportunity', 'Lost', '#EF4444', 6, 'lost');

  -- Project stages
  INSERT INTO custom_stages (workspace_id, type, name, color, order_index, stage_type) VALUES
    (p_workspace_id, 'project', 'Planning', '#6B7280', 1, 'active'),
    (p_workspace_id, 'project', 'In Progress', '#3B82F6', 2, 'active'),
    (p_workspace_id, 'project', 'Review', '#F59E0B', 3, 'active'),
    (p_workspace_id, 'project', 'Completed', '#10B981', 4, 'active');
END;
$$ LANGUAGE plpgsql;
