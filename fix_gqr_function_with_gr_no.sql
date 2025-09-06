-- Add gr_no column to gqr_entry table and create the function
-- First, add the gr_no column if it doesn't exist
ALTER TABLE gqr_entry 
ADD COLUMN IF NOT EXISTS gr_no integer;

-- Drop the existing function first
DROP FUNCTION IF EXISTS public.create_gqr_and_update_pre_gr CASCADE;

-- Create the function that uses gr_no
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
RETURNS TABLE(
    success boolean,
    message text,
    gqr_id bigint,
    gqr_no integer
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_pre_gr_record pre_gr_entry%ROWTYPE;
    v_gqr_id bigint;
    v_gqr_no integer;
BEGIN
    -- Get the pre-GR entry
    SELECT * INTO v_pre_gr_record
    FROM pre_gr_entry
    WHERE id = p_pre_gr_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Pre-GR entry not found', 0::bigint, 0;
        RETURN;
    END IF;
    
    IF v_pre_gr_record.is_gqr_created = true THEN
        RETURN QUERY SELECT false, 'GQR already exists for this Pre-GR', 0::bigint, 0;
        RETURN;
    END IF;
    
    -- Get the next GQR number from gr_no column
    SELECT COALESCE(MAX(gr_no), 0) + 1 INTO v_gqr_no
    FROM gqr_entry;
    
    -- Insert GQR entry with gr_no
    INSERT INTO gqr_entry (
        pre_gr_id,
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
    
    -- Return success
    RETURN QUERY SELECT true, 'GQR created successfully', v_gqr_id, v_gqr_no;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT false, 'Error: ' || SQLERRM, 0::bigint, 0;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_gqr_and_update_pre_gr TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_gqr_and_update_pre_gr TO service_role;

-- Test the function (replace 1 with a valid Pre-GR ID)
SELECT * FROM public.create_gqr_and_update_pre_gr(
    1, -- p_pre_gr_id (use a valid ID)
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
