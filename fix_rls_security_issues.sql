-- Fix Row Level Security (RLS) Issues
-- This script addresses the Supabase security errors by enabling RLS on all public tables

-- 1. Enable RLS on purchase_orders table
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

-- 2. Enable RLS on gap_items table
ALTER TABLE public.gap_items ENABLE ROW LEVEL SECURITY;

-- 3. Enable RLS on gqr_entry table
ALTER TABLE public.gqr_entry ENABLE ROW LEVEL SECURITY;

-- 4. Enable RLS on pre_gr_entry table
ALTER TABLE public.pre_gr_entry ENABLE ROW LEVEL SECURITY;

-- 5. Enable RLS on sieve_sizes table
ALTER TABLE public.sieve_sizes ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for purchase_orders table
-- Allow authenticated users to select
CREATE POLICY "Allow authenticated select on purchase_orders" ON public.purchase_orders
    FOR SELECT TO authenticated
    USING (true);

-- Allow authenticated users to insert
CREATE POLICY "Allow authenticated insert on purchase_orders" ON public.purchase_orders
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Allow authenticated users to update
CREATE POLICY "Allow authenticated update on purchase_orders" ON public.purchase_orders
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to delete
CREATE POLICY "Allow authenticated delete on purchase_orders" ON public.purchase_orders
    FOR DELETE TO authenticated
    USING (true);

-- 7. Create RLS policies for gap_items table
CREATE POLICY "Allow authenticated select on gap_items" ON public.gap_items
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated insert on gap_items" ON public.gap_items
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated update on gap_items" ON public.gap_items
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on gap_items" ON public.gap_items
    FOR DELETE TO authenticated
    USING (true);

-- 8. Create RLS policies for gqr_entry table
CREATE POLICY "Allow authenticated select on gqr_entry" ON public.gqr_entry
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated insert on gqr_entry" ON public.gqr_entry
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated update on gqr_entry" ON public.gqr_entry
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on gqr_entry" ON public.gqr_entry
    FOR DELETE TO authenticated
    USING (true);

-- 9. Create RLS policies for pre_gr_entry table
CREATE POLICY "Allow authenticated select on pre_gr_entry" ON public.pre_gr_entry
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated insert on pre_gr_entry" ON public.pre_gr_entry
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated update on pre_gr_entry" ON public.pre_gr_entry
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on pre_gr_entry" ON public.pre_gr_entry
    FOR DELETE TO authenticated
    USING (true);

-- 10. Create RLS policies for sieve_sizes table
CREATE POLICY "Allow authenticated select on sieve_sizes" ON public.sieve_sizes
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated insert on sieve_sizes" ON public.sieve_sizes
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated update on sieve_sizes" ON public.sieve_sizes
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on sieve_sizes" ON public.sieve_sizes
    FOR DELETE TO authenticated
    USING (true);

-- 11. Also enable RLS on other tables that might need it
-- Enable RLS on suppliers table
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated select on suppliers" ON public.suppliers
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated insert on suppliers" ON public.suppliers
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated update on suppliers" ON public.suppliers
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on suppliers" ON public.suppliers
    FOR DELETE TO authenticated
    USING (true);

-- Enable RLS on item_master table
ALTER TABLE public.item_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated select on item_master" ON public.item_master
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated insert on item_master" ON public.item_master
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated update on item_master" ON public.item_master
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on item_master" ON public.item_master
    FOR DELETE TO authenticated
    USING (true);

-- 12. Verify RLS is enabled on all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('purchase_orders', 'gap_items', 'gqr_entry', 'pre_gr_entry', 'sieve_sizes', 'suppliers', 'item_master')
ORDER BY tablename;
