-- Unify Sales Workflow: Link Quotes to Opportunities
-- This migration connects quotes to opportunities and adds automation

-- 1. Add opportunity_id to quotes table
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_quotes_opportunity ON quotes(opportunity_id);

-- 2. Add workspace settings for quote/order numbering
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS quote_settings JSONB DEFAULT '{
  "prefix": "Q",
  "next_number": 1,
  "number_format": "{prefix}-{year}-{number:04}",
  "logo_url": null,
  "auto_create_order_on_accept": true
}'::jsonb;

ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS order_settings JSONB DEFAULT '{
  "prefix": "ORD",
  "next_number": 1,
  "number_format": "{prefix}-{year}-{number:04}",
  "auto_create_project_on_complete": false
}'::jsonb;

-- 3. Function to generate next quote number
CREATE OR REPLACE FUNCTION generate_quote_number(p_workspace_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_settings JSONB;
  v_prefix TEXT;
  v_next_number INT;
  v_format TEXT;
  v_year TEXT;
  v_result TEXT;
BEGIN
  -- Get workspace quote settings
  SELECT quote_settings INTO v_settings
  FROM workspaces
  WHERE id = p_workspace_id;

  -- Extract settings
  v_prefix := COALESCE(v_settings->>'prefix', 'Q');
  v_next_number := COALESCE((v_settings->>'next_number')::INT, 1);
  v_format := COALESCE(v_settings->>'number_format', '{prefix}-{year}-{number:04}');
  v_year := TO_CHAR(NOW(), 'YYYY');

  -- Generate quote number
  v_result := REPLACE(v_format, '{prefix}', v_prefix);
  v_result := REPLACE(v_result, '{year}', v_year);
  v_result := REPLACE(v_result, '{number:04}', LPAD(v_next_number::TEXT, 4, '0'));

  -- Increment next_number
  UPDATE workspaces
  SET quote_settings = jsonb_set(
    quote_settings,
    '{next_number}',
    TO_JSONB(v_next_number + 1)
  )
  WHERE id = p_workspace_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 4. Function to generate next order number
CREATE OR REPLACE FUNCTION generate_order_number(p_workspace_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_settings JSONB;
  v_prefix TEXT;
  v_next_number INT;
  v_format TEXT;
  v_year TEXT;
  v_result TEXT;
BEGIN
  -- Get workspace order settings
  SELECT order_settings INTO v_settings
  FROM workspaces
  WHERE id = p_workspace_id;

  -- Extract settings
  v_prefix := COALESCE(v_settings->>'prefix', 'ORD');
  v_next_number := COALESCE((v_settings->>'next_number')::INT, 1);
  v_format := COALESCE(v_settings->>'number_format', '{prefix}-{year}-{number:04}');
  v_year := TO_CHAR(NOW(), 'YYYY');

  -- Generate order number
  v_result := REPLACE(v_format, '{prefix}', v_prefix);
  v_result := REPLACE(v_result, '{year}', v_year);
  v_result := REPLACE(v_result, '{number:04}', LPAD(v_next_number::TEXT, 4, '0'));

  -- Increment next_number
  UPDATE workspaces
  SET order_settings = jsonb_set(
    order_settings,
    '{next_number}',
    TO_JSONB(v_next_number + 1)
  )
  WHERE id = p_workspace_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 5. Function: Auto-create order when quote is accepted
CREATE OR REPLACE FUNCTION auto_create_order_from_quote()
RETURNS TRIGGER AS $$
DECLARE
  v_workspace_id UUID;
  v_auto_create BOOLEAN;
  v_order_number TEXT;
  v_order_id UUID;
BEGIN
  -- Only proceed if status changed to 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN

    -- Get workspace settings
    SELECT
      workspace_id,
      COALESCE((quote_settings->>'auto_create_order_on_accept')::BOOLEAN, true)
    INTO v_workspace_id, v_auto_create
    FROM workspaces w
    JOIN quotes q ON q.workspace_id = w.id
    WHERE q.id = NEW.id;

    -- Only create order if auto-create is enabled and no order exists yet
    IF v_auto_create THEN
      -- Check if order already exists for this quote
      IF NOT EXISTS (SELECT 1 FROM orders WHERE quote_id = NEW.id) THEN

        -- Generate order number
        v_order_number := generate_order_number(v_workspace_id);

        -- Create order
        INSERT INTO orders (
          workspace_id,
          order_number,
          contact_id,
          opportunity_id,
          quote_id,
          items,
          subtotal,
          tax,
          discount,
          total,
          currency,
          status,
          notes
        ) VALUES (
          v_workspace_id,
          v_order_number,
          NEW.contact_id,
          NEW.opportunity_id,
          NEW.id,
          NEW.items,
          NEW.subtotal,
          NEW.tax,
          NEW.discount,
          NEW.total,
          NEW.currency,
          'pending',
          'Orden creada automáticamente desde cotización ' || NEW.quote_number
        )
        RETURNING id INTO v_order_id;

        -- Update opportunity to "won" if linked
        IF NEW.opportunity_id IS NOT NULL THEN
          UPDATE opportunities
          SET won_at = NOW()
          WHERE id = NEW.opportunity_id
          AND won_at IS NULL; -- Don't overwrite if already won
        END IF;

        RAISE NOTICE 'Auto-created order % from quote %', v_order_number, NEW.quote_number;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto order creation
DROP TRIGGER IF EXISTS trigger_auto_create_order_from_quote ON quotes;
CREATE TRIGGER trigger_auto_create_order_from_quote
  AFTER UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_order_from_quote();

-- 6. Function: Sync opportunity stage when quote is created/sent
CREATE OR REPLACE FUNCTION sync_opportunity_stage_from_quote()
RETURNS TRIGGER AS $$
DECLARE
  v_proposal_stage TEXT;
BEGIN
  -- Only if quote is linked to an opportunity
  IF NEW.opportunity_id IS NOT NULL THEN

    -- Get the "Propuesta" stage name for this workspace
    -- Try to find a stage with type 'active' and name containing 'propuesta'
    SELECT name INTO v_proposal_stage
    FROM custom_stages
    WHERE workspace_id = NEW.workspace_id
    AND type = 'opportunity'
    AND stage_type = 'active'
    AND (
      LOWER(name) LIKE '%propuesta%' OR
      LOWER(name) LIKE '%proposal%' OR
      LOWER(name) LIKE '%cotiz%' OR
      LOWER(name) LIKE '%quote%'
    )
    ORDER BY order_index
    LIMIT 1;

    -- Fallback to any active stage
    IF v_proposal_stage IS NULL THEN
      SELECT name INTO v_proposal_stage
      FROM custom_stages
      WHERE workspace_id = NEW.workspace_id
      AND type = 'opportunity'
      AND stage_type = 'active'
      ORDER BY order_index
      LIMIT 1;
    END IF;

    -- Update opportunity stage if we found a stage and opportunity isn't won/lost
    IF v_proposal_stage IS NOT NULL THEN
      UPDATE opportunities
      SET stage = v_proposal_stage
      WHERE id = NEW.opportunity_id
      AND won_at IS NULL
      AND lost_at IS NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for opportunity stage sync
DROP TRIGGER IF EXISTS trigger_sync_opportunity_stage_from_quote ON quotes;
CREATE TRIGGER trigger_sync_opportunity_stage_from_quote
  AFTER INSERT OR UPDATE ON quotes
  FOR EACH ROW
  WHEN (NEW.status IN ('sent', 'viewed'))
  EXECUTE FUNCTION sync_opportunity_stage_from_quote();

-- 7. Add helper view for sales pipeline
CREATE OR REPLACE VIEW sales_pipeline AS
SELECT
  o.id AS opportunity_id,
  o.workspace_id,
  o.title AS opportunity_title,
  o.stage AS opportunity_stage,
  o.amount,
  o.currency,
  o.probability,
  o.won_at,
  o.lost_at,
  o.contact_id,
  c.name AS contact_name,
  c.email AS contact_email,

  -- Quote info (latest quote)
  q.id AS quote_id,
  q.quote_number,
  q.status AS quote_status,
  q.total AS quote_total,
  q.sent_at AS quote_sent_at,
  q.accepted_at AS quote_accepted_at,

  -- Order info
  ord.id AS order_id,
  ord.order_number,
  ord.status AS order_status,
  ord.total AS order_total,

  -- Project info
  p.id AS project_id,
  p.title AS project_title,
  p.status AS project_status

FROM opportunities o
LEFT JOIN contacts c ON o.contact_id = c.id
LEFT JOIN LATERAL (
  SELECT * FROM quotes
  WHERE opportunity_id = o.id
  ORDER BY created_at DESC
  LIMIT 1
) q ON true
LEFT JOIN orders ord ON ord.opportunity_id = o.id
LEFT JOIN projects p ON p.order_id = ord.id;

COMMENT ON VIEW sales_pipeline IS 'Unified view of the complete sales pipeline from opportunity to project';
