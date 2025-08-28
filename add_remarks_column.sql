-- Add remarks column to pre_gr_entry table
ALTER TABLE pre_gr_entry ADD COLUMN IF NOT EXISTS remarks text; 