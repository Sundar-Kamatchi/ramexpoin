-- Create the missing get_pre_gr_for_gqr function
-- This function returns Pre-GR entries that are approved and available for GQR creation

CREATE OR REPLACE FUNCTION get_pre_gr_for_gqr()
RETURNS TABLE (
  pre_gr_id INTEGER,
  pre_gr_vouchernumber TEXT,
  date DATE,
  supplier_name TEXT,
  net_wt NUMERIC,
  laden_wt NUMERIC,
  empty_wt NUMERIC,
  po_vouchernumber TEXT,
  item_name TEXT,
  po_date DATE,
  po_rate NUMERIC,
  po_quantity NUMERIC,
  podi_rate NUMERIC,
  damage_allowed NUMERIC,
  cargo NUMERIC,
  damage_allowed_kgs_ton NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pre.id as pre_gr_id,
    pre.vouchernumber as pre_gr_vouchernumber,
    pre.date,
    s.name as supplier_name,
    pre.net_wt,
    pre.ladden_wt as laden_wt,
    pre.empty_wt,
    po.vouchernumber as po_vouchernumber,
    im.item_name as item_name,
    po.created_at::date as po_date,
    po.rate as po_rate,
    po.quantity as po_quantity,
    po.podi_rate,
    po.damage_allowed,
    po.cargo,
    po.damage_allowed_kgs_ton
  FROM pre_gr_entry pre
  LEFT JOIN purchase_orders po ON pre.po_id = po.id
  LEFT JOIN suppliers s ON po.supplier_id = s.id
  LEFT JOIN item_master im ON pre.item_id = im.id
  WHERE pre.is_admin_approved = true 
    AND (pre.is_gqr_created IS NULL OR pre.is_gqr_created = false)
  ORDER BY pre.date DESC, pre.id DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_pre_gr_for_gqr() TO authenticated;

-- Instructions:
-- 1. Copy and paste this entire SQL into your Supabase SQL editor
-- 2. Run the query to create the function
-- 3. The function will return Pre-GR entries that are approved and haven't been used for GQR creation yet 