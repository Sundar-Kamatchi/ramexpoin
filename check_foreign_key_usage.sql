-- Check which foreign key columns are actually being used in gqr_entry table

-- Check if pre_gr_entry_id column exists and has data
SELECT 
  'pre_gr_entry_id' as column_name,
  COUNT(*) as total_rows,
  COUNT(pre_gr_entry_id) as non_null_count,
  COUNT(*) - COUNT(pre_gr_entry_id) as null_count
FROM gqr_entry;

-- Check if pre_gr_id column exists and has data  
SELECT 
  'pre_gr_id' as column_name,
  COUNT(*) as total_rows,
  COUNT(pre_gr_id) as non_null_count,
  COUNT(*) - COUNT(pre_gr_id) as null_count
FROM gqr_entry;

-- Show sample data to see which column is populated
SELECT 
  id,
  pre_gr_entry_id,
  pre_gr_id,
  created_at
FROM gqr_entry 
ORDER BY created_at DESC 
LIMIT 10;

-- Check if there are any rows where both columns have values
SELECT 
  COUNT(*) as rows_with_both_columns_populated
FROM gqr_entry 
WHERE pre_gr_entry_id IS NOT NULL AND pre_gr_id IS NOT NULL;

-- Check if there are any rows where only one column has values
SELECT 
  COUNT(*) as rows_with_only_pre_gr_entry_id
FROM gqr_entry 
WHERE pre_gr_entry_id IS NOT NULL AND pre_gr_id IS NULL;

SELECT 
  COUNT(*) as rows_with_only_pre_gr_id
FROM gqr_entry 
WHERE pre_gr_entry_id IS NULL AND pre_gr_id IS NOT NULL;
