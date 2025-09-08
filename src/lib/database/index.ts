/**
 * Database Module Index
 * 
 * This file exports all database-related functionality for easy importing
 * throughout the application.
 */

// Export all types
export * from '@/types/database';

// Export schema constants
export * from './schema';

// Export utility functions
export * from './utils';

// Re-export commonly used functions with shorter names
export {
  fetchAll,
  fetchById,
  insertRecord,
  updateRecord,
  deleteRecord,
  fetchMasterData,
  recordExists,
  getNextId,
} from './utils';

// Re-export table-specific functions
export {
  // Suppliers
  fetchSuppliers,
  fetchSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  
  // Items
  fetchItems,
  fetchItemById,
  createItem,
  updateItem,
  deleteItem,
  
  // Gap Items
  fetchGapItems,
  fetchGapItemById,
  createGapItem,
  updateGapItem,
  deleteGapItem,
  
  // Purchase Orders
  fetchPurchaseOrders,
  fetchPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  fetchPurchaseOrdersWithRelations,
  
  // Pre-GR Entries
  fetchPreGREntries,
  fetchPreGREntryById,
  createPreGREntry,
  updatePreGREntry,
  deletePreGREntry,
  
  // GQR Entries
  fetchGQREntries,
  fetchGQREntryById,
  createGQREntry,
  updateGQREntry,
  deleteGQREntry,
  
  // User Profiles
  fetchUserProfiles,
  fetchUserProfileById,
  createUserProfile,
  updateUserProfile,
  deleteUserProfile,
  
  // Units
  fetchUnits,
  fetchUnitById,
  createUnit,
  updateUnit,
  deleteUnit,
} from './utils';


