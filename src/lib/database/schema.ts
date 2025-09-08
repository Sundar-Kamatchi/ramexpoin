/**
 * Database Schema Constants
 * 
 * This file contains all table names, column names, and common database
 * constants to ensure consistency and avoid typos across the application.
 */

// ============================================================================
// TABLE NAMES
// ============================================================================
export const TABLES = {
  SUPPLIERS: 'suppliers',
  ITEM_MASTER: 'item_master',
  GAP_ITEMS: 'gap_items',
  PURCHASE_ORDERS: 'purchase_orders',
  PRE_GR_ENTRY: 'pre_gr_entry',
  GQR_ENTRY: 'gqr_entry',
  USER_PROFILES: 'user_profiles',
  UNITS: 'units',
  AUTH_USERS: 'auth.users', // Supabase built-in
} as const;

// ============================================================================
// COLUMN NAMES BY TABLE
// ============================================================================
export const SUPPLIERS_COLUMNS = {
  ID: 'id',
  NAME: 'name',
  CONTACT_NAME: 'contact_name',
  PHONE: 'phone',
  ADDRESS: 'address',
  CREATED_AT: 'created_at',
} as const;

export const ITEM_MASTER_COLUMNS = {
  ID: 'id',
  ITEM_NAME: 'item_name',
  ITEM_UNIT: 'item_unit',
  HSN_CODE: 'hsn_code',
  CREATED_AT: 'created_at',
} as const;

export const GAP_ITEMS_COLUMNS = {
  ID: 'id',
  NAME: 'name',
  CREATED_AT: 'created_at',
} as const;

export const PURCHASE_ORDERS_COLUMNS = {
  ID: 'id',
  VOUCHERNUMBER: 'vouchernumber',
  DATE: 'date',
  SUPPLIER_ID: 'supplier_id',
  ITEM_ID: 'item_id',
  QUANTITY: 'quantity',
  RATE: 'rate',
  CARGO: 'cargo',
  DAMAGE_ALLOWED_KGS_TON: 'damage_allowed_kgs_ton',
  PODI_RATE: 'podi_rate',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
  TALLY_POSTED: 'tally_posted',
  TALLY_POSTED_AT: 'tally_posted_at',
  TALLY_RESPONSE: 'tally_response',
  ADMIN_REMARK: 'admin_remark',
  PO_CLOSED: 'po_closed',
} as const;

export const PRE_GR_ENTRY_COLUMNS = {
  ID: 'id',
  VOUCHERNUMBER: 'vouchernumber',
  DATE: 'date',
  SUPPLIER_ID: 'supplier_id',
  ITEM_ID: 'item_id',
  GAP_ITEM1_ID: 'gap_item1_id',
  GAP_ITEM2_ID: 'gap_item2_id',
  QUANTITY: 'quantity',
  RATE: 'rate',
  CARGO: 'cargo',
  LADDEN_WT: 'ladden_wt',
  EMPTY_WT: 'empty_wt',
  NET_WT: 'net_wt',
  DOUBLES: 'doubles',
  WEIGHT_SHORTAGE: 'weight_shortage',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
  BAGS: 'bags',
  LOADED_FROM: 'loaded_from',
  VEHICLE_NO: 'vehicle_no',
  WEIGHT_BRIDGE_NAME: 'weight_bridge_name',
  PREPARED_BY: 'prepared_by',
  GR_NO: 'gr_no',
  GR_DT: 'gr_dt',
  PO_ID: 'po_id',
  SIEVE_NO: 'sieve_no',
  IS_ADMIN_APPROVED: 'is_admin_approved',
  ADMIN_REMARK: 'admin_remark',
  GAP_ITEM1_BAGS: 'gap_item1_bags',
  GAP_ITEM2_BAGS: 'gap_item2_bags',
  PODI_BAGS: 'podi_bags',
  ADVANCE_PAID: 'advance_paid',
  ADMIN_APPROVED_ADVANCE: 'admin_approved_advance',
  IS_GQR_CREATED: 'is_gqr_created',
  REMARKS: 'remarks',
} as const;

export const GQR_ENTRY_COLUMNS = {
  ID: 'id',
  PRE_GR_ID: 'pre_gr_id',
  DATE: 'date',
  ROT_WEIGHT: 'rot_weight',
  DOUBLES_WEIGHT: 'doubles_weight',
  SAND_WEIGHT: 'sand_weight',
  NET_WT: 'net_wt',
  EXPORT_QUALITY_WEIGHT: 'export_quality_weight',
  PODI_WEIGHT: 'podi_weight',
  GAP_ITEMS_WEIGHT: 'gap_items_weight',
  TOTAL_VALUE_RECEIVED: 'total_value_received',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
  VOLATILE_PO_RATE: 'volatile_po_rate',
  VOLATILE_GAP_ITEM_RATE: 'volatile_gap_item_rate',
  VOLATILE_PODI_RATE: 'volatile_podi_rate',
  VOLATILE_WASTAGE_KGS_PER_TON: 'volatile_wastage_kgs_per_ton',
  GQR_STATUS: 'gqr_status',
} as const;

export const USER_PROFILES_COLUMNS = {
  ID: 'id',
  FULL_NAME: 'full_name',
  EMAIL: 'email',
  AVATAR_URL: 'avatar_url',
  ROLE: 'role',
  UPDATED_AT: 'updated_at',
} as const;

export const UNITS_COLUMNS = {
  ID: 'id',
  QUANTITY: 'quantity',
  QUANTITY_TYPE: 'quantity_type',
  UQC_CODE: 'uqc_code',
  CREATED_AT: 'created_at',
} as const;

// ============================================================================
// FOREIGN KEY RELATIONSHIPS
// ============================================================================
export const FOREIGN_KEYS = {
  // Purchase Orders
  PO_SUPPLIER: 'supplier_id',
  PO_ITEM: 'item_id',
  
  // Pre-GR Entry
  PRE_GR_SUPPLIER: 'supplier_id',
  PRE_GR_ITEM: 'item_id',
  PRE_GR_GAP_ITEM1: 'gap_item1_id',
  PRE_GR_GAP_ITEM2: 'gap_item2_id',
  PRE_GR_PO: 'po_id',
  
  // GQR Entry
  GQR_PRE_GR: 'pre_gr_id',
  
  // User Profiles
  USER_PROFILE_AUTH: 'id', // References auth.users(id)
} as const;

// ============================================================================
// COMMON SELECT QUERIES
// ============================================================================
export const COMMON_SELECTS = {
  // Basic selects for dropdowns
  SUPPLIERS_BASIC: `${SUPPLIERS_COLUMNS.ID}, ${SUPPLIERS_COLUMNS.NAME}`,
  ITEMS_BASIC: `${ITEM_MASTER_COLUMNS.ID}, ${ITEM_MASTER_COLUMNS.ITEM_NAME}`,
  GAP_ITEMS_BASIC: `${GAP_ITEMS_COLUMNS.ID}, ${GAP_ITEMS_COLUMNS.NAME}`,
  PO_BASIC: `${PURCHASE_ORDERS_COLUMNS.ID}, ${PURCHASE_ORDERS_COLUMNS.VOUCHERNUMBER}, ${PURCHASE_ORDERS_COLUMNS.DATE}`,
  
  // Full selects
  SUPPLIERS_FULL: '*',
  ITEMS_FULL: '*',
  GAP_ITEMS_FULL: '*',
  PO_FULL: '*',
  PRE_GR_FULL: '*',
  GQR_FULL: '*',
  USER_PROFILES_FULL: '*',
  UNITS_FULL: '*',
} as const;

// ============================================================================
// ORDER BY CLAUSES
// ============================================================================
export const ORDER_BY = {
  // Default ordering for lists
  SUPPLIERS: `${SUPPLIERS_COLUMNS.NAME} ASC`,
  ITEMS: `${ITEM_MASTER_COLUMNS.ITEM_NAME} ASC`,
  GAP_ITEMS: `${GAP_ITEMS_COLUMNS.NAME} ASC`,
  PO_BY_VOUCHER: `${PURCHASE_ORDERS_COLUMNS.VOUCHERNUMBER} DESC`,
  PO_BY_DATE: `${PURCHASE_ORDERS_COLUMNS.DATE} DESC`,
  PRE_GR_BY_DATE: `${PRE_GR_ENTRY_COLUMNS.CREATED_AT} DESC`,
  GQR_BY_DATE: `${GQR_ENTRY_COLUMNS.CREATED_AT} DESC`,
  USER_PROFILES: `${USER_PROFILES_COLUMNS.FULL_NAME} ASC`,
  UNITS: `${UNITS_COLUMNS.QUANTITY} ASC`,
} as const;

// ============================================================================
// STATUS VALUES
// ============================================================================
export const STATUS_VALUES = {
  GQR_STATUS: {
    OPEN: 'Open',
    CLOSED: 'Closed',
    PENDING: 'Pending',
  },
  USER_ROLES: {
    USER: 'user',
    ADMIN: 'admin',
  },
  BOOLEAN_DEFAULTS: {
    TALLY_POSTED: false,
    PO_CLOSED: false,
    IS_ADMIN_APPROVED: false,
    IS_GQR_CREATED: false,
  },
} as const;

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================
export const VALIDATION = {
  // String lengths
  MAX_VOUCHER_LENGTH: 50,
  MAX_NAME_LENGTH: 255,
  MAX_ADDRESS_LENGTH: 500,
  MAX_PHONE_LENGTH: 20,
  MAX_EMAIL_LENGTH: 255,
  MAX_REMARK_LENGTH: 1000,
  
  // Numeric limits
  MIN_QUANTITY: 0,
  MAX_QUANTITY: 999999.99,
  MIN_RATE: 0,
  MAX_RATE: 999999.99,
  MIN_WEIGHT: 0,
  MAX_WEIGHT: 999999.999,
  
  // Required fields
  REQUIRED_FIELDS: {
    SUPPLIER: [SUPPLIERS_COLUMNS.NAME],
    ITEM: [ITEM_MASTER_COLUMNS.ITEM_NAME],
    GAP_ITEM: [GAP_ITEMS_COLUMNS.NAME],
    PO: [PURCHASE_ORDERS_COLUMNS.DATE, PURCHASE_ORDERS_COLUMNS.SUPPLIER_ID, PURCHASE_ORDERS_COLUMNS.ITEM_ID, PURCHASE_ORDERS_COLUMNS.QUANTITY],
    PRE_GR: [PRE_GR_ENTRY_COLUMNS.DATE, PRE_GR_ENTRY_COLUMNS.SUPPLIER_ID, PRE_GR_ENTRY_COLUMNS.ITEM_ID, PRE_GR_ENTRY_COLUMNS.QUANTITY, PRE_GR_ENTRY_COLUMNS.PO_ID],
    GQR: [GQR_ENTRY_COLUMNS.DATE, GQR_ENTRY_COLUMNS.PRE_GR_ID],
    USER_PROFILE: [USER_PROFILES_COLUMNS.ID],
    UNIT: [UNITS_COLUMNS.QUANTITY, UNITS_COLUMNS.UQC_CODE],
  },
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get table name with proper typing
 */
export function getTableName(table: keyof typeof TABLES): string {
  return TABLES[table];
}

/**
 * Get column name with proper typing
 */
export function getColumnName(table: keyof typeof TABLES, column: string): string {
  return column;
}

/**
 * Build a select query string
 */
export function buildSelectQuery(table: keyof typeof TABLES, columns: string[] = ['*']): string {
  return columns.join(', ');
}

/**
 * Build an order by clause
 */
export function buildOrderBy(table: keyof typeof TABLES, orderBy?: string): string {
  if (orderBy) return orderBy;
  
  switch (table) {
    case 'suppliers':
      return ORDER_BY.SUPPLIERS;
    case 'item_master':
      return ORDER_BY.ITEMS;
    case 'gap_items':
      return ORDER_BY.GAP_ITEMS;
    case 'purchase_orders':
      return ORDER_BY.PO_BY_VOUCHER;
    case 'pre_gr_entry':
      return ORDER_BY.PRE_GR_BY_DATE;
    case 'gqr_entry':
      return ORDER_BY.GQR_BY_DATE;
    case 'user_profiles':
      return ORDER_BY.USER_PROFILES;
    case 'units':
      return ORDER_BY.UNITS;
    default:
      return 'created_at DESC';
  }
}
