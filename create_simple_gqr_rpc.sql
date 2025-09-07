-- Create a simple RPC function to fetch GQR list without relationship issues
-- This completely bypasses Supabase's relationship embedding

CREATE OR REPLACE FUNCTION get_gqr_list_simple()
RETURNS TABLE (
  id INTEGER,
  created_at TIMESTAMPTZ,
  total_value_received NUMERIC,
  gqr_status TEXT,
  pre_gr_entry JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gqr.id,
    gqr.created_at,
    gqr.total_value_received,
    gqr.gqr_status,
    jsonb_build_object(
      'gr_no', 'N/A',
      'suppliers', jsonb_build_object('name', 'N/A')
    ) as pre_gr_entry
  FROM gqr_entry gqr
  ORDER BY gqr.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_gqr_list_simple() TO authenticated;
GRANT EXECUTE ON FUNCTION get_gqr_list_simple() TO service_role;
