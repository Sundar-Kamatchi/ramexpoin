-- Fix duplicate foreign key issue in gqr_entry table
-- Based on schema.sql, the original column is 'pre_gr_id'
-- We need to check if 'pre_gr_entry_id' was added later and drop it

-- Step 1: Check which columns exist and have data
DO $$
BEGIN
    -- Check if pre_gr_entry_id column exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'gqr_entry' 
        AND column_name = 'pre_gr_entry_id'
    ) THEN
        RAISE NOTICE 'pre_gr_entry_id column exists';
        
        -- Check data in both columns
        PERFORM 
            COUNT(*) as total_rows,
            COUNT(pre_gr_id) as pre_gr_id_count,
            COUNT(pre_gr_entry_id) as pre_gr_entry_id_count
        FROM gqr_entry;
        
        -- If pre_gr_entry_id has data, migrate it to pre_gr_id
        IF EXISTS (SELECT 1 FROM gqr_entry WHERE pre_gr_entry_id IS NOT NULL) THEN
            RAISE NOTICE 'Migrating data from pre_gr_entry_id to pre_gr_id...';
            
            -- Update pre_gr_id with pre_gr_entry_id values where pre_gr_id is null
            UPDATE gqr_entry 
            SET pre_gr_id = pre_gr_entry_id 
            WHERE pre_gr_id IS NULL AND pre_gr_entry_id IS NOT NULL;
            
            RAISE NOTICE 'Data migration completed';
        END IF;
        
        -- Drop the pre_gr_entry_id column
        RAISE NOTICE 'Dropping pre_gr_entry_id column...';
        ALTER TABLE gqr_entry DROP COLUMN IF EXISTS pre_gr_entry_id;
        RAISE NOTICE 'pre_gr_entry_id column dropped successfully';
        
    ELSE
        RAISE NOTICE 'pre_gr_entry_id column does not exist - no action needed';
    END IF;
END $$;

-- Step 2: Verify the fix
SELECT 
    'gqr_entry' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'gqr_entry' 
AND column_name LIKE '%pre_gr%'
ORDER BY column_name;

-- Step 3: Check foreign key constraints
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'gqr_entry'
    AND kcu.column_name LIKE '%pre_gr%';
