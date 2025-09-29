-- Add User Remark functionality for Weight Shortage requests
-- This allows users to request weight shortage updates that only admins can approve

-- Step 1: Add user_remark column to gqr_entry table
ALTER TABLE gqr_entry 
ADD COLUMN IF NOT EXISTS user_remark TEXT DEFAULT '';

-- Step 2: Add weight_shortage_request_status column to track request status
ALTER TABLE gqr_entry 
ADD COLUMN IF NOT EXISTS weight_shortage_request_status TEXT DEFAULT 'none' CHECK (weight_shortage_request_status IN ('none', 'pending', 'approved', 'rejected'));

-- Step 3: Add requested_weight_shortage column to store user's requested value
ALTER TABLE gqr_entry 
ADD COLUMN IF NOT EXISTS requested_weight_shortage NUMERIC(10, 3) DEFAULT 0;

-- Step 4: Add admin_remark column for admin responses
ALTER TABLE gqr_entry 
ADD COLUMN IF NOT EXISTS admin_remark TEXT DEFAULT '';

-- Instructions:
-- 1. Copy and paste this entire SQL into your Supabase SQL editor
-- 2. Run the query to add the necessary columns
-- 3. The weight shortage field will now be admin-only with user remark functionality
