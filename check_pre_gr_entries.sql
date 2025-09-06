-- Check what Pre-GR entries exist and their status
SELECT 
    id,
    gr_no,
    is_gqr_created,
    is_admin_approved,
    net_wt
FROM pre_gr_entry 
WHERE is_admin_approved = true
ORDER BY id DESC
LIMIT 10;

-- Check the gqr_entry table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'gqr_entry' 
AND table_schema = 'public'
ORDER BY ordinal_position;
