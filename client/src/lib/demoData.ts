// ??  SYNTHETIC DEMO DATA Ã¢â‚¬â€ NOT REAL OPERATIONS
// All names, coordinates, quantities, and entities are fabricated for development/testing.

import type { Camp, InventoryItem, Region, SupplyRequest } from "../types";

export const DEMO_BANNER = "??  DEMO MODE Ã¢â‚¬â€ Synthetic data, not real operations";

export const demoRegions: Region[] = [
  { id: "reg-001", name: "North Zone", description: "Northern flood relief", center_lat: 28.7041, center_lng: 77.1025, is_active: true, created_at: "2026-10-01T00:00:00Z" },
  { id: "reg-002", name: "South Zone", description: "Southern cyclone relief", center_lat: 13.0827, center_lng: 80.2707, is_active: true, created_at: "2026-10-01T00:00:00Z" },
  { id: "reg-003", name: "East Zone", description: "Eastern earthquake relief", center_lat: 22.5726, center_lng: 88.3639, is_active: true, created_at: "2026-10-01T00:00:00Z" },
];

export const demoCamps: Camp[] = [
  { id: "camp-001", name: "Alpha Relief Camp", region_id: "reg-001", region_name: "North Zone", lat: 28.6139, lng: 77.2090, capacity: 500, current_occupancy: 342, is_active: true, created_at: "2026-10-01T00:00:00Z", updated_at: "2026-10-20T00:00:00Z" },
  { id: "camp-002", name: "Beta Shelter", region_id: "reg-001", region_name: "North Zone", lat: 28.9845, lng: 77.7064, capacity: 300, current_occupancy: 287, is_active: true, created_at: "2026-10-01T00:00:00Z", updated_at: "2026-10-20T00:00:00Z" },
  { id: "camp-003", name: "Chennai Relief Hub", region_id: "reg-002", region_name: "South Zone", lat: 13.0827, lng: 80.2707, capacity: 800, current_occupancy: 612, is_active: true, created_at: "2026-10-01T00:00:00Z", updated_at: "2026-10-20T00:00:00Z" },
  { id: "camp-004", name: "Kolkata Aid Center", region_id: "reg-003", region_name: "East Zone", lat: 22.5726, lng: 88.3639, capacity: 400, current_occupancy: 198, is_active: true, created_at: "2026-10-01T00:00:00Z", updated_at: "2026-10-20T00:00:00Z" },
];

export const demoInventory: InventoryItem[] = [
  { id: "inv-001", region_id: "reg-001", region_name: "North Zone", name: "Rice (5kg bags)", category: "food", unit: "bags", quantity_available: 320, quantity_reserved: 80, reorder_threshold: 50, created_at: "2026-10-01T00:00:00Z", updated_at: "2026-10-22T00:00:00Z" },
  { id: "inv-002", region_id: "reg-001", region_name: "North Zone", name: "Bottled Water (1L)", category: "water", unit: "bottles", quantity_available: 1500, quantity_reserved: 500, reorder_threshold: 200, created_at: "2026-10-01T00:00:00Z", updated_at: "2026-10-22T00:00:00Z" },
  { id: "inv-003", region_id: "reg-001", region_name: "North Zone", name: "First Aid Kits", category: "medicine", unit: "kits", quantity_available: 87, quantity_reserved: 13, reorder_threshold: 20, created_at: "2026-10-01T00:00:00Z", updated_at: "2026-10-22T00:00:00Z" },
  { id: "inv-004", region_id: "reg-001", region_name: "North Zone", name: "Emergency Blankets", category: "shelter", unit: "units", quantity_available: 210, quantity_reserved: 90, reorder_threshold: 30, created_at: "2026-10-01T00:00:00Z", updated_at: "2026-10-22T00:00:00Z" },
  { id: "inv-005", region_id: "reg-002", region_name: "South Zone", name: "Rice (5kg bags)", category: "food", unit: "bags", quantity_available: 560, quantity_reserved: 140, reorder_threshold: 80, created_at: "2026-10-01T00:00:00Z", updated_at: "2026-10-22T00:00:00Z" },
  { id: "inv-006", region_id: "reg-002", region_name: "South Zone", name: "Tarpaulin Sheets", category: "shelter", unit: "sheets", quantity_available: 245, quantity_reserved: 55, reorder_threshold: 40, created_at: "2026-10-01T00:00:00Z", updated_at: "2026-10-22T00:00:00Z" },
  { id: "inv-007", region_id: "reg-003", region_name: "East Zone", name: "Emergency Rations", category: "food", unit: "packs", quantity_available: 420, quantity_reserved: 80, reorder_threshold: 60, created_at: "2026-10-01T00:00:00Z", updated_at: "2026-10-22T00:00:00Z" },
  { id: "inv-008", region_id: "reg-003", region_name: "East Zone", name: "Medicines Bundle", category: "medicine", unit: "bundles", quantity_available: 8, quantity_reserved: 2, reorder_threshold: 15, created_at: "2026-10-01T00:00:00Z", updated_at: "2026-10-22T00:00:00Z" },
];

export const demoRequests: SupplyRequest[] = [
  {
    id: "req-001",
    camp_id: "camp-001",
    camp_name: "Alpha Relief Camp",
    requested_by: "demo-manager-001",
    requester_name: "Demo Camp Manager",
    status: "pending",
    priority: 1,
    notes: "Urgent Ã¢â‚¬â€ 50 families displaced yesterday",
    created_at: "2026-10-23T06:00:00Z",
    updated_at: "2026-10-23T06:00:00Z",
    items: [
      { id: "ri-001", request_id: "req-001", inventory_id: "inv-001", name: "Rice (5kg bags)", category: "food", unit: "bags", quantity_requested: 50, created_at: "2026-10-23T06:00:00Z" },
      { id: "ri-002", request_id: "req-001", inventory_id: "inv-002", name: "Bottled Water (1L)", category: "water", unit: "bottles", quantity_requested: 200, created_at: "2026-10-23T06:00:00Z" },
    ],
  },
  {
    id: "req-002",
    camp_id: "camp-002",
    camp_name: "Beta Shelter",
    requested_by: "demo-manager-002",
    requester_name: "Beta Manager",
    status: "allocated",
    priority: 2,
    assigned_volunteer: "demo-volunteer-001",
    volunteer_name: "Demo Volunteer",
    created_at: "2026-10-22T14:00:00Z",
    updated_at: "2026-10-22T16:00:00Z",
    items: [
      { id: "ri-003", request_id: "req-002", inventory_id: "inv-004", name: "Emergency Blankets", category: "shelter", unit: "units", quantity_requested: 30, quantity_allocated: 30, created_at: "2026-10-22T14:00:00Z" },
    ],
  },
  {
    id: "req-003",
    camp_id: "camp-003",
    camp_name: "Chennai Relief Hub",
    requested_by: "demo-manager-003",
    requester_name: "Chennai Manager",
    status: "delivered",
    priority: 3,
    assigned_volunteer: "demo-volunteer-002",
    volunteer_name: "Volunteer Singh",
    dispatched_at: "2026-10-21T09:00:00Z",
    delivered_at: "2026-10-21T14:30:00Z",
    created_at: "2026-10-20T08:00:00Z",
    updated_at: "2026-10-21T14:30:00Z",
    items: [
      { id: "ri-004", request_id: "req-003", inventory_id: "inv-005", name: "Rice (5kg bags)", category: "food", unit: "bags", quantity_requested: 100, quantity_allocated: 100, created_at: "2026-10-20T08:00:00Z" },
    ],
  },
];
