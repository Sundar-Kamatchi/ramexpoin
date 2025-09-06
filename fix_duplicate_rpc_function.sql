-- Fix duplicate create_gqr_and_update_pre_gr function
-- Drop the function with bigint parameter to keep only the integer version

-- First, let's see what functions exist
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'create_gqr_and_update_pre_gr'
AND n.nspname = 'public';

-- Drop the function with bigint parameter (if it exists)
DROP FUNCTION IF EXISTS public.create_gqr_and_update_pre_gr(
    p_pre_gr_id bigint,
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
);

-- Keep only the integer version
-- The function with integer parameter should remain
