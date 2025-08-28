-- Fix RLS policies for user_profiles table to resolve authentication errors
-- Run this script in your Supabase SQL editor

-- First, drop the problematic admin-only view policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;

-- Create a new policy that allows authenticated users to view profiles
-- This removes the circular dependency issue
CREATE POLICY "Authenticated users can view profiles" ON public.user_profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Ensure the table has RLS enabled
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Verify the policies are working
-- You can test this by running:
-- SELECT * FROM public.user_profiles WHERE auth.uid() IS NOT NULL; 