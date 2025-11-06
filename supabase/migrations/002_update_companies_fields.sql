-- Migration: Update companies table fields
-- Remove industry and size, add address and social media fields

-- Remove old fields
ALTER TABLE companies
  DROP COLUMN IF EXISTS industry,
  DROP COLUMN IF EXISTS size;

-- Add new fields
ALTER TABLE companies
  ADD COLUMN address TEXT,
  ADD COLUMN linkedin_url TEXT,
  ADD COLUMN facebook_url TEXT,
  ADD COLUMN instagram_url TEXT,
  ADD COLUMN twitter_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN companies.address IS 'Physical address of the company';
COMMENT ON COLUMN companies.linkedin_url IS 'LinkedIn profile URL';
COMMENT ON COLUMN companies.facebook_url IS 'Facebook page URL';
COMMENT ON COLUMN companies.instagram_url IS 'Instagram profile URL';
COMMENT ON COLUMN companies.twitter_url IS 'Twitter/X profile URL';
