-- Check and fix RLS policies for user_profiles table
-- Run this in your Supabase SQL editor

-- 1. First, let's see what policies exist
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- 2. Drop all existing policies on user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.user_profiles;

-- 3. Create simple, permissive policies for testing
-- Allow all authenticated users to view profiles
CREATE POLICY "Allow authenticated users to view profiles" ON public.user_profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Allow users to insert their own profile
CREATE POLICY "Allow users to insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Allow users to update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- 4. Verify the policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- 5. Test query (this should work now)
-- SELECT * FROM public.user_profiles WHERE auth.uid() IS NOT NULL LIMIT 5; 