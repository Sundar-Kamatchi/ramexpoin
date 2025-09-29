-- Check if the required columns exist in gqr_entry table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'gqr_entry' 
AND column_name IN (
  'weight_shortage_weight',
  'user_remark', 
  'weight_shortage_request_status',
  'requested_weight_shortage',
  'admin_remark'
)
ORDER BY column_name;