-- Simple script to drop the duplicate pre_gr_entry_id column
-- Based on schema.sql, pre_gr_id is the original foreign key column

-- Step 1: Check if pre_gr_entry_id column exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'gqr_entry' 
            AND column_name = 'pre_gr_entry_id'
        ) 
        THEN 'pre_gr_entry_id column EXISTS - will be dropped'
        ELSE 'pre_gr_entry_id column does NOT exist'
    END as column_status;

-- Step 2: Drop the pre_gr_entry_id column if it exists
ALTER TABLE gqr_entry DROP COLUMN IF EXISTS pre_gr_entry_id;

-- Step 3: Verify only pre_gr_id remains
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'gqr_entry' 
AND column_name LIKE '%pre_gr%'
ORDER BY column_name;

-- Step 4: Check foreign key constraints
SELECT 
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'gqr_entry'
    AND kcu.column_name LIKE '%pre_gr%';
