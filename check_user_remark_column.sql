-- Check if user_remark column exists in gqr_entry table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'gqr_entry' 
AND column_name = 'user_remark';

-- If the column doesn't exist, create it
ALTER TABLE gqr_entry 
ADD COLUMN IF NOT EXISTS user_remark TEXT DEFAULT '';

-- Verify the column exists
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'gqr_entry' 
AND column_name = 'user_remark';
