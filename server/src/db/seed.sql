-- ??  SYNTHETIC DEMO DATA â€” NOT REAL OPERATIONS
-- This data is for development and demonstration only.
-- All names, coordinates, and quantities are fabricated.

-- Seed regions
INSERT INTO regions (id, name, description, center_lat, center_lng) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'North Zone', 'Northern flood relief region', 28.7041, 77.1025),
  ('a1b2c3d4-0000-0000-0000-000000000002', 'South Zone', 'Southern cyclone relief region', 13.0827, 80.2707),
  ('a1b2c3d4-0000-0000-0000-000000000003', 'East Zone', 'Eastern earthquake relief region', 22.5726, 88.3639)
ON CONFLICT DO NOTHING;

-- Seed inventory (demo stock)
INSERT INTO inventory (region_id, name, category, unit, quantity_available, reorder_threshold) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Rice (5kg bags)', 'food', 'bags', 500, 50),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Bottled Water (1L)', 'water', 'bottles', 2000, 200),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'First Aid Kits', 'medicine', 'kits', 150, 20),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Emergency Blankets', 'shelter', 'units', 300, 30),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Hygiene Kits', 'hygiene', 'kits', 200, 25),
  ('a1b2c3d4-0000-0000-0000-000000000002', 'Rice (5kg bags)', 'food', 'bags', 800, 80),
  ('a1b2c3d4-0000-0000-0000-000000000002', 'Bottled Water (1L)', 'water', 'bottles', 3000, 300),
  ('a1b2c3d4-0000-0000-0000-000000000002', 'Tarpaulin Sheets', 'shelter', 'sheets', 400, 40),
  ('a1b2c3d4-0000-0000-0000-000000000003', 'Emergency Rations', 'food', 'packs', 600, 60),
  ('a1b2c3d4-0000-0000-0000-000000000003', 'Medicines Bundle', 'medicine', 'bundles', 100, 15)
ON CONFLICT DO NOTHING;
