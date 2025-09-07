-- Update the RPC function to use the correct column name
-- This fixes the relationship ambiguity issue

-- First, drop the existing function to avoid return type conflicts
DROP FUNCTION IF EXISTS get_gqr_details_by_id(INTEGER);

-- Now create the new function with the correct column reference
CREATE OR REPLACE FUNCTION get_gqr_details_by_id(p_gqr_id INTEGER)
RETURNS TABLE (
  id INTEGER,
  gqr_no TEXT,
  created_at TIMESTAMPTZ,
  total_value_received NUMERIC,
  export_quality_weight NUMERIC,
  podi_weight NUMERIC,
  rot_weight NUMERIC,
  doubles_weight NUMERIC,
  sand_weight NUMERIC,
  rate NUMERIC,
  podi_rate NUMERIC,
  damage_allowed_kgs_ton NUMERIC,
  volatile_po_rate NUMERIC,
  volatile_podi_rate NUMERIC,
  volatile_wastage_kgs_per_ton NUMERIC,
  gqr_status TEXT,
  pre_gr_entry_id INTEGER,
  vouchernumber TEXT,
  net_wt NUMERIC,
  supplier_name TEXT,
  po_date DATE,
  item_name TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gqr.id,
    gqr.gqr_no,
    gqr.created_at,
    gqr.total_value_received,
    gqr.export_quality_weight,
    gqr.podi_weight,
    gqr.rot_weight,
    gqr.doubles_weight,
    gqr.sand_weight,
    po.rate,
    po.podi_rate,
    po.damage_allowed_kgs_ton,
    gqr.volatile_po_rate,
    gqr.volatile_podi_rate,
    gqr.volatile_wastage_kgs_per_ton,
    gqr.gqr_status,
    pre.id as pre_gr_entry_id,
    po.vouchernumber,
    pre.net_wt,
    s.name as supplier_name,
    po.date as po_date,
    im.item_name
  FROM gqr_entry gqr
  LEFT JOIN pre_gr_entry pre ON gqr.pre_gr_id = pre.id  -- FIXED: Use pre_gr_id instead of pre_gr_entry_id
  LEFT JOIN purchase_orders po ON pre.po_id = po.id
  LEFT JOIN suppliers s ON po.supplier_id = s.id
  LEFT JOIN item_master im ON po.item_id = im.id
  WHERE gqr.id = p_gqr_id::INTEGER;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_gqr_details_by_id(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_gqr_details_by_id(INTEGER) TO service_role;
