-- Fix the update_gqr_and_pre_gr function to use the correct field names
-- The database has 'weight_shortage' field, not 'weight_shortage_weight'

-- First, drop the existing function
DROP FUNCTION IF EXISTS update_gqr_and_pre_gr(INTEGER, INTEGER, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, INTEGER, INTEGER, INTEGER, TEXT);

-- Create the new function with correct parameter names
CREATE OR REPLACE FUNCTION update_gqr_and_pre_gr(
  p_gqr_id INTEGER,
  p_pre_gr_id INTEGER,
  p_export_quality_weight NUMERIC DEFAULT 0,
  p_rot_weight NUMERIC DEFAULT 0,
  p_doubles_weight NUMERIC DEFAULT 0,
  p_sand_weight NUMERIC DEFAULT 0,
  p_weight_shortage NUMERIC DEFAULT 0,  -- Changed from p_weight_shortage_weight
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
    weight_shortage = p_weight_shortage,  -- Changed from weight_shortage_weight
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_gqr_and_pre_gr(INTEGER, INTEGER, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, INTEGER, INTEGER, INTEGER, TEXT) TO authenticated;
