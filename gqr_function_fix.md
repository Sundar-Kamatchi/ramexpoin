# GQR Function Error Fix

## Problem
The GQR working page is throwing an error:
```
Error: Failed to load GQR details: structure of query does not match function result type
```

## Root Cause
The `get_gqr_details_by_id` function is missing from the database or has a different structure than expected.

## Solution

### Step 1: Create the Missing Function
Run this SQL in your Supabase SQL editor:

```sql
-- Create the missing get_gqr_details_by_id function
CREATE OR REPLACE FUNCTION get_gqr_details_by_id(p_gqr_id UUID)
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMPTZ,
  total_value_received NUMERIC,
  export_quality_weight NUMERIC,
  podi_weight NUMERIC,
  rot_weight NUMERIC,
  doubles_weight NUMERIC,
  sand_weight NUMERIC,
  rate NUMERIC,
  podi_rate NUMERIC,
  pre_gr_entry_id UUID,
  vouchernumber TEXT,
  net_wt NUMERIC,
  supplier_name TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gqr.id,
    gqr.created_at,
    gqr.total_value_received,
    gqr.export_quality_weight,
    gqr.podi_weight,
    gqr.rot_weight,
    gqr.doubles_weight,
    gqr.sand_weight,
    po.rate,
    po.podi_rate,
    pre.id as pre_gr_entry_id,
    pre.vouchernumber,
    pre.net_wt,
    s.name as supplier_name
  FROM gqr_entry gqr
  LEFT JOIN pre_gr_entry pre ON gqr.pre_gr_entry_id = pre.id
  LEFT JOIN purchase_orders po ON pre.purchase_order_id = po.id
  LEFT JOIN suppliers s ON po.supplier_id = s.id
  WHERE gqr.id = p_gqr_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_gqr_details_by_id(UUID) TO authenticated;
```

### Step 2: Code Updates Applied
The following files have been updated with fallback logic:

#### `src/app/gqr-working/page.jsx`
- Added fallback direct query when RPC function fails
- Enhanced error handling and logging
- Transforms direct query results to match expected structure

#### `src/app/gqr/[id]/page.jsx`
- Added fallback direct query when RPC function fails
- Enhanced error handling and logging
- Transforms direct query results to match expected structure

### Step 3: Testing
1. **Apply the SQL function** in Supabase SQL editor
2. **Refresh your browser**
3. **Navigate to GQR Working page**
4. **Select a GQR** to test the function
5. **Check console logs** for any remaining errors

### Step 4: Expected Behavior
- **Primary**: RPC function should work and return GQR details
- **Fallback**: If RPC fails, direct query should work and transform data
- **Error Handling**: Clear error messages if both approaches fail

## Fallback Logic
The updated code now:
1. **Tries the RPC function first**
2. **If RPC fails**, uses direct Supabase query
3. **Transforms the data** to match expected structure
4. **Provides detailed logging** for debugging

## Files Modified
- `src/app/gqr-working/page.jsx` - Added fallback logic
- `src/app/gqr/[id]/page.jsx` - Added fallback logic
- `create_gqr_function.sql` - SQL script to create the function

## Verification
After applying the fix:
- GQR Working page should load without errors
- GQR details should be fetched successfully
- Both RPC function and fallback direct query should work
- Console should show success logs instead of errors 