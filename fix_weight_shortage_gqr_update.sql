-- Fix Weight Shortage Update Issue in GQR
-- This script adds the missing weight_shortage_weight column and creates the update function

-- Step 1: Add the missing weight_shortage_weight column to gqr_entry table
ALTER TABLE gqr_entry 
ADD COLUMN IF NOT EXISTS weight_shortage_weight NUMERIC(10, 3) DEFAULT 0;

-- Step 2: Create the update_gqr_and_pre_gr function
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
  p_final_gap_item2_bags INTEGER DEFAULT 0
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
    total_value_received = p_total_value_received,
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_gqr_and_pre_gr(INTEGER, INTEGER, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, INTEGER, INTEGER, INTEGER) TO authenticated;

-- Instructions:
-- 1. Copy and paste this entire SQL into your Supabase SQL editor
-- 2. Run the query to add the missing column and create the function
-- 3. The weight shortage field should now be updateable in the GQR alteration page
