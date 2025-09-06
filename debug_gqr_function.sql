-- Debug version to see exactly why the function is failing
-- This will help us understand what's going wrong

-- First, let's check what Pre-GR entries exist
SELECT 
    id,
    gr_no,
    is_gqr_created,
    is_admin_approved,
    net_wt
FROM pre_gr_entry 
WHERE is_admin_approved = true
ORDER BY id DESC
LIMIT 5;

-- Let's also check the gqr_entry table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'gqr_entry' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Now let's create a debug version of the function
CREATE OR REPLACE FUNCTION public.debug_create_gqr_and_update_pre_gr(
    p_pre_gr_id integer
)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    v_pre_gr_record pre_gr_entry%ROWTYPE;
    v_gqr_id bigint;
    v_gqr_no integer;
    v_result json;
    v_debug_info text;
BEGIN
    v_debug_info := 'Starting function with pre_gr_id: ' || p_pre_gr_id;
    
    -- Get the pre-GR entry
    SELECT * INTO v_pre_gr_record
    FROM pre_gr_entry
    WHERE id = p_pre_gr_id;
    
    IF NOT FOUND THEN
        v_debug_info := v_debug_info || ' | Pre-GR not found';
        v_result := json_build_object(
            'success', false,
            'message', 'Pre-GR entry not found',
            'debug_info', v_debug_info,
            'gqr_id', 0,
            'gqr_no', 0
        );
        RETURN v_result;
    END IF;
    
    v_debug_info := v_debug_info || ' | Pre-GR found, is_gqr_created: ' || v_pre_gr_record.is_gqr_created;
    
    IF v_pre_gr_record.is_gqr_created = true THEN
        v_debug_info := v_debug_info || ' | GQR already exists';
        v_result := json_build_object(
            'success', false,
            'message', 'GQR already exists for this Pre-GR',
            'debug_info', v_debug_info,
            'gqr_id', 0,
            'gqr_no', 0
        );
        RETURN v_result;
    END IF;
    
    -- Get the next GQR number
    SELECT COALESCE(MAX(gr_no), 0) + 1 INTO v_gqr_no
    FROM gqr_entry;
    
    v_debug_info := v_debug_info || ' | Next GQR number: ' || v_gqr_no;
    
    -- Try to insert GQR entry
    BEGIN
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
        ) RETURNING id INTO v_gqr_id;
        
        v_debug_info := v_debug_info || ' | GQR inserted with ID: ' || v_gqr_id;
        
        -- Update pre-GR entry
        UPDATE pre_gr_entry
        SET is_gqr_created = true
        WHERE id = p_pre_gr_id;
        
        v_debug_info := v_debug_info || ' | Pre-GR updated';
        
        -- Return success as JSON
        v_result := json_build_object(
            'success', true,
            'message', 'GQR created successfully',
            'debug_info', v_debug_info,
            'gqr_id', v_gqr_id,
            'gqr_no', v_gqr_no
        );
        RETURN v_result;
        
    EXCEPTION
        WHEN OTHERS THEN
            v_debug_info := v_debug_info || ' | INSERT ERROR: ' || SQLERRM;
            v_result := json_build_object(
                'success', false,
                'message', 'Error: ' || SQLERRM,
                'debug_info', v_debug_info,
                'gqr_id', 0,
                'gqr_no', 0
            );
            RETURN v_result;
    END;
END;
$$;

-- Test with a valid Pre-GR ID (replace 1 with an actual ID from the first query)
SELECT public.debug_create_gqr_and_update_pre_gr(1);
