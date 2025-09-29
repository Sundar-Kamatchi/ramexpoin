-- Ensure all required columns exist in gqr_entry table
-- This script will add any missing columns

-- Add weight_shortage_weight column if it doesn't exist
ALTER TABLE gqr_entry 
ADD COLUMN IF NOT EXISTS weight_shortage_weight NUMERIC(10, 3) DEFAULT 0;

-- Add user_remark column if it doesn't exist
ALTER TABLE gqr_entry 
ADD COLUMN IF NOT EXISTS user_remark TEXT DEFAULT '';

-- Add weight_shortage_request_status column if it doesn't exist
ALTER TABLE gqr_entry 
ADD COLUMN IF NOT EXISTS weight_shortage_request_status TEXT DEFAULT 'none' 
CHECK (weight_shortage_request_status IN ('none', 'pending', 'approved', 'rejected'));

-- Add requested_weight_shortage column if it doesn't exist
ALTER TABLE gqr_entry 
ADD COLUMN IF NOT EXISTS requested_weight_shortage NUMERIC(10, 3) DEFAULT 0;

-- Add admin_remark column if it doesn't exist
ALTER TABLE gqr_entry 
ADD COLUMN IF NOT EXISTS admin_remark TEXT DEFAULT '';

-- Verify the columns exist
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
