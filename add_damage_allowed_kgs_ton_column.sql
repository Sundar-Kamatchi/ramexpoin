-- Add damage_allowed_kgs_ton column to purchase_orders table if it doesn't exist
-- This script checks if the column exists before adding it

DO $$
BEGIN
    -- Check if the column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'purchase_orders' 
        AND column_name = 'damage_allowed_kgs_ton'
    ) THEN
        -- Add the column
        ALTER TABLE purchase_orders 
        ADD COLUMN damage_allowed_kgs_ton DOUBLE PRECISION;
        
        RAISE NOTICE 'Added damage_allowed_kgs_ton column to purchase_orders table';
    ELSE
        RAISE NOTICE 'Column damage_allowed_kgs_ton already exists in purchase_orders table';
    END IF;
END $$;

-- Update existing records to have a default value if needed
UPDATE purchase_orders 
SET damage_allowed_kgs_ton = 0 
WHERE damage_allowed_kgs_ton IS NULL;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'purchase_orders' 
AND column_name = 'damage_allowed_kgs_ton'; 