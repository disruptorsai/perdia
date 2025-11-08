-- Create clients table for legacy compatibility
-- This table is from the Base44 migration but not actively used in Perdia Education
-- Keeping it to prevent 404 errors from legacy components

CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  hourly_rate NUMERIC(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  color TEXT DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT TRUE,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Users can only see their own clients
CREATE POLICY "Users can view own clients"
  ON public.clients
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own clients
CREATE POLICY "Users can create own clients"
  ON public.clients
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own clients
CREATE POLICY "Users can update own clients"
  ON public.clients
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own clients
CREATE POLICY "Users can delete own clients"
  ON public.clients
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_date trigger
CREATE OR REPLACE FUNCTION update_clients_updated_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_date = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clients_updated_date_trigger
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION update_clients_updated_date();

-- Create indexes
CREATE INDEX idx_clients_user_id ON public.clients(user_id);
CREATE INDEX idx_clients_name ON public.clients(name);
CREATE INDEX idx_clients_is_active ON public.clients(is_active);

-- Add comments
COMMENT ON TABLE public.clients IS 'Legacy table from Base44 migration - not actively used in Perdia Education';
COMMENT ON COLUMN public.clients.name IS 'Client or company name';
COMMENT ON COLUMN public.clients.hourly_rate IS 'Hourly billing rate';
COMMENT ON COLUMN public.clients.currency IS 'Currency code (USD, EUR, GBP, etc.)';
COMMENT ON COLUMN public.clients.color IS 'UI color for client identification';
