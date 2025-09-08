# Database Usage Examples

This document shows how to use the database utilities and type definitions in your application.

## Basic Usage

### Import Types and Functions

```typescript
import { 
  Supplier, 
  PurchaseOrder, 
  fetchSuppliers, 
  createSupplier,
  TABLES,
  SUPPLIERS_COLUMNS 
} from '@/lib/database';
```

### Fetching Data

```typescript
// Fetch all suppliers
const { data: suppliers, error } = await fetchSuppliers();
if (error) {
  console.error('Error fetching suppliers:', error);
} else {
  console.log('Suppliers:', suppliers);
}

// Fetch a specific supplier
const { data: supplier, error } = await fetchSupplierById(1);
if (error) {
  console.error('Error fetching supplier:', error);
} else {
  console.log('Supplier:', supplier);
}
```

### Creating Records

```typescript
// Create a new supplier
const newSupplier = {
  name: 'ABC Suppliers Ltd',
  contact_name: 'John Doe',
  phone: '+1234567890',
  address: '123 Main St, City, Country'
};

const { data: createdSupplier, error } = await createSupplier(newSupplier);
if (error) {
  console.error('Error creating supplier:', error);
} else {
  console.log('Created supplier:', createdSupplier);
}
```

### Updating Records

```typescript
// Update a supplier
const updates = {
  phone: '+0987654321',
  address: '456 New St, City, Country'
};

const { data: updatedSupplier, error } = await updateSupplier(1, updates);
if (error) {
  console.error('Error updating supplier:', error);
} else {
  console.log('Updated supplier:', updatedSupplier);
}
```

### Using Type Safety

```typescript
import { Supplier, SupplierInsert, SupplierUpdate } from '@/lib/database';

// Type-safe supplier creation
const supplierData: SupplierInsert = {
  name: 'New Supplier',
  contact_name: 'Jane Doe',
  phone: '+1111111111'
};

// Type-safe supplier update
const supplierUpdates: SupplierUpdate = {
  phone: '+2222222222'
};

// Type-safe supplier object
const supplier: Supplier = {
  id: 1,
  name: 'Existing Supplier',
  contact_name: 'John Doe',
  phone: '+3333333333',
  address: '123 Main St',
  created_at: '2024-01-01T00:00:00Z'
};
```

### Using Schema Constants

```typescript
import { TABLES, SUPPLIERS_COLUMNS, ORDER_BY } from '@/lib/database';

// Use table names
const tableName = TABLES.SUPPLIERS; // 'suppliers'

// Use column names
const columnName = SUPPLIERS_COLUMNS.NAME; // 'name'

// Use order by clauses
const orderClause = ORDER_BY.SUPPLIERS; // 'name ASC'
```

### Complex Queries with Relationships

```typescript
// Fetch purchase orders with supplier and item information
const { data: purchaseOrders, error } = await fetchPurchaseOrdersWithRelations();
if (error) {
  console.error('Error fetching purchase orders:', error);
} else {
  purchaseOrders?.forEach(po => {
    console.log(`PO: ${po.vouchernumber}`);
    console.log(`Supplier: ${po.suppliers?.name}`);
    console.log(`Item: ${po.item_master?.item_name}`);
  });
}
```

### Fetching Master Data for Forms

```typescript
// Fetch all master data needed for forms
const { suppliers, items, gapItems, errors } = await fetchMasterData();

if (errors.suppliers) {
  console.error('Error fetching suppliers:', errors.suppliers);
}

if (errors.items) {
  console.error('Error fetching items:', errors.items);
}

if (errors.gapItems) {
  console.error('Error fetching gap items:', errors.gapItems);
}

// Use the data in your form
console.log('Available suppliers:', suppliers);
console.log('Available items:', items);
console.log('Available gap items:', gapItems);
```

### Generic Database Operations

```typescript
import { fetchAll, insertRecord, updateRecord, deleteRecord } from '@/lib/database';

// Generic fetch all
const { data: allSuppliers, error } = await fetchAll('suppliers', '*', 'name ASC');

// Generic insert
const { data: newRecord, error } = await insertRecord('suppliers', {
  name: 'New Supplier'
});

// Generic update
const { data: updatedRecord, error } = await updateRecord('suppliers', 1, {
  name: 'Updated Supplier'
});

// Generic delete
const { data: deletedRecord, error } = await deleteRecord('suppliers', 1);
```

### Error Handling

```typescript
import { DatabaseResponse, DatabaseListResponse } from '@/lib/database';

async function handleSupplierOperation() {
  const { data, error }: DatabaseResponse<Supplier> = await fetchSupplierById(1);
  
  if (error) {
    // Handle different types of errors
    if (error.code === 'PGRST116') {
      console.error('Record not found');
    } else if (error.code === 'PGRST301') {
      console.error('Permission denied');
    } else {
      console.error('Unknown error:', error.message);
    }
    return;
  }
  
  // Use the data
  console.log('Supplier found:', data);
}
```

### Validation

```typescript
import { VALIDATION } from '@/lib/database';

function validateSupplier(supplier: any): string[] {
  const errors: string[] = [];
  
  // Check required fields
  if (!supplier.name) {
    errors.push('Supplier name is required');
  }
  
  // Check string length
  if (supplier.name && supplier.name.length > VALIDATION.MAX_NAME_LENGTH) {
    errors.push(`Supplier name must be less than ${VALIDATION.MAX_NAME_LENGTH} characters`);
  }
  
  // Check phone format
  if (supplier.phone && supplier.phone.length > VALIDATION.MAX_PHONE_LENGTH) {
    errors.push(`Phone number must be less than ${VALIDATION.MAX_PHONE_LENGTH} characters`);
  }
  
  return errors;
}
```

## Best Practices

1. **Always use type definitions** - Import and use the TypeScript types for better development experience
2. **Handle errors properly** - Always check for errors and handle them appropriately
3. **Use schema constants** - Use the predefined constants instead of hardcoded strings
4. **Validate data** - Use the validation constants and implement proper validation
5. **Use relationships** - Use the relationship functions for complex queries
6. **Cache master data** - Use `fetchMasterData()` for forms that need multiple lookup tables

## Migration from Existing Code

When updating existing code to use these utilities:

1. Replace hardcoded table names with `TABLES` constants
2. Replace hardcoded column names with column constants
3. Add proper TypeScript types to function parameters and return values
4. Use the utility functions instead of direct Supabase calls
5. Implement proper error handling using the standardized response types


