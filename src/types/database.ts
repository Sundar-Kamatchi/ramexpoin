/**
 * Database Type Definitions for Ramsamy Exports & Import Pvt Ltd
 * 
 * This file contains TypeScript type definitions for all database tables
 * to ensure type safety and consistency across the application.
 */

// ============================================================================
// SUPPLIERS TABLE
// ============================================================================
export interface Supplier {
  id: number;
  name: string;
  contact_name?: string;
  phone?: string;
  address?: string;
  created_at: string;
}

export interface SupplierInsert {
  name: string;
  contact_name?: string;
  phone?: string;
  address?: string;
}

export interface SupplierUpdate {
  name?: string;
  contact_name?: string;
  phone?: string;
  address?: string;
}

// ============================================================================
// ITEM_MASTER TABLE
// ============================================================================
export interface ItemMaster {
  id: string; // UUID
  item_name: string;
  item_unit?: string;
  hsn_code?: string;
  created_at: string;
}

export interface ItemMasterInsert {
  item_name: string;
  item_unit?: string;
  hsn_code?: string;
}

export interface ItemMasterUpdate {
  item_name?: string;
  item_unit?: string;
  hsn_code?: string;
}

// ============================================================================
// GAP_ITEMS TABLE
// ============================================================================
export interface GapItem {
  id: string; // UUID
  name: string;
  created_at: string;
}

export interface GapItemInsert {
  name: string;
}

export interface GapItemUpdate {
  name?: string;
}

// ============================================================================
// PURCHASE_ORDERS TABLE
// ============================================================================
export interface PurchaseOrder {
  id: number;
  vouchernumber?: string;
  date: string; // Date string
  supplier_id: number;
  item_id: string; // UUID
  quantity: number;
  rate?: number;
  cargo?: number;
  damage_allowed_kgs_ton?: number;
  podi_rate?: number;
  created_at: string;
  updated_at: string;
  tally_posted: boolean;
  tally_posted_at?: string;
  tally_response?: string;
  admin_remark?: string;
  po_closed?: boolean;
}

export interface PurchaseOrderInsert {
  vouchernumber?: string;
  date: string;
  supplier_id: number;
  item_id: string;
  quantity: number;
  rate?: number;
  cargo?: number;
  damage_allowed_kgs_ton?: number;
  podi_rate?: number;
  admin_remark?: string;
  po_closed?: boolean;
}

export interface PurchaseOrderUpdate {
  vouchernumber?: string;
  date?: string;
  supplier_id?: number;
  item_id?: string;
  quantity?: number;
  rate?: number;
  cargo?: number;
  damage_allowed_kgs_ton?: number;
  podi_rate?: number;
  tally_posted?: boolean;
  tally_posted_at?: string;
  tally_response?: string;
  admin_remark?: string;
  po_closed?: boolean;
}

// ============================================================================
// PRE_GR_ENTRY TABLE
// ============================================================================
export interface PreGREntry {
  id: number;
  vouchernumber?: string;
  date: string; // Date string
  supplier_id: number;
  item_id: string; // UUID
  gap_item1_id?: string; // UUID
  gap_item2_id?: string; // UUID
  quantity: number;
  rate?: number;
  cargo?: number;
  ladden_wt?: number;
  empty_wt?: number;
  net_wt?: number;
  doubles?: number;
  weight_shortage?: number;
  created_at: string;
  updated_at: string;
  bags?: number;
  loaded_from?: string;
  vehicle_no?: string;
  weight_bridge_name?: string;
  prepared_by?: string;
  gr_no?: string;
  gr_dt?: string; // Date string
  po_id: number;
  sieve_no?: string;
  is_admin_approved?: boolean;
  admin_remark?: string;
  gap_item1_bags?: number;
  gap_item2_bags?: number;
  podi_bags?: number;
  advance_paid?: number;
  admin_approved_advance?: number;
  is_gqr_created?: boolean;
  remarks?: string;
}

export interface PreGREntryInsert {
  vouchernumber?: string;
  date: string;
  supplier_id: number;
  item_id: string;
  gap_item1_id?: string;
  gap_item2_id?: string;
  quantity: number;
  rate?: number;
  cargo?: number;
  ladden_wt?: number;
  empty_wt?: number;
  net_wt?: number;
  doubles?: number;
  weight_shortage?: number;
  bags?: number;
  loaded_from?: string;
  vehicle_no?: string;
  weight_bridge_name?: string;
  prepared_by?: string;
  gr_no?: string;
  gr_dt?: string;
  po_id: number;
  sieve_no?: string;
  is_admin_approved?: boolean;
  admin_remark?: string;
  gap_item1_bags?: number;
  gap_item2_bags?: number;
  podi_bags?: number;
  advance_paid?: number;
  admin_approved_advance?: number;
  is_gqr_created?: boolean;
  remarks?: string;
}

export interface PreGREntryUpdate {
  vouchernumber?: string;
  date?: string;
  supplier_id?: number;
  item_id?: string;
  gap_item1_id?: string;
  gap_item2_id?: string;
  quantity?: number;
  rate?: number;
  cargo?: number;
  ladden_wt?: number;
  empty_wt?: number;
  net_wt?: number;
  doubles?: number;
  weight_shortage?: number;
  bags?: number;
  loaded_from?: string;
  vehicle_no?: string;
  weight_bridge_name?: string;
  prepared_by?: string;
  gr_no?: string;
  gr_dt?: string;
  po_id?: number;
  sieve_no?: string;
  is_admin_approved?: boolean;
  admin_remark?: string;
  gap_item1_bags?: number;
  gap_item2_bags?: number;
  podi_bags?: number;
  advance_paid?: number;
  admin_approved_advance?: number;
  is_gqr_created?: boolean;
  remarks?: string;
}

// ============================================================================
// GQR_ENTRY TABLE
// ============================================================================
export interface GQREntry {
  id: number;
  pre_gr_id: number;
  date: string; // Date string
  rot_weight?: number;
  doubles_weight?: number;
  sand_weight?: number;
  net_wt?: number;
  export_quality_weight?: number;
  podi_weight?: number;
  gap_items_weight?: number;
  total_value_received?: number;
  created_at: string;
  updated_at: string;
  volatile_po_rate?: number;
  volatile_gap_item_rate?: number;
  volatile_podi_rate?: number;
  volatile_wastage_kgs_per_ton?: number;
  gqr_status: string; // Default: 'Open'
}

export interface GQREntryInsert {
  pre_gr_id: number;
  date: string;
  rot_weight?: number;
  doubles_weight?: number;
  sand_weight?: number;
  net_wt?: number;
  export_quality_weight?: number;
  podi_weight?: number;
  gap_items_weight?: number;
  total_value_received?: number;
  volatile_po_rate?: number;
  volatile_gap_item_rate?: number;
  volatile_podi_rate?: number;
  volatile_wastage_kgs_per_ton?: number;
  gqr_status?: string;
}

export interface GQREntryUpdate {
  pre_gr_id?: number;
  date?: string;
  rot_weight?: number;
  doubles_weight?: number;
  sand_weight?: number;
  net_wt?: number;
  export_quality_weight?: number;
  podi_weight?: number;
  gap_items_weight?: number;
  total_value_received?: number;
  volatile_po_rate?: number;
  volatile_gap_item_rate?: number;
  volatile_podi_rate?: number;
  volatile_wastage_kgs_per_ton?: number;
  gqr_status?: string;
}

// ============================================================================
// USER_PROFILES TABLE
// ============================================================================
export interface UserProfile {
  id: string; // UUID (references auth.users)
  full_name?: string;
  email?: string;
  avatar_url?: string;
  role: 'user' | 'admin';
  updated_at: string;
}

export interface UserProfileInsert {
  id: string; // UUID (references auth.users)
  full_name?: string;
  email?: string;
  avatar_url?: string;
  role?: 'user' | 'admin';
}

export interface UserProfileUpdate {
  full_name?: string;
  email?: string;
  avatar_url?: string;
  role?: 'user' | 'admin';
}

// ============================================================================
// UNITS TABLE
// ============================================================================
export interface Unit {
  id: number;
  quantity: string;
  quantity_type?: string;
  uqc_code: string;
  created_at: string;
}

export interface UnitInsert {
  quantity: string;
  quantity_type?: string;
  uqc_code: string;
}

export interface UnitUpdate {
  quantity?: string;
  quantity_type?: string;
  uqc_code?: string;
}

// ============================================================================
// AUTH.USERS TABLE (Supabase Built-in)
// ============================================================================
export interface AuthUser {
  id: string; // UUID
  email?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
  email_confirmed_at?: string;
  phone_confirmed_at?: string;
  last_sign_in_at?: string;
  app_metadata?: Record<string, any>;
  user_metadata?: Record<string, any>;
  aud: string;
  role?: string;
}

// ============================================================================
// RELATIONSHIP TYPES (for joins and complex queries)
// ============================================================================

// Purchase Order with related data
export interface PurchaseOrderWithRelations extends PurchaseOrder {
  suppliers?: Supplier;
  item_master?: ItemMaster;
}

// Pre-GR Entry with related data
export interface PreGREntryWithRelations extends PreGREntry {
  purchase_orders?: PurchaseOrderWithRelations;
  suppliers?: Supplier;
  item_master?: ItemMaster;
  gap_item1?: GapItem;
  gap_item2?: GapItem;
}

// GQR Entry with related data
export interface GQREntryWithRelations extends GQREntry {
  pre_gr_entry?: PreGREntryWithRelations;
}

// User Profile with auth data
export interface UserProfileWithAuth extends UserProfile {
  auth_user?: AuthUser;
}

// ============================================================================
// COMMON UTILITY TYPES
// ============================================================================

export type TableName = 
  | 'suppliers'
  | 'item_master'
  | 'gap_items'
  | 'purchase_orders'
  | 'pre_gr_entry'
  | 'gqr_entry'
  | 'user_profiles'
  | 'units';

export type DatabaseEntity = 
  | Supplier
  | ItemMaster
  | GapItem
  | PurchaseOrder
  | PreGREntry
  | GQREntry
  | UserProfile
  | Unit;

export type DatabaseInsert = 
  | SupplierInsert
  | ItemMasterInsert
  | GapItemInsert
  | PurchaseOrderInsert
  | PreGREntryInsert
  | GQREntryInsert
  | UserProfileInsert
  | UnitInsert;

export type DatabaseUpdate = 
  | SupplierUpdate
  | ItemMasterInsert
  | GapItemUpdate
  | PurchaseOrderUpdate
  | PreGREntryUpdate
  | GQREntryUpdate
  | UserProfileUpdate
  | UnitUpdate;

// ============================================================================
// API RESPONSE TYPES
// ============================================================================
export interface DatabaseResponse<T> {
  data: T | null;
  error: any;
}

export interface DatabaseListResponse<T> {
  data: T[] | null;
  error: any;
}
