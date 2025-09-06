-- Migration script to replace vouchernumber with gr_no throughout the system
-- This script will update all references and then drop the vouchernumber column

-- Step 1: Update all existing references in the codebase
-- Note: This script only handles database changes. Frontend code changes are separate.

-- Step 2: Update the create_gqr_and_update_pre_gr function to use gr_no
CREATE OR REPLACE FUNCTION create_gqr_and_update_pre_gr(
  p_pre_gr_id INTEGER,
  p_export_quality_weight NUMERIC,
  p_rot_weight NUMERIC,
  p_doubles_weight NUMERIC,
  p_sand_weight NUMERIC,
  p_weight_shortage_weight NUMERIC,
  p_gap_items_weight NUMERIC,
  p_podi_weight NUMERIC,
  p_total_wastage_weight NUMERIC,
  p_total_value_received NUMERIC,
  p_final_podi_bags INTEGER,
  p_final_gap_item1_bags INTEGER,
  p_final_gap_item2_bags INTEGER
)
RETURNS TABLE (
  gqr_id INTEGER,
  gqr_no TEXT,
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_gqr_id INTEGER;
  v_gqr_no TEXT;
  v_pre_gr_gr_no TEXT;
  v_created_at TIMESTAMPTZ := NOW();
BEGIN
  -- Get the gr_no from the pre_gr_entry to use as gqr_no
  SELECT gr_no INTO v_pre_gr_gr_no
  FROM pre_gr_entry
  WHERE id = p_pre_gr_id;
  
  IF v_pre_gr_gr_no IS NULL THEN
    RETURN QUERY SELECT NULL::INTEGER, NULL::TEXT, FALSE, 'Pre-GR entry not found'::TEXT;
    RETURN;
  END IF;
  
  -- Set gqr_no to the same as the pre_gr gr_no
  v_gqr_no := v_pre_gr_gr_no;
  
  -- Insert the GQR entry
  INSERT INTO gqr_entry (
    pre_gr_entry_id,
    gqr_no,
    export_quality_weight,
    rot_weight,
    doubles_weight,
    sand_weight,
    weight_shortage_weight,
    gap_items_weight,
    podi_weight,
    total_wastage_weight,
    total_value_received,
    final_podi_bags,
    final_gap_item1_bags,
    final_gap_item2_bags,
    gqr_status,
    created_at,
    updated_at
  ) VALUES (
    p_pre_gr_id,
    v_gqr_no,
    p_export_quality_weight,
    p_rot_weight,
    p_doubles_weight,
    p_sand_weight,
    p_weight_shortage_weight,
    p_gap_items_weight,
    p_podi_weight,
    p_total_wastage_weight,
    p_total_value_received,
    p_final_podi_bags,
    p_final_gap_item1_bags,
    p_final_gap_item2_bags,
    'Open',
    v_created_at,
    v_created_at
  ) RETURNING id INTO v_gqr_id;
  
  -- Update the pre_gr_entry to mark that GQR has been created
  UPDATE pre_gr_entry 
  SET is_gqr_created = TRUE,
      updated_at = v_created_at
  WHERE id = p_pre_gr_id;
  
  -- Return success response
  RETURN QUERY SELECT v_gqr_id, v_gqr_no, TRUE, 'GQR created successfully'::TEXT;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return error response
    RETURN QUERY SELECT NULL::INTEGER, NULL::TEXT, FALSE, ('Error: ' || SQLERRM)::TEXT;
END;
$$;

-- Step 3: Update the get_gqr_details_by_id function to use gr_no
CREATE OR REPLACE FUNCTION get_gqr_details_by_id(p_gqr_id INTEGER)
RETURNS TABLE (
  id INTEGER,
  gqr_no TEXT,
  created_at TIMESTAMPTZ,
  total_value_received NUMERIC,
  export_quality_weight NUMERIC,
  podi_weight NUMERIC,
  rot_weight NUMERIC,
  doubles_weight NUMERIC,
  sand_weight NUMERIC,
  rate NUMERIC,
  podi_rate NUMERIC,
  damage_allowed_kgs_ton NUMERIC,
  volatile_po_rate NUMERIC,
  volatile_podi_rate NUMERIC,
  volatile_wastage_kgs_per_ton NUMERIC,
  gqr_status TEXT,
  pre_gr_entry_id INTEGER,
  gr_no TEXT,
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
    gqr.gqr_no,
    gqr.created_at,
    gqr.total_value_received,
    gqr.export_quality_weight,
    gqr.podi_weight,
    gqr.rot_weight,
    gqr.doubles_weight,
    gqr.sand_weight,
    po.rate,
    po.podi_rate,
    po.damage_allowed_kgs_ton,
    gqr.volatile_po_rate,
    gqr.volatile_podi_rate,
    gqr.volatile_wastage_kgs_per_ton,
    gqr.gqr_status,
    pre.id as pre_gr_entry_id,
    pre.gr_no,
    pre.net_wt,
    s.name as supplier_name
  FROM gqr_entry gqr
  LEFT JOIN pre_gr_entry pre ON gqr.pre_gr_entry_id = pre.id
  LEFT JOIN purchase_orders po ON pre.po_id = po.id
  LEFT JOIN suppliers s ON po.supplier_id = s.id
  WHERE gqr.id = p_gqr_id::INTEGER;
END;
$$;

-- Step 4: Update any other functions that reference vouchernumber
-- (Add more function updates as needed)

-- Step 5: Grant execute permissions
GRANT EXECUTE ON FUNCTION create_gqr_and_update_pre_gr(
  INTEGER, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, INTEGER, INTEGER, INTEGER
) TO authenticated;

GRANT EXECUTE ON FUNCTION get_gqr_details_by_id(INTEGER) TO authenticated;

-- Step 6: After all frontend code is updated, you can drop the vouchernumber column
-- WARNING: Only run this after confirming all frontend code has been updated!
-- ALTER TABLE pre_gr_entry DROP COLUMN vouchernumber;
-- ALTER TABLE purchase_orders DROP COLUMN vouchernumber;
