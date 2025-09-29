-- Complete fix for GQR entry table to support weight shortage and user remarks
-- This script ensures all required columns exist and creates the RPC function

-- Step 1: Add all required columns to gqr_entry table
ALTER TABLE gqr_entry 
ADD COLUMN IF NOT EXISTS weight_shortage_weight NUMERIC(10, 3) DEFAULT 0;

ALTER TABLE gqr_entry 
ADD COLUMN IF NOT EXISTS user_remark TEXT DEFAULT '';

ALTER TABLE gqr_entry 
ADD COLUMN IF NOT EXISTS weight_shortage_request_status TEXT DEFAULT 'none' 
CHECK (weight_shortage_request_status IN ('none', 'pending', 'approved', 'rejected'));

ALTER TABLE gqr_entry 
ADD COLUMN IF NOT EXISTS requested_weight_shortage NUMERIC(10, 3) DEFAULT 0;

ALTER TABLE gqr_entry 
ADD COLUMN IF NOT EXISTS admin_remark TEXT DEFAULT '';

-- Step 2: Create or replace the update_gqr_and_pre_gr function with user_remark support
CREATE OR REPLACE FUNCTION update_gqr_and_pre_gr(
  p_gqr_id INTEGER,
  p_pre_gr_id INTEGER,
  p_export_quality_weight NUMERIC DEFAULT 0,
  p_rot_weight NUMERIC DEFAULT 0,
  p_doubles_weight NUMERIC DEFAULT 0,
  p_sand_weight NUMERIC DEFAULT 0,
  p_weight_shortage_weight NUMERIC DEFAULT 0,
  p_gap_items_weight NUMERIC DEFAULT 0,
  p_podi_weight NUMERIC DEFAULT 0,
  p_total_wastage_weight NUMERIC DEFAULT 0,
  p_total_value_received NUMERIC DEFAULT 0,
  p_final_podi_bags INTEGER DEFAULT 0,
  p_final_gap_item1_bags INTEGER DEFAULT 0,
  p_final_gap_item2_bags INTEGER DEFAULT 0,
  p_user_remark TEXT DEFAULT ''
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the GQR entry
  UPDATE gqr_entry 
  SET 
    export_quality_weight = p_export_quality_weight,
    rot_weight = p_rot_weight,
    doubles_weight = p_doubles_weight,
    sand_weight = p_sand_weight,
    weight_shortage_weight = p_weight_shortage_weight,
    gap_items_weight = p_gap_items_weight,
    podi_weight = p_podi_weight,
    total_wastage_weight = p_total_wastage_weight,
    total_value_received = p_total_value_received,
    user_remark = p_user_remark,
    updated_at = NOW()
  WHERE id = p_gqr_id;
  
  -- Update the Pre-GR entry bag counts
  UPDATE pre_gr_entry 
  SET 
    podi_bags = p_final_podi_bags,
    gap_item1_bags = p_final_gap_item1_bags,
    gap_item2_bags = p_final_gap_item2_bags,
    updated_at = NOW()
  WHERE id = p_pre_gr_id;
  
  -- Check if the update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'GQR entry with id % not found', p_gqr_id;
  END IF;
END;
$$;

-- Step 3: Grant execute permission
GRANT EXECUTE ON FUNCTION update_gqr_and_pre_gr(INTEGER, INTEGER, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, INTEGER, INTEGER, INTEGER, TEXT) TO authenticated;

-- Step 4: Verify the columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'gqr_entry' 
AND column_name IN (
  'weight_shortage_weight',
  'user_remark', 
  'weight_shortage_request_status',
  'requested_weight_shortage',
  'admin_remark'
)
ORDER BY column_name;
