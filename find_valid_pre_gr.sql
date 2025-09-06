-- Find valid Pre-GR entries that can be used for GQR creation
SELECT 
    id,
    gr_no,
    is_gqr_created,
    is_admin_approved,
    net_wt,
    date
FROM pre_gr_entry 
WHERE is_admin_approved = true
ORDER BY id DESC
LIMIT 10;

-- Check which ones already have GQRs
SELECT 
    p.id as pre_gr_id,
    p.gr_no,
    p.is_gqr_created,
    g.id as gqr_id,
    g.gr_no as gqr_gr_no
FROM pre_gr_entry p
LEFT JOIN gqr_entry g ON p.id = g.pre_gr_id
WHERE p.is_admin_approved = true
ORDER BY p.id DESC
LIMIT 10;
