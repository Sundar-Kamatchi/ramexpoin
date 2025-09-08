# 🗄️ Database Management Guide

## Overview

This guide explains how to maintain all 9 database table structures in your Ramsamy Exports & Import Pvt Ltd project using TypeScript types, schema constants, and utility functions.

## 📊 Database Tables

Your Supabase project contains **9 tables**:

1. **`suppliers`** - Supplier information
2. **`item_master`** - Item catalog  
3. **`gap_items`** - Gap items for quality reports
4. **`purchase_orders`** - Purchase orders
5. **`pre_gr_entry`** - Pre-GR entries
6. **`gqr_entry`** - Goods Quality Reports
7. **`user_profiles`** - User management
8. **`units`** - UQC codes for units
9. **`auth.users`** - Supabase auth (built-in)

## 🏗️ Architecture

### 1. Type Definitions (`src/types/database.ts`)
- **Complete TypeScript interfaces** for all tables
- **Insert/Update types** for form handling
- **Relationship types** for complex queries
- **API response types** for consistent error handling

### 2. Schema Constants (`src/lib/database/schema.ts`)
- **Table names** - Avoid typos with `TABLES.SUPPLIERS`
- **Column names** - Use `SUPPLIERS_COLUMNS.NAME` instead of `'name'`
- **Common queries** - Pre-built select statements
- **Order by clauses** - Standardized sorting
- **Validation constants** - Field limits and requirements

### 3. Utility Functions (`src/lib/database/utils.ts`)
- **Generic CRUD operations** - `fetchAll()`, `insertRecord()`, etc.
- **Table-specific functions** - `fetchSuppliers()`, `createSupplier()`, etc.
- **Relationship queries** - `fetchPurchaseOrdersWithRelations()`
- **Master data fetching** - `fetchMasterData()` for forms

### 4. Index File (`src/lib/database/index.ts`)
- **Single import point** - Import everything from `@/lib/database`
- **Re-exports** - All types, constants, and functions
- **Clean API** - Easy to use throughout the application

## 🚀 Usage Examples

### Basic CRUD Operations

```javascript
import { 
  fetchSuppliers, 
  createSupplier, 
  updateSupplier,
  TABLES,
  SUPPLIERS_COLUMNS 
} from '@/lib/database';

// Fetch all suppliers
const { data: suppliers, error } = await fetchSuppliers();

// Create a new supplier
const newSupplier = {
  name: 'ABC Suppliers Ltd',
  contact_name: 'John Doe',
  phone: '+1234567890',
  address: '123 Main St'
};
const { data: created, error } = await createSupplier(newSupplier);

// Update a supplier
const updates = { phone: '+0987654321' };
const { data: updated, error } = await updateSupplier(1, updates);
```

### Using Schema Constants

```javascript
import { TABLES, SUPPLIERS_COLUMNS, ORDER_BY } from '@/lib/database';

// Instead of hardcoded strings
const tableName = TABLES.SUPPLIERS; // 'suppliers'
const columnName = SUPPLIERS_COLUMNS.NAME; // 'name'
const orderClause = ORDER_BY.SUPPLIERS; // 'name ASC'
```

### Complex Queries with Relationships

```javascript
import { fetchPurchaseOrdersWithRelations } from '@/lib/database';

// Fetch POs with supplier and item info
const { data: purchaseOrders, error } = await fetchPurchaseOrdersWithRelations();
purchaseOrders?.forEach(po => {
  console.log(`PO: ${po.vouchernumber}`);
  console.log(`Supplier: ${po.suppliers?.name}`);
  console.log(`Item: ${po.item_master?.item_name}`);
});
```

### Master Data for Forms

```javascript
import { fetchMasterData } from '@/lib/database';

// Fetch all lookup data for forms
const { suppliers, items, gapItems, errors } = await fetchMasterData();

// Use in dropdowns
<select>
  {suppliers.map(supplier => (
    <option key={supplier.id} value={supplier.id}>
      {supplier.name}
    </option>
  ))}
</select>
```

## 🔧 Benefits

### 1. **Type Safety**
- ✅ **Compile-time error checking** - Catch errors before runtime
- ✅ **IntelliSense support** - Auto-completion in your IDE
- ✅ **Refactoring safety** - Rename fields across the entire codebase

### 2. **Consistency**
- ✅ **Standardized naming** - All table/column names in one place
- ✅ **Uniform error handling** - Same response format everywhere
- ✅ **Consistent queries** - Pre-built select statements

### 3. **Maintainability**
- ✅ **Single source of truth** - Schema changes in one place
- ✅ **Reduced duplication** - Common operations in utility functions
- ✅ **Easy updates** - Change schema once, update everywhere

### 4. **Developer Experience**
- ✅ **Faster development** - Pre-built functions for common tasks
- ✅ **Better debugging** - Consistent error messages and logging
- ✅ **Documentation** - Self-documenting code with types

## 📁 File Structure

```
src/
├── types/
│   └── database.ts              # All TypeScript type definitions
├── lib/
│   └── database/
│       ├── index.ts             # Main export file
│       ├── schema.ts            # Schema constants
│       ├── utils.ts             # Utility functions
│       └── examples.md          # Usage examples
└── app/
    └── pre-gr/
        └── new/
            └── page.jsx         # Example: Updated to use new utilities
```

## 🔄 Migration Strategy

### Phase 1: ✅ **Completed**
- [x] Created type definitions for all 9 tables
- [x] Created schema constants
- [x] Created utility functions
- [x] Updated pre-gr creation page as example

### Phase 2: **Next Steps**
- [ ] Update all existing pages to use new utilities
- [ ] Replace hardcoded table/column names with constants
- [ ] Add proper error handling using standardized responses
- [ ] Implement validation using schema constants

### Phase 3: **Future Enhancements**
- [ ] Add database migrations management
- [ ] Create automated schema validation
- [ ] Add performance monitoring
- [ ] Implement caching strategies

## 🛠️ Best Practices

### 1. **Always Use Types**
```javascript
// ✅ Good
import { Supplier, fetchSuppliers } from '@/lib/database';

// ❌ Avoid
import { supabase } from '@/lib/supabaseClient';
const { data } = await supabase.from('suppliers').select('*');
```

### 2. **Use Schema Constants**
```javascript
// ✅ Good
import { TABLES, SUPPLIERS_COLUMNS } from '@/lib/database';
const { data } = await supabase.from(TABLES.SUPPLIERS).select(SUPPLIERS_COLUMNS.NAME);

// ❌ Avoid
const { data } = await supabase.from('suppliers').select('name');
```

### 3. **Handle Errors Consistently**
```javascript
// ✅ Good
const { data, error } = await fetchSuppliers();
if (error) {
  console.error('Error fetching suppliers:', error);
  toast.error('Failed to load suppliers');
  return;
}

// ❌ Avoid
const { data, error } = await fetchSuppliers();
// No error handling
```

### 4. **Use Utility Functions**
```javascript
// ✅ Good
import { createSupplier } from '@/lib/database';
const { data, error } = await createSupplier(supplierData);

// ❌ Avoid
import { supabase } from '@/lib/supabaseClient';
const { data, error } = await supabase.from('suppliers').insert([supplierData]);
```

## 🎯 Next Steps

1. **Update existing pages** to use the new database utilities
2. **Replace hardcoded strings** with schema constants
3. **Add proper TypeScript types** to all database operations
4. **Implement consistent error handling** across the application
5. **Use the master data fetching** for all forms with dropdowns

## 📚 Additional Resources

- **Examples**: See `src/lib/database/examples.md` for detailed usage examples
- **Types**: All type definitions in `src/types/database.ts`
- **Schema**: All constants in `src/lib/database/schema.ts`
- **Utilities**: All functions in `src/lib/database/utils.ts`

This database management system provides a robust, type-safe, and maintainable foundation for your entire application! 🚀


