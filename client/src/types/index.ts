export type UserRole = "admin" | "regional_coordinator" | "camp_manager" | "volunteer";
export type RequestStatus = "pending" | "approved" | "allocated" | "dispatched" | "delivered" | "cancelled";
export type SupplyCategory = "food" | "water" | "medicine" | "shelter" | "clothing" | "hygiene" | "tools" | "other";

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  region_id?: string;
  camp_id?: string;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Region {
  id: string;
  name: string;
  description?: string;
  coordinator_id?: string;
  coordinator_name?: string;
  center_lat?: number;
  center_lng?: number;
  is_active: boolean;
  created_at: string;
}

export interface Camp {
  id: string;
  name: string;
  region_id: string;
  region_name?: string;
  manager_id?: string;
  manager_name?: string;
  address?: string;
  lat?: number;
  lng?: number;
  capacity?: number;
  current_occupancy: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: string;
  region_id: string;
  region_name?: string;
  name: string;
  category: SupplyCategory;
  unit: string;
  quantity_available: number;
  quantity_reserved: number;
  reorder_threshold?: number;
  last_restocked_at?: string;
  created_at: string;
  updated_at: string;
}

export interface RequestItem {
  id: string;
  request_id: string;
  inventory_id: string;
  name?: string;
  category?: SupplyCategory;
  unit?: string;
  quantity_requested: number;
  quantity_allocated?: number;
  created_at: string;
}

export interface SupplyRequest {
  id: string;
  camp_id: string;
  camp_name?: string;
  region_id?: string;
  region_name?: string;
  requested_by: string;
  requester_name?: string;
  status: RequestStatus;
  priority: number;
  notes?: string;
  approved_by?: string;
  approved_at?: string;
  assigned_volunteer?: string;
  volunteer_name?: string;
  dispatched_at?: string;
  delivered_at?: string;
  cancelled_reason?: string;
  created_at: string;
  updated_at: string;
  items?: RequestItem[];
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  is_read: boolean;
  related_entity_type?: string;
  related_entity_id?: string;
  created_at: string;
}

// Demo data marker type
export interface DemoDataMeta {
  isDemo: true;
  label: "⚠️ SYNTHETIC SIMULATION DATA — NOT REAL OPERATIONS";
}
