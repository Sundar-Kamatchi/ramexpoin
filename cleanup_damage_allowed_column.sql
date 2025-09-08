-- ============================================================================
-- CLEANUP: Remove damage_allowed column from purchase_orders table
-- ============================================================================
-- 
-- This script safely removes the old 'damage_allowed' column from the 
-- purchase_orders table since all code has been migrated to use 
-- 'damage_allowed_kgs_ton' instead.
--
-- Prerequisites:
-- 1. All application code has been updated to use damage_allowed_kgs_ton
-- 2. Type definitions have been updated
-- 3. Schema constants have been updated
-- ============================================================================

-- Step 1: Verify current state
SELECT 
    'Current purchase_orders table structure:' as info;
    
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'purchase_orders' 
AND column_name IN ('damage_allowed', 'damage_allowed_kgs_ton')
ORDER BY column_name;

-- Step 2: Check for any data that might need migration
SELECT 
    'Checking for records that might need migration:' as info;

SELECT 
    id, 
    vouchernumber, 
    damage_allowed, 
    damage_allowed_kgs_ton,
    quantity,
    CASE 
        WHEN damage_allowed IS NOT NULL AND damage_allowed_kgs_ton IS NULL 
        THEN 'NEEDS_MIGRATION'
        WHEN damage_allowed IS NOT NULL AND damage_allowed_kgs_ton IS NOT NULL 
        THEN 'BOTH_PRESENT'
        WHEN damage_allowed IS NULL AND damage_allowed_kgs_ton IS NOT NULL 
        THEN 'NEW_FORMAT_ONLY'
        ELSE 'NO_DATA'
    END as migration_status
FROM purchase_orders 
WHERE damage_allowed IS NOT NULL OR damage_allowed_kgs_ton IS NOT NULL
ORDER BY id;

-- Step 3: Migrate any remaining data (if needed)
-- This step is optional - only run if you see records with 'NEEDS_MIGRATION' status
/*
UPDATE purchase_orders 
SET damage_allowed_kgs_ton = (quantity * 1000 * damage_allowed / 100)
WHERE damage_allowed IS NOT NULL 
  AND damage_allowed_kgs_ton IS NULL 
  AND damage_allowed > 0;
*/

-- Step 4: Verify no data will be lost
SELECT 
    'Final verification before dropping column:' as info;

SELECT 
    COUNT(*) as total_records,
    COUNT(damage_allowed) as records_with_old_column,
    COUNT(damage_allowed_kgs_ton) as records_with_new_column,
    COUNT(CASE WHEN damage_allowed IS NOT NULL AND damage_allowed_kgs_ton IS NULL THEN 1 END) as records_only_in_old_column
FROM purchase_orders;

-- Step 5: Drop the old column
-- Only run this if the verification shows no data loss
ALTER TABLE purchase_orders DROP COLUMN IF EXISTS damage_allowed;

-- Step 6: Verify the column has been removed
SELECT 
    'Verification: damage_allowed column removed' as info;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'purchase_orders' 
AND column_name IN ('damage_allowed', 'damage_allowed_kgs_ton')
ORDER BY column_name;

-- Step 7: Final table structure
SELECT 
    'Final purchase_orders table structure:' as info;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'purchase_orders' 
ORDER BY ordinal_position;
