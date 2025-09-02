-- Add isTallyPosted column to gqr_entry table
ALTER TABLE gqr_entry 
ADD COLUMN IF NOT EXISTS is_tally_posted BOOLEAN DEFAULT FALSE;

-- Add index for better performance when filtering by tally posted status
CREATE INDEX IF NOT EXISTS idx_gqr_entry_tally_posted 
ON gqr_entry(is_tally_posted);

-- Update existing records to have is_tally_posted as false
UPDATE gqr_entry 
SET is_tally_posted = FALSE 
WHERE is_tally_posted IS NULL;

-- Add comment to the column
COMMENT ON COLUMN gqr_entry.is_tally_posted IS 'Indicates whether the GQR has been posted to Tally as a purchase voucher';
