-- Check if GR No 415 exists in the database
-- This query will help identify if the GR exists and what its status is

-- Check in pre_gr_entry table
SELECT 
    id,
    gr_no,
    gr_dt,
    is_admin_approved,
    is_gqr_created,
    created_at
FROM pre_gr_entry 
WHERE gr_no = '415' OR gr_no LIKE '%415%'
ORDER BY created_at DESC;

-- Check in gqr_entry table for any GQRs related to GR 415
SELECT 
    g.id as gqr_id,
    g.created_at as gqr_created_at,
    g.gqr_status,
    p.gr_no,
    p.gr_dt,
    p.is_admin_approved
FROM gqr_entry g
LEFT JOIN pre_gr_entry p ON g.pre_gr_id = p.id
WHERE p.gr_no = '415' OR p.gr_no LIKE '%415%'
ORDER BY g.created_at DESC;

-- Check the most recent GQRs to see the current limit
SELECT 
    g.id as gqr_id,
    g.created_at as gqr_created_at,
    g.gqr_status,
    p.gr_no,
    p.gr_dt
FROM gqr_entry g
LEFT JOIN pre_gr_entry p ON g.pre_gr_id = p.id
ORDER BY g.created_at DESC
LIMIT 15;

-- Check if there are any GQRs with specific status that might be filtered out
SELECT 
    gqr_status,
    COUNT(*) as count
FROM gqr_entry 
GROUP BY gqr_status
ORDER BY count DESC;
