-- Check the actual data structure
SELECT 
    gqr.id as gqr_id,
    pre.id as pre_gr_id,
    pre.vouchernumber as pre_gr_vouchernumber,
    pre.gr_no as pre_gr_number,
    po.id as po_id,
    po.vouchernumber as po_vouchernumber,
    s.name as supplier_name
FROM gqr_entry gqr
LEFT JOIN pre_gr_entry pre ON gqr.pre_gr_id = pre.id
LEFT JOIN purchase_orders po ON pre.po_id = po.id
LEFT JOIN suppliers s ON po.supplier_id = s.id
WHERE gqr.id = 1
LIMIT 1;
