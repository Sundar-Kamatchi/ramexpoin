-- Add gqr_no column to gqr_entry table
-- This will maintain the same number as the corresponding pre_gr_entry

ALTER TABLE gqr_entry 
ADD COLUMN gqr_no VARCHAR(50);

-- Update existing GQR entries to use the same number as their corresponding Pre-GR
UPDATE gqr_entry 
SET gqr_no = pre_gr_entry.vouchernumber
FROM pre_gr_entry 
WHERE gqr_entry.pre_gr_entry_id = pre_gr_entry.id;

-- Make the column NOT NULL after populating existing data
ALTER TABLE gqr_entry 
ALTER COLUMN gqr_no SET NOT NULL;

-- Add an index for better performance
CREATE INDEX idx_gqr_entry_gqr_no ON gqr_entry(gqr_no);

-- Add a unique constraint to ensure no duplicate GQR numbers
ALTER TABLE gqr_entry 
ADD CONSTRAINT unique_gqr_no UNIQUE (gqr_no);
