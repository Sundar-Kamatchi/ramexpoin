-- First, let's see the current data to understand the structure
SELECT id, vouchernumber, quantity, damage_allowed, damage_allowed_kgs_ton 
FROM purchase_orders 
ORDER BY id;

-- Update damage_allowed_kgs_ton with calculated values
-- Formula: quantity * 1000 * damage_allowed / 100
UPDATE purchase_orders 
SET damage_allowed_kgs_ton = (quantity * 1000 * damage_allowed / 100)
WHERE damage_allowed IS NOT NULL AND damage_allowed > 0;

-- Verify the calculated values
SELECT id, vouchernumber, quantity, damage_allowed, damage_allowed_kgs_ton,
       (quantity * 1000 * damage_allowed / 100) as calculated_value
FROM purchase_orders 
ORDER BY id;

-- Drop the old damage_allowed column
ALTER TABLE purchase_orders DROP COLUMN damage_allowed;

-- Verify the final structure
SELECT id, vouchernumber, quantity, damage_allowed_kgs_ton 
FROM purchase_orders 
ORDER BY id; 