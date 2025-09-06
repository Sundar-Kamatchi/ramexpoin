-- Add gr_no column to gqr_entry table
-- This will maintain the same number as the corresponding pre_gr_entry

ALTER TABLE gqr_entry 
ADD COLUMN gr_no VARCHAR(50);

-- Update existing GQR entries to use the same number as their corresponding Pre-GR
UPDATE gqr_entry 
SET gr_no = pre_gr_entry.gr_no
FROM pre_gr_entry 
WHERE gqr_entry.pre_gr_entry_id = pre_gr_entry.id;

-- Make the column NOT NULL after populating existing data
ALTER TABLE gqr_entry 
ALTER COLUMN gr_no SET NOT NULL;

-- Add an index for better performance
CREATE INDEX idx_gqr_entry_gr_no ON gqr_entry(gr_no);

-- Add a unique constraint to ensure no duplicate GR numbers
ALTER TABLE gqr_entry 
ADD CONSTRAINT unique_gr_no UNIQUE (gr_no);
