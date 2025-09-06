-- Fix the function to use the correct column names
-- The issue is that gqr_entry table uses 'pre_gr_entry_id' not 'pre_gr_id'

-- Drop the existing function first
DROP FUNCTION IF EXISTS public.create_gqr_and_update_pre_gr CASCADE;

-- Create the function with correct column names
CREATE OR REPLACE FUNCTION public.create_gqr_and_update_pre_gr(
    p_pre_gr_id integer,
    p_export_quality_weight numeric,
    p_rot_weight numeric,
    p_doubles_weight numeric,
    p_sand_weight numeric,
    p_weight_shortage_weight numeric,
    p_gap_items_weight numeric,
    p_podi_weight numeric,
    p_total_wastage_weight numeric,
    p_total_value_received numeric,
    p_final_podi_bags integer,
    p_final_gap_item1_bags integer,
    p_final_gap_item2_bags integer
)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    v_pre_gr_record pre_gr_entry%ROWTYPE;
    v_gqr_id bigint;
    v_gqr_no integer;
    v_result json;
BEGIN
    -- Get the pre-GR entry
    SELECT * INTO v_pre_gr_record
    FROM pre_gr_entry
    WHERE id = p_pre_gr_id;
    
    IF NOT FOUND THEN
        v_result := json_build_object(
            'success', false,
            'message', 'Pre-GR entry not found',
            'gqr_id', 0,
            'gqr_no', 0
        );
        RETURN v_result;
    END IF;
    
    IF v_pre_gr_record.is_gqr_created = true THEN
        v_result := json_build_object(
            'success', false,
            'message', 'GQR already exists for this Pre-GR',
            'gqr_id', 0,
            'gqr_no', 0
        );
        RETURN v_result;
    END IF;
    
    -- Get the next GQR number
    SELECT COALESCE(MAX(gr_no), 0) + 1 INTO v_gqr_no
    FROM gqr_entry;
    
    -- Insert GQR entry with correct column name
    INSERT INTO gqr_entry (
        pre_gr_entry_id,  -- FIXED: Use correct column name
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
        created_at
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
        NOW()
    ) RETURNING id INTO v_gqr_id;
    
    -- Update pre-GR entry
    UPDATE pre_gr_entry
    SET is_gqr_created = true
    WHERE id = p_pre_gr_id;
    
    -- Return success as JSON
    v_result := json_build_object(
        'success', true,
        'message', 'GQR created successfully',
        'gqr_id', v_gqr_id,
        'gqr_no', v_gqr_no
    );
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        v_result := json_build_object(
            'success', false,
            'message', 'Error: ' || SQLERRM,
            'gqr_id', 0,
            'gqr_no', 0
        );
        RETURN v_result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_gqr_and_update_pre_gr TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_gqr_and_update_pre_gr TO service_role;

-- Test the function (replace 1 with a valid Pre-GR ID from your check_pre_gr_entries.sql results)
SELECT public.create_gqr_and_update_pre_gr(
    1, -- p_pre_gr_id (use a valid ID from the first query)
    0, -- p_export_quality_weight
    0, -- p_rot_weight
    0, -- p_doubles_weight
    0, -- p_sand_weight
    0, -- p_weight_shortage_weight
    0, -- p_gap_items_weight
    0, -- p_podi_weight
    0, -- p_total_wastage_weight
    0, -- p_total_value_received
    0, -- p_final_podi_bags
    0, -- p_final_gap_item1_bags
    0  -- p_final_gap_item2_bags
);
