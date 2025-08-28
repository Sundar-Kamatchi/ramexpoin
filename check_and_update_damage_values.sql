-- Check current damage_allowed_kgs_ton values
SELECT id, vouchernumber, damage_allowed_kgs_ton, damage_allowed 
FROM purchase_orders 
ORDER BY id;

-- Update damage_allowed_kgs_ton for PO 0989 (assuming it has id = 9)
UPDATE purchase_orders 
SET damage_allowed_kgs_ton = 100 
WHERE vouchernumber = '0989';

-- Update all POs that have damage_allowed_kgs_ton = 0 to have a default value
-- You can modify this based on your requirements
UPDATE purchase_orders 
SET damage_allowed_kgs_ton = 100 
WHERE damage_allowed_kgs_ton = 0 OR damage_allowed_kgs_ton IS NULL;

-- Verify the update
SELECT id, vouchernumber, damage_allowed_kgs_ton, damage_allowed 
FROM purchase_orders 
ORDER BY id; 