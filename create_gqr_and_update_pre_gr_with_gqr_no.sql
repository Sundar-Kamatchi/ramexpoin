-- Create the create_gqr_and_update_pre_gr function with gqr_no support
-- This function creates a GQR entry and updates the corresponding Pre-GR entry

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
  gr_no TEXT,
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_gqr_id INTEGER;
  v_gr_no TEXT;
  v_pre_gr_gr_no TEXT;
  v_created_at TIMESTAMPTZ := NOW();
BEGIN
  -- Get the gr_no from the pre_gr_entry to use as gr_no
  SELECT gr_no INTO v_pre_gr_gr_no
  FROM pre_gr_entry
  WHERE id = p_pre_gr_id;
  
  IF v_pre_gr_gr_no IS NULL THEN
    RETURN QUERY SELECT NULL::INTEGER, NULL::TEXT, FALSE, 'Pre-GR entry not found'::TEXT;
    RETURN;
  END IF;
  
  -- Set gr_no to the same as the pre_gr gr_no
  v_gr_no := v_pre_gr_gr_no;
  
  -- Insert the GQR entry
  INSERT INTO gqr_entry (
    pre_gr_entry_id,
    gr_no,
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
    v_gr_no,
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_gqr_and_update_pre_gr(
  INTEGER, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, INTEGER, INTEGER, INTEGER
) TO authenticated;
