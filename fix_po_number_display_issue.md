# Fix for PO Number Not Displaying in GQR Edit Page

## Problem
The Purchase Order (PO) number was not showing in the GQR edit page, displaying as empty in the "Purchase Order Details (PO No: )" section.

## Root Cause
The issue was in the `get_gqr_details_by_id` RPC function and how the frontend code handled its response:

1. **RPC Function Issue**: The function was returning `pre.vouchernumber` (from pre_gr_entry table) instead of `po.vouchernumber` (from purchase_orders table)
2. **Frontend Mapping Issue**: The frontend code was not properly mapping the `vouchernumber` field from the RPC result to the `po_gr_no` field

## Solution

### 1. Fixed the RPC Function
**File**: `fix_gqr_rpc_function_po_number.sql`

```sql
CREATE OR REPLACE FUNCTION get_gqr_details_by_id(p_gqr_id INTEGER)
RETURNS TABLE (
  -- ... other fields ...
  vouchernumber TEXT,  -- This should be the PO number (po.vouchernumber)
  -- ... other fields ...
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- ... other fields ...
    po.vouchernumber,  -- FIXED: Use PO vouchernumber instead of pre_gr_entry vouchernumber
    -- ... other fields ...
  FROM gqr_entry gqr
  LEFT JOIN pre_gr_entry pre ON gqr.pre_gr_entry_id = pre.id
  LEFT JOIN purchase_orders po ON pre.po_id = po.id
  LEFT JOIN suppliers s ON po.supplier_id = s.id
  LEFT JOIN item_master im ON po.item_id = im.id
  WHERE gqr.id = p_gqr_id::INTEGER;
END;
$$;
```

### 2. Fixed Frontend Code
**File**: `src/app/gqr/[id]/page.jsx`

```javascript
// Before (incorrect mapping)
po_gr_no: fetchedData.po_gr_no || fetchedData.pre_gr_entry?.purchase_orders?.vouchernumber || '',

// After (correct mapping)
po_gr_no: fetchedData.vouchernumber || fetchedData.pre_gr_entry?.purchase_orders?.vouchernumber || '', // FIXED: Use vouchernumber from RPC result
```

**File**: `src/app/gqr-working/page.jsx`

```javascript
// Added explicit vouchernumber mapping from RPC result
const gqr = {
  ...rpcData[0],
  gqr_status: rpcData[0].gqr_status || 'Open',
  gr_dt: rpcData[0].gr_dt,
  pre_gr_date: rpcData[0].pre_gr_date || rpcData[0].date,
  vouchernumber: rpcData[0].vouchernumber // FIXED: Ensure vouchernumber is properly set from RPC result
};
```

## Data Flow
1. **GQR Entry** → **Pre-GR Entry** → **Purchase Orders**
2. The PO number (`vouchernumber`) is stored in the `purchase_orders` table
3. The RPC function now correctly joins through this relationship and returns `po.vouchernumber`
4. The frontend now properly maps this to the display field

## Files Modified
1. `fix_gqr_rpc_function_po_number.sql` - Fixed RPC function
2. `src/app/gqr/[id]/page.jsx` - Fixed PO number mapping in edit page
3. `src/app/gqr-working/page.jsx` - Fixed PO number mapping in working page

## Testing
After applying these fixes:
1. The PO number should display correctly in the GQR edit page
2. The PO number should display correctly in the GQR working page
3. Both RPC function and direct query fallback should work properly

## Database Changes Required
Run the SQL script `fix_gqr_rpc_function_po_number.sql` in your Supabase SQL editor to update the RPC function.
