-- DisplaceOS Database Schema
-- WARNING: DEMO/SEED DATA is in seed.sql â€” not this file.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE user_role AS ENUM ('admin', 'regional_coordinator', 'camp_manager', 'volunteer');
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'allocated', 'dispatched', 'delivered', 'cancelled');
CREATE TYPE supply_category AS ENUM ('food', 'water', 'medicine', 'shelter', 'clothing', 'hygiene', 'tools', 'other');

-- Profiles extend Supabase auth.users
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'volunteer',
  region_id UUID,
  camp_id UUID,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  coordinator_id UUID REFERENCES profiles(id),
  center_lat DOUBLE PRECISION,
  center_lng DOUBLE PRECISION,
  geom_boundary JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS camps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  region_id UUID NOT NULL REFERENCES regions(id),
  manager_id UUID REFERENCES profiles(id),
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  capacity INTEGER,
  current_occupancy INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ADD CONSTRAINT profiles_region_fk FOREIGN KEY (region_id) REFERENCES regions(id);
ALTER TABLE profiles ADD CONSTRAINT profiles_camp_fk FOREIGN KEY (camp_id) REFERENCES camps(id);

CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  region_id UUID NOT NULL REFERENCES regions(id),
  name TEXT NOT NULL,
  category supply_category NOT NULL DEFAULT 'other',
  unit TEXT NOT NULL DEFAULT 'units',
  quantity_available INTEGER NOT NULL DEFAULT 0,
  quantity_reserved INTEGER NOT NULL DEFAULT 0,
  reorder_threshold INTEGER DEFAULT 10,
  last_restocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT qty_avail_non_neg CHECK (quantity_available >= 0),
  CONSTRAINT qty_res_non_neg CHECK (quantity_reserved >= 0)
);

CREATE TABLE IF NOT EXISTS supply_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  camp_id UUID NOT NULL REFERENCES camps(id),
  requested_by UUID NOT NULL REFERENCES profiles(id),
  status request_status NOT NULL DEFAULT 'pending',
  priority INTEGER NOT NULL DEFAULT 2 CHECK (priority BETWEEN 1 AND 5),
  notes TEXT,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  assigned_volunteer UUID REFERENCES profiles(id),
  dispatched_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS request_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES supply_requests(id) ON DELETE CASCADE,
  inventory_id UUID NOT NULL REFERENCES inventory(id),
  quantity_requested INTEGER NOT NULL CHECK (quantity_requested > 0),
  quantity_allocated INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  related_entity_type TEXT,
  related_entity_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_requests_status ON supply_requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_camp ON supply_requests(camp_id);
CREATE INDEX IF NOT EXISTS idx_inventory_region ON inventory(region_id);
CREATE INDEX IF NOT EXISTS idx_notif_user_unread ON notifications(user_id) WHERE is_read = false;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_upd BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_camps_upd BEFORE UPDATE ON camps FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_inventory_upd BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_requests_upd BEFORE UPDATE ON supply_requests FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE camps ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_read" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "regions_read" ON regions FOR SELECT TO authenticated USING (true);
CREATE POLICY "camps_read" ON camps FOR SELECT TO authenticated USING (true);
CREATE POLICY "inventory_read" ON inventory FOR SELECT TO authenticated USING (true);
CREATE POLICY "inventory_write" ON inventory FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'regional_coordinator'))
);
CREATE POLICY "requests_read" ON supply_requests FOR SELECT TO authenticated USING (
  requested_by = auth.uid() OR assigned_volunteer = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'regional_coordinator'))
);
CREATE POLICY "requests_insert" ON supply_requests FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('camp_manager', 'admin'))
);
CREATE POLICY "notifications_own" ON notifications FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "activity_read" ON activity_log FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'regional_coordinator'))
  OR actor_id = auth.uid()
);
