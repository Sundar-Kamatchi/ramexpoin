-- Enable Row Level Security (RLS) on tables that need it
-- This script only enables RLS without creating duplicate policies

-- 1. Enable RLS on purchase_orders table (policies already exist)
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

-- 2. Enable RLS on gap_items table
ALTER TABLE public.gap_items ENABLE ROW LEVEL SECURITY;

-- 3. Enable RLS on gqr_entry table
ALTER TABLE public.gqr_entry ENABLE ROW LEVEL SECURITY;

-- 4. Enable RLS on pre_gr_entry table
ALTER TABLE public.pre_gr_entry ENABLE ROW LEVEL SECURITY;

-- 5. Enable RLS on sieve_sizes table
ALTER TABLE public.sieve_sizes ENABLE ROW LEVEL SECURITY;

-- 6. Enable RLS on suppliers table
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- 7. Enable RLS on item_master table
ALTER TABLE public.item_master ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for gap_items table (if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'gap_items' 
        AND policyname = 'Allow authenticated select on gap_items'
    ) THEN
        CREATE POLICY "Allow authenticated select on gap_items" ON public.gap_items
            FOR SELECT TO authenticated
            USING (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'gap_items' 
        AND policyname = 'Allow authenticated insert on gap_items'
    ) THEN
        CREATE POLICY "Allow authenticated insert on gap_items" ON public.gap_items
            FOR INSERT TO authenticated
            WITH CHECK (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'gap_items' 
        AND policyname = 'Allow authenticated update on gap_items'
    ) THEN
        CREATE POLICY "Allow authenticated update on gap_items" ON public.gap_items
            FOR UPDATE TO authenticated
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'gap_items' 
        AND policyname = 'Allow authenticated delete on gap_items'
    ) THEN
        CREATE POLICY "Allow authenticated delete on gap_items" ON public.gap_items
            FOR DELETE TO authenticated
            USING (true);
    END IF;
END $$;

-- 9. Create RLS policies for gqr_entry table (if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'gqr_entry' 
        AND policyname = 'Allow authenticated select on gqr_entry'
    ) THEN
        CREATE POLICY "Allow authenticated select on gqr_entry" ON public.gqr_entry
            FOR SELECT TO authenticated
            USING (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'gqr_entry' 
        AND policyname = 'Allow authenticated insert on gqr_entry'
    ) THEN
        CREATE POLICY "Allow authenticated insert on gqr_entry" ON public.gqr_entry
            FOR INSERT TO authenticated
            WITH CHECK (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'gqr_entry' 
        AND policyname = 'Allow authenticated update on gqr_entry'
    ) THEN
        CREATE POLICY "Allow authenticated update on gqr_entry" ON public.gqr_entry
            FOR UPDATE TO authenticated
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'gqr_entry' 
        AND policyname = 'Allow authenticated delete on gqr_entry'
    ) THEN
        CREATE POLICY "Allow authenticated delete on gqr_entry" ON public.gqr_entry
            FOR DELETE TO authenticated
            USING (true);
    END IF;
END $$;

-- 10. Create RLS policies for pre_gr_entry table (if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'pre_gr_entry' 
        AND policyname = 'Allow authenticated select on pre_gr_entry'
    ) THEN
        CREATE POLICY "Allow authenticated select on pre_gr_entry" ON public.pre_gr_entry
            FOR SELECT TO authenticated
            USING (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'pre_gr_entry' 
        AND policyname = 'Allow authenticated insert on pre_gr_entry'
    ) THEN
        CREATE POLICY "Allow authenticated insert on pre_gr_entry" ON public.pre_gr_entry
            FOR INSERT TO authenticated
            WITH CHECK (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'pre_gr_entry' 
        AND policyname = 'Allow authenticated update on pre_gr_entry'
    ) THEN
        CREATE POLICY "Allow authenticated update on pre_gr_entry" ON public.pre_gr_entry
            FOR UPDATE TO authenticated
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'pre_gr_entry' 
        AND policyname = 'Allow authenticated delete on pre_gr_entry'
    ) THEN
        CREATE POLICY "Allow authenticated delete on pre_gr_entry" ON public.pre_gr_entry
            FOR DELETE TO authenticated
            USING (true);
    END IF;
END $$;

-- 11. Create RLS policies for sieve_sizes table (if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'sieve_sizes' 
        AND policyname = 'Allow authenticated select on sieve_sizes'
    ) THEN
        CREATE POLICY "Allow authenticated select on sieve_sizes" ON public.sieve_sizes
            FOR SELECT TO authenticated
            USING (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'sieve_sizes' 
        AND policyname = 'Allow authenticated insert on sieve_sizes'
    ) THEN
        CREATE POLICY "Allow authenticated insert on sieve_sizes" ON public.sieve_sizes
            FOR INSERT TO authenticated
            WITH CHECK (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'sieve_sizes' 
        AND policyname = 'Allow authenticated update on sieve_sizes'
    ) THEN
        CREATE POLICY "Allow authenticated update on sieve_sizes" ON public.sieve_sizes
            FOR UPDATE TO authenticated
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'sieve_sizes' 
        AND policyname = 'Allow authenticated delete on sieve_sizes'
    ) THEN
        CREATE POLICY "Allow authenticated delete on sieve_sizes" ON public.sieve_sizes
            FOR DELETE TO authenticated
            USING (true);
    END IF;
END $$;

-- 12. Create RLS policies for suppliers table (if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'suppliers' 
        AND policyname = 'Allow authenticated select on suppliers'
    ) THEN
        CREATE POLICY "Allow authenticated select on suppliers" ON public.suppliers
            FOR SELECT TO authenticated
            USING (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'suppliers' 
        AND policyname = 'Allow authenticated insert on suppliers'
    ) THEN
        CREATE POLICY "Allow authenticated insert on suppliers" ON public.suppliers
            FOR INSERT TO authenticated
            WITH CHECK (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'suppliers' 
        AND policyname = 'Allow authenticated update on suppliers'
    ) THEN
        CREATE POLICY "Allow authenticated update on suppliers" ON public.suppliers
            FOR UPDATE TO authenticated
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'suppliers' 
        AND policyname = 'Allow authenticated delete on suppliers'
    ) THEN
        CREATE POLICY "Allow authenticated delete on suppliers" ON public.suppliers
            FOR DELETE TO authenticated
            USING (true);
    END IF;
END $$;

-- 13. Create RLS policies for item_master table (if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'item_master' 
        AND policyname = 'Allow authenticated select on item_master'
    ) THEN
        CREATE POLICY "Allow authenticated select on item_master" ON public.item_master
            FOR SELECT TO authenticated
            USING (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'item_master' 
        AND policyname = 'Allow authenticated insert on item_master'
    ) THEN
        CREATE POLICY "Allow authenticated insert on item_master" ON public.item_master
            FOR INSERT TO authenticated
            WITH CHECK (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'item_master' 
        AND policyname = 'Allow authenticated update on item_master'
    ) THEN
        CREATE POLICY "Allow authenticated update on item_master" ON public.item_master
            FOR UPDATE TO authenticated
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'item_master' 
        AND policyname = 'Allow authenticated delete on item_master'
    ) THEN
        CREATE POLICY "Allow authenticated delete on item_master" ON public.item_master
            FOR DELETE TO authenticated
            USING (true);
    END IF;
END $$;

-- 14. Verify RLS is enabled on all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('purchase_orders', 'gap_items', 'gqr_entry', 'pre_gr_entry', 'sieve_sizes', 'suppliers', 'item_master')
ORDER BY tablename;
