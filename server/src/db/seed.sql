-- ============================================================================
-- DisplaceOS Synthetic Demo Seed Data — Uttarakhand, India
-- DISCLAIMER: All facilities, personnel, contact numbers, and supplies listed
-- here are strictly FICTIONAL and for development and demonstration only.
-- They do not represent real-world operational camps or government affiliations.
-- ============================================================================

-- Seed Uttarakhand Regions (Garhwal, Kumaon, and High-Altitude Frontier)
INSERT INTO regions (id, name, description, center_lat, center_lng, is_active) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Garhwal Central Division', 'Fictional disaster relief coordination zone covering Dehradun, Haridwar, Tehri, and Rishikesh hubs.', 30.1500, 78.3000, true),
  ('a1b2c3d4-0000-0000-0000-000000000002', 'Alaknanda & Mandakini Valley', 'Fictional mountain relief corridor covering Rudraprayag, Chamoli, and landslide-affected access roads.', 30.3800, 79.1500, true),
  ('a1b2c3d4-0000-0000-0000-000000000003', 'Kumaon Division & Pithoragarh', 'Fictional eastern hill district relief sector covering Nainital, Almora, and Pithoragarh transit depots.', 29.5800, 79.6500, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  center_lat = EXCLUDED.center_lat,
  center_lng = EXCLUDED.center_lng,
  is_active = EXCLUDED.is_active;

-- Seed Fictional Relief Camps
INSERT INTO camps (id, region_id, name, address, lat, lng, capacity, current_occupancy, is_active) VALUES
  ('c1b2c3d4-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000001', 'Maldevta Relief Shelter (Fictional)', 'Maldevta Valley Road, Raipur Block, Dehradun District, Uttarakhand 248008', 30.3340, 78.1250, 450, 180, true),
  ('c1b2c3d4-0000-0000-0000-000000000002', 'a1b2c3d4-0000-0000-0000-000000000002', 'Rudraprayag Sangam Evacuation Camp (Fictional)', 'Near Alaknanda Confluence, Rudraprayag District, Uttarakhand 246171', 30.2850, 78.9810, 350, 220, true),
  ('c1b2c3d4-0000-0000-0000-000000000003', 'a1b2c3d4-0000-0000-0000-000000000002', 'Joshimath-Pipalkoti Transit Camp (Fictional)', 'NH-07 Road Head, Chamoli District, Uttarakhand 246472', 30.4300, 79.3300, 280, 140, true),
  ('c1b2c3d4-0000-0000-0000-000000000004', 'a1b2c3d4-0000-0000-0000-000000000003', 'Nainital Valley Emergency Shelter (Fictional)', 'Bhowali-Bhimtal Bypass, Nainital District, Uttarakhand 263132', 29.3800, 79.5200, 300, 95, true),
  ('c1b2c3d4-0000-0000-0000-000000000005', 'a1b2c3d4-0000-0000-0000-000000000003', 'Pithoragarh Foothills Staging Base (Fictional)', 'Chandak Road, Pithoragarh District, Uttarakhand 262501', 29.5820, 80.2180, 200, 60, true),
  ('c1b2c3d4-0000-0000-0000-000000000006', 'a1b2c3d4-0000-0000-0000-000000000001', 'Haridwar Ganga Basin Camp (Fictional)', 'Laksar Road, Haridwar District, Uttarakhand 249408', 29.9320, 78.1350, 500, 310, true)
ON CONFLICT (id) DO UPDATE SET
  region_id = EXCLUDED.region_id,
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  capacity = EXCLUDED.capacity,
  current_occupancy = EXCLUDED.current_occupancy,
  is_active = EXCLUDED.is_active;

-- Seed Fictional Inventory (Locally relevant Himalayan relief items)
-- Note: inv-001 (Rice) and inv-002 (Water) retain baseline available/reserved quantities for test compatibility.
INSERT INTO inventory (id, region_id, name, category, unit, quantity_available, quantity_reserved, reorder_threshold) VALUES
  ('d1b2c3d4-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000001', 'Non-Perishable Rice (10kg Ration Bags)', 'food', 'bags', 500, 50, 100),
  ('d1b2c3d4-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000001', 'Packaged Drinking Water (20L Jerry Cans)', 'water', 'cans', 2000, 200, 300),
  ('d1b2c3d4-0000-0000-0000-000000000003', 'a1b2c3d4-0000-0000-0000-000000000001', 'Whole Wheat Atta (10kg Sacks)', 'food', 'sacks', 350, 40, 80),
  ('d1b2c3d4-0000-0000-0000-000000000004', 'a1b2c3d4-0000-0000-0000-000000000001', 'Arhar & Chana Dal (5kg Bags)', 'food', 'bags', 420, 30, 75),
  ('d1b2c3d4-0000-0000-0000-000000000005', 'a1b2c3d4-0000-0000-0000-000000000001', 'Heavy Woolen Blankets (Thermal)', 'clothing', 'units', 600, 80, 150),
  ('d1b2c3d4-0000-0000-0000-000000000006', 'a1b2c3d4-0000-0000-0000-000000000001', 'Heavy-Duty Waterproof Tarpaulins (12x18 ft)', 'shelter', 'tarps', 280, 50, 60),
  ('d1b2c3d4-0000-0000-0000-000000000007', 'a1b2c3d4-0000-0000-0000-000000000001', 'Emergency Trauma First-Aid & Dressing Kits', 'medicine', 'kits', 180, 20, 40),
  ('d1b2c3d4-0000-0000-0000-000000000008', 'a1b2c3d4-0000-0000-0000-000000000001', 'WHO-Standard ORS Rehydration Packets (Box of 50)', 'medicine', 'boxes', 750, 100, 150),
  ('d1b2c3d4-0000-0000-0000-000000000009', 'a1b2c3d4-0000-0000-0000-000000000001', 'Family Hygiene & Sanitation Kits', 'hygiene', 'kits', 320, 45, 70),
  ('d1b2c3d4-0000-0000-0000-000000000010', 'a1b2c3d4-0000-0000-0000-000000000001', 'Sanitary Pads (Multipack of 24)', 'hygiene', 'packs', 850, 120, 200),
  ('d1b2c3d4-0000-0000-0000-000000000011', 'a1b2c3d4-0000-0000-0000-000000000001', 'Infant Care Supplies (Baby Formula & Feeding Kits)', 'other', 'kits', 140, 25, 35)
ON CONFLICT (id) DO UPDATE SET
  region_id = EXCLUDED.region_id,
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  unit = EXCLUDED.unit,
  quantity_available = EXCLUDED.quantity_available,
  quantity_reserved = EXCLUDED.quantity_reserved,
  reorder_threshold = EXCLUDED.reorder_threshold;
