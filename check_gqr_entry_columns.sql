-- Check the actual columns in gqr_entry table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'gqr_entry' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if there's a gqr_no column instead
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'gqr_entry' 
AND table_schema = 'public'
AND column_name LIKE '%gr%'
ORDER BY ordinal_position;
