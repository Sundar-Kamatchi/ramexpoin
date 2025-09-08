/**
 * Database Utility Functions
 * 
 * This file contains common database operations and helper functions
 * to ensure consistency and reduce code duplication across the application.
 */

import { supabase } from '@/lib/supabaseClient';
import { TABLES, COMMON_SELECTS, ORDER_BY } from './schema';
import type {
  DatabaseResponse,
  DatabaseListResponse,
  Supplier,
  ItemMaster,
  GapItem,
  PurchaseOrder,
  PreGREntry,
  GQREntry,
  UserProfile,
  Unit,
  PurchaseOrderWithRelations,
  PreGREntryWithRelations,
  GQREntryWithRelations,
} from '@/types/database';

// ============================================================================
// GENERIC DATABASE OPERATIONS
// ============================================================================

/**
 * Generic function to fetch all records from a table
 */
export async function fetchAll<T>(
  table: keyof typeof TABLES,
  select: string = '*',
  orderBy?: string
): Promise<DatabaseListResponse<T>> {
  try {
    console.log(`fetchAll: Starting fetch for table: ${table}`);
    console.log(`fetchAll: Table name: ${TABLES[table]}`);
    console.log(`fetchAll: Select: ${select}`);
    console.log(`fetchAll: Order by: ${orderBy}`);
    console.log(`fetchAll: Supabase client:`, supabase ? 'Available' : 'NULL');
    
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }
    
    const query = supabase
      .from(TABLES[table])
      .select(select);

    if (orderBy) {
      query.order(orderBy);
    }

    console.log(`fetchAll: Executing query for ${table}...`);
    const { data, error } = await query;
    
    console.log(`fetchAll: Query result for ${table}:`, { 
      dataCount: data?.length || 0, 
      error: error 
    });
    
    return { data: data as T[], error };
  } catch (error) {
    console.error(`fetchAll: Error fetching all ${table}:`, error);
    return { data: null, error: error as any };
  }
}

/**
 * Generic function to fetch a single record by ID
 */
export async function fetchById<T>(
  table: keyof typeof TABLES,
  id: string | number,
  select: string = '*'
): Promise<DatabaseResponse<T>> {
  try {
    const { data, error } = await supabase
      .from(TABLES[table])
      .select(select)
      .eq('id', id)
      .single();

    return { data: data as T, error };
  } catch (error) {
    console.error(`Error fetching ${table} by ID ${id}:`, error);
    return { data: null, error: error as any };
  }
}

/**
 * Generic function to insert a record
 */
export async function insertRecord<T>(
  table: keyof typeof TABLES,
  record: any
): Promise<DatabaseResponse<T>> {
  try {
    const { data, error } = await supabase
      .from(TABLES[table])
      .insert([record])
      .select()
      .single();

    return { data, error };
  } catch (error) {
    console.error(`Error inserting ${table}:`, error);
    return { data: null, error: error as any };
  }
}

/**
 * Generic function to update a record
 */
export async function updateRecord<T>(
  table: keyof typeof TABLES,
  id: string | number,
  updates: any
): Promise<DatabaseResponse<T>> {
  try {
    const { data, error } = await supabase
      .from(TABLES[table])
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    console.error(`Error updating ${table} with ID ${id}:`, error);
    return { data: null, error: error as any };
  }
}

/**
 * Generic function to delete a record
 */
export async function deleteRecord(
  table: keyof typeof TABLES,
  id: string | number
): Promise<DatabaseResponse<null>> {
  try {
    const { data, error } = await supabase
      .from(TABLES[table])
      .delete()
      .eq('id', id);

    return { data, error };
  } catch (error) {
    console.error(`Error deleting ${table} with ID ${id}:`, error);
    return { data: null, error: error as any };
  }
}

// ============================================================================
// SUPPLIERS OPERATIONS
// ============================================================================

export async function fetchSuppliers(): Promise<DatabaseListResponse<Supplier>> {
  console.log('fetchSuppliers: Starting to fetch suppliers...');
  console.log('fetchSuppliers: Using table key:', 'SUPPLIERS');
  console.log('fetchSuppliers: Table name:', TABLES.SUPPLIERS);
  console.log('fetchSuppliers: Select:', COMMON_SELECTS.SUPPLIERS_FULL);
  console.log('fetchSuppliers: Order by:', ORDER_BY.SUPPLIERS);
  
  const result = await fetchAll<Supplier>('SUPPLIERS', COMMON_SELECTS.SUPPLIERS_FULL, ORDER_BY.SUPPLIERS);
  
  console.log('fetchSuppliers: Result:', { data: result.data?.length || 0, error: result.error });
  
  return result;
}

export async function fetchSupplierById(id: number): Promise<DatabaseResponse<Supplier>> {
  return fetchById<Supplier>('SUPPLIERS', id);
}

export async function createSupplier(supplier: any): Promise<DatabaseResponse<Supplier>> {
  return insertRecord<Supplier>('SUPPLIERS', supplier);
}

export async function updateSupplier(id: number, updates: any): Promise<DatabaseResponse<Supplier>> {
  return updateRecord<Supplier>('SUPPLIERS', id, updates);
}

export async function deleteSupplier(id: number): Promise<DatabaseResponse<null>> {
  return deleteRecord('SUPPLIERS', id);
}

// ============================================================================
// ITEMS OPERATIONS
// ============================================================================

export async function fetchItems(): Promise<DatabaseListResponse<ItemMaster>> {
  return fetchAll<ItemMaster>('ITEM_MASTER', COMMON_SELECTS.ITEMS_FULL, ORDER_BY.ITEMS);
}

export async function fetchItemById(id: string): Promise<DatabaseResponse<ItemMaster>> {
  return fetchById<ItemMaster>('ITEM_MASTER', id);
}

export async function createItem(item: any): Promise<DatabaseResponse<ItemMaster>> {
  return insertRecord<ItemMaster>('ITEM_MASTER', item);
}

export async function updateItem(id: string, updates: any): Promise<DatabaseResponse<ItemMaster>> {
  return updateRecord<ItemMaster>('ITEM_MASTER', id, updates);
}

export async function deleteItem(id: string): Promise<DatabaseResponse<null>> {
  return deleteRecord('ITEM_MASTER', id);
}

// ============================================================================
// GAP ITEMS OPERATIONS
// ============================================================================

export async function fetchGapItems(): Promise<DatabaseListResponse<GapItem>> {
  return fetchAll<GapItem>('GAP_ITEMS', COMMON_SELECTS.GAP_ITEMS_FULL, ORDER_BY.GAP_ITEMS);
}

export async function fetchGapItemById(id: string): Promise<DatabaseResponse<GapItem>> {
  return fetchById<GapItem>('GAP_ITEMS', id);
}

export async function createGapItem(gapItem: any): Promise<DatabaseResponse<GapItem>> {
  return insertRecord<GapItem>('GAP_ITEMS', gapItem);
}

export async function updateGapItem(id: string, updates: any): Promise<DatabaseResponse<GapItem>> {
  return updateRecord<GapItem>('GAP_ITEMS', id, updates);
}

export async function deleteGapItem(id: string): Promise<DatabaseResponse<null>> {
  return deleteRecord('GAP_ITEMS', id);
}

// ============================================================================
// PURCHASE ORDERS OPERATIONS
// ============================================================================

export async function fetchPurchaseOrders(): Promise<DatabaseListResponse<PurchaseOrder>> {
  return fetchAll<PurchaseOrder>('PURCHASE_ORDERS', COMMON_SELECTS.PO_FULL, ORDER_BY.PO_BY_VOUCHER);
}

export async function fetchPurchaseOrderById(id: number): Promise<DatabaseResponse<PurchaseOrder>> {
  return fetchById<PurchaseOrder>('PURCHASE_ORDERS', id);
}

export async function createPurchaseOrder(po: any): Promise<DatabaseResponse<PurchaseOrder>> {
  return insertRecord<PurchaseOrder>('PURCHASE_ORDERS', po);
}

export async function updatePurchaseOrder(id: number, updates: any): Promise<DatabaseResponse<PurchaseOrder>> {
  return updateRecord<PurchaseOrder>('PURCHASE_ORDERS', id, updates);
}

export async function deletePurchaseOrder(id: number): Promise<DatabaseResponse<null>> {
  return deleteRecord('PURCHASE_ORDERS', id);
}

/**
 * Fetch purchase orders with supplier and item information
 */
export async function fetchPurchaseOrdersWithRelations(): Promise<DatabaseListResponse<PurchaseOrderWithRelations>> {
  try {
    // Fetch purchase orders
    const { data: poData, error: poError } = await supabase
      .from(TABLES.PURCHASE_ORDERS)
      .select(COMMON_SELECTS.PO_FULL)
      .order(ORDER_BY.PO_BY_VOUCHER);

    if (poError) {
      console.error('Error fetching purchase orders:', poError);
      return { data: null, error: poError };
    }

    if (!poData || poData.length === 0) {
      return { data: [], error: null };
    }

    // Get unique supplier and item IDs
    const supplierIds = Array.from(new Set(poData.map(po => po.supplier_id)));
    const itemIds = Array.from(new Set(poData.map(po => po.item_id)));

    // Fetch suppliers and items
    const [suppliersRes, itemsRes] = await Promise.all([
      supabase.from(TABLES.SUPPLIERS).select(COMMON_SELECTS.SUPPLIERS_BASIC).in('id', supplierIds),
      supabase.from(TABLES.ITEM_MASTER).select(COMMON_SELECTS.ITEMS_BASIC).in('id', itemIds)
    ]);

    if (suppliersRes.error) {
      console.error('Error fetching suppliers:', suppliersRes.error);
      return { data: null, error: suppliersRes.error };
    }

    if (itemsRes.error) {
      console.error('Error fetching items:', itemsRes.error);
      return { data: null, error: itemsRes.error };
    }

    // Create lookup maps
    const supplierMap = new Map(suppliersRes.data?.map(s => [s.id, s]) || []);
    const itemMap = new Map(itemsRes.data?.map(i => [i.id, i]) || []);

    // Combine data
    const purchaseOrdersWithRelations = poData.map(po => ({
      ...po,
      suppliers: supplierMap.get(po.supplier_id),
      item_master: itemMap.get(po.item_id)
    }));

    return { data: purchaseOrdersWithRelations, error: null };
  } catch (error) {
    console.error('Error fetching purchase orders with relations:', error);
    return { data: null, error };
  }
}

// ============================================================================
// PRE-GR ENTRIES OPERATIONS
// ============================================================================

export async function fetchPreGREntries(): Promise<DatabaseListResponse<PreGREntry>> {
  return fetchAll<PreGREntry>('PRE_GR_ENTRY', COMMON_SELECTS.PRE_GR_FULL, ORDER_BY.PRE_GR_BY_DATE);
}

export async function fetchPreGREntryById(id: number): Promise<DatabaseResponse<PreGREntry>> {
  return fetchById<PreGREntry>('PRE_GR_ENTRY', id);
}

export async function createPreGREntry(preGr: any): Promise<DatabaseResponse<PreGREntry>> {
  return insertRecord<PreGREntry>('PRE_GR_ENTRY', preGr);
}

export async function updatePreGREntry(id: number, updates: any): Promise<DatabaseResponse<PreGREntry>> {
  return updateRecord<PreGREntry>('PRE_GR_ENTRY', id, updates);
}

export async function deletePreGREntry(id: number): Promise<DatabaseResponse<null>> {
  return deleteRecord('PRE_GR_ENTRY', id);
}

// ============================================================================
// GQR ENTRIES OPERATIONS
// ============================================================================

export async function fetchGQREntries(): Promise<DatabaseListResponse<GQREntry>> {
  return fetchAll<GQREntry>('GQR_ENTRY', COMMON_SELECTS.GQR_FULL, ORDER_BY.GQR_BY_DATE);
}

export async function fetchGQREntryById(id: number): Promise<DatabaseResponse<GQREntry>> {
  return fetchById<GQREntry>('GQR_ENTRY', id);
}

export async function createGQREntry(gqr: any): Promise<DatabaseResponse<GQREntry>> {
  return insertRecord<GQREntry>('GQR_ENTRY', gqr);
}

export async function updateGQREntry(id: number, updates: any): Promise<DatabaseResponse<GQREntry>> {
  return updateRecord<GQREntry>('GQR_ENTRY', id, updates);
}

export async function deleteGQREntry(id: number): Promise<DatabaseResponse<null>> {
  return deleteRecord('GQR_ENTRY', id);
}

// ============================================================================
// USER PROFILES OPERATIONS
// ============================================================================

export async function fetchUserProfiles(): Promise<DatabaseListResponse<UserProfile>> {
  return fetchAll<UserProfile>('USER_PROFILES', COMMON_SELECTS.USER_PROFILES_FULL, ORDER_BY.USER_PROFILES);
}

export async function fetchUserProfileById(id: string): Promise<DatabaseResponse<UserProfile>> {
  return fetchById<UserProfile>('USER_PROFILES', id);
}

export async function createUserProfile(profile: any): Promise<DatabaseResponse<UserProfile>> {
  return insertRecord<UserProfile>('USER_PROFILES', profile);
}

export async function updateUserProfile(id: string, updates: any): Promise<DatabaseResponse<UserProfile>> {
  return updateRecord<UserProfile>('USER_PROFILES', id, updates);
}

export async function deleteUserProfile(id: string): Promise<DatabaseResponse<null>> {
  return deleteRecord('USER_PROFILES', id);
}

// ============================================================================
// UNITS OPERATIONS
// ============================================================================

export async function fetchUnits(): Promise<DatabaseListResponse<Unit>> {
  return fetchAll<Unit>('UNITS', COMMON_SELECTS.UNITS_FULL, ORDER_BY.UNITS);
}

export async function fetchUnitById(id: number): Promise<DatabaseResponse<Unit>> {
  return fetchById<Unit>('UNITS', id);
}

export async function createUnit(unit: any): Promise<DatabaseResponse<Unit>> {
  return insertRecord<Unit>('UNITS', unit);
}

export async function updateUnit(id: number, updates: any): Promise<DatabaseResponse<Unit>> {
  return updateRecord<Unit>('UNITS', id, updates);
}

export async function deleteUnit(id: number): Promise<DatabaseResponse<null>> {
  return deleteRecord('UNITS', id);
}

// ============================================================================
// COMPLEX QUERIES AND RELATIONSHIPS
// ============================================================================

/**
 * Fetch all master data needed for forms (suppliers, items, gap items)
 */
export async function fetchMasterData() {
  try {
    console.log('fetchMasterData: Starting to fetch master data...');
    
    const [suppliersRes, itemsRes, gapItemsRes] = await Promise.all([
      fetchSuppliers(),
      fetchItems(),
      fetchGapItems()
    ]);

    console.log('fetchMasterData: Results:', {
      suppliers: { data: suppliersRes.data?.length || 0, error: suppliersRes.error },
      items: { data: itemsRes.data?.length || 0, error: itemsRes.error },
      gapItems: { data: gapItemsRes.data?.length || 0, error: gapItemsRes.error }
    });

    return {
      suppliers: suppliersRes.data || [],
      items: itemsRes.data || [],
      gapItems: gapItemsRes.data || [],
      errors: {
        suppliers: suppliersRes.error,
        items: itemsRes.error,
        gapItems: gapItemsRes.error
      }
    };
  } catch (error) {
    console.error('fetchMasterData: Error fetching master data:', error);
    return {
      suppliers: [],
      items: [],
      gapItems: [],
      errors: { suppliers: error, items: error, gapItems: error }
    };
  }
}

/**
 * Check if a record exists by ID
 */
export async function recordExists(
  table: keyof typeof TABLES,
  id: string | number
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from(TABLES[table])
      .select('id')
      .eq('id', id)
      .single();

    return !error && !!data;
  } catch (error) {
    console.error(`Error checking if ${table} exists with ID ${id}:`, error);
    return false;
  }
}

/**
 * Get the next available ID for a table (for auto-incrementing tables)
 */
export async function getNextId(table: keyof typeof TABLES): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from(TABLES[table])
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return 1; // Start from 1 if no records exist
    }

    return (data.id as number) + 1;
  } catch (error) {
    console.error(`Error getting next ID for ${table}:`, error);
    return null;
  }
}
