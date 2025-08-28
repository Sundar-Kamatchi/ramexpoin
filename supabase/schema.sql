-- Suppliers table
create table if not exists suppliers (
  id serial primary key,
  name text not null,
  contact_name text,
  phone text,
  address text,
  created_at timestamptz default now()
);

-- Item Master table
create table if not exists item_master (
  id uuid primary key default gen_random_uuid(),
  item_name text not null,
  -- Optional: if your live DB uses text unit & hsn_code, this file is a fallback schema
  -- item_unit and hsn_code columns may exist in production DB; safely add if they don't
  item_unit text,
  hsn_code text,
  created_at timestamptz default now()
);

-- Gap Items table
create table if not exists gap_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- Purchase Orders table
create table if not exists purchase_orders (
  id serial primary key,
  vouchernumber text unique,
  date date not null,
  supplier_id integer references suppliers(id) on delete restrict,
  item_id uuid references item_master(id) on delete restrict,
  quantity numeric(10, 2) not null,
  rate numeric(10, 2),
  damage_allowed numeric(5, 2),
  cargo numeric(5, 2),
  damage_allowed_kgs_ton double precision,
  podi_rate double precision,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  tally_posted boolean default false,
  tally_posted_at timestamp without time zone,
  tally_response text,
  admin_remark text,
  po_closed boolean
);

-- Pre-GR Entry table
create table if not exists pre_gr_entry (
  id serial primary key,
  vouchernumber text,
  date date not null,
  supplier_id integer references suppliers(id) on delete restrict,
  item_id uuid references item_master(id) on delete restrict,
  gap_item1_id uuid references gap_items(id),
  gap_item2_id uuid references gap_items(id),
  quantity numeric(10, 2) not null,
  rate numeric(10, 2),
  damage_allowed numeric(5, 2),
  cargo numeric(5, 2),
  ladden_wt numeric(10, 3),
  empty_wt numeric(10, 3),
  net_wt numeric(10, 3),
  doubles numeric(10, 3),
  weight_shortage numeric(10, 3),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  bags integer,
  loaded_from text,
  vehicle_no text,
  weight_bridge_name text,
  prepared_by text,
  gr_no text,
  gr_dt date,
  po_id integer references purchase_orders(id) on delete restrict,
  sieve_no text,
  is_admin_approved boolean,
  admin_remark text,
  gap_item1_bags integer,
  gap_item2_bags integer,
  podi_bags integer,
  advance_paid numeric,
  admin_approved_advance double precision,
  is_gqr_created boolean,
  remarks text
);

-- GQR Entry table
create table if not exists gqr_entry (
  id serial primary key,
  pre_gr_id integer references pre_gr_entry(id) on delete restrict,
  date date not null,
  rot_weight numeric(10, 3),
  doubles_weight numeric(10, 3),
  sand_weight numeric(10, 3),
  net_wt numeric(10, 3),
  export_quality_weight numeric(10, 3),
  podi_weight numeric(10, 3),
  gap_items_weight numeric(10, 3),
  total_value_received numeric(10, 2),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  volatile_po_rate float,
  volatile_gap_item_rate float,
  volatile_podi_rate float,
  volatile_wastage_kgs_per_ton float,
  gqr_status text default 'Open'
);

-- User Profiles table
create table if not exists user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  role text check (role in ('user', 'admin')) default 'user',
  updated_at timestamptz default now()
);

-- Create indexes for better performance
create index if not exists idx_purchase_orders_supplier_id on purchase_orders(supplier_id);
create index if not exists idx_purchase_orders_item_id on purchase_orders(item_id);
create index if not exists idx_purchase_orders_created_at_desc on purchase_orders(created_at desc);
create index if not exists idx_purchase_orders_vouchernumber on purchase_orders(vouchernumber);

create index if not exists idx_pre_gr_entry_po_id on pre_gr_entry(po_id);
create index if not exists idx_pre_gr_entry_supplier_id on pre_gr_entry(supplier_id);
create index if not exists idx_pre_gr_entry_item_id on pre_gr_entry(item_id);

create index if not exists idx_gqr_entry_pre_gr_id on gqr_entry(pre_gr_id);

-- Units master table (for UQC codes)
create table if not exists units (
  id serial primary key,
  quantity text not null,
  quantity_type text,
  uqc_code text not null unique,
  created_at timestamptz default now()
);

-- Seed units from src/app/units.txt (idempotent)
insert into units (quantity, quantity_type, uqc_code) values
  ('BAGS','Measure','BAG'),
  ('BALE','Measure','BAL'),
  ('BUNDLES','Measure','BDL'),
  ('BUCKLES','Measure','BKL'),
  ('BILLIONS OF UNITS','Measure','BOU'),
  ('BOX','Measure','BOX'),
  ('BOTTLES','Measure','BTL'),
  ('BUNCHES','Measure','BUN'),
  ('CANS','Measure','CAN'),
  ('CUBIC METER','Volume','CBM'),
  ('CUBIC CENTIMETER','Volume','CCM'),
  ('CENTIMETER','Length','CMS'),
  ('CARTONS','Measure','CTN'),
  ('DOZEN','Measure','DOZ'),
  ('DRUM','Measure','DRM'),
  ('GREAT GROSS','Measure','GGR'),
  ('GRAMS','Weight','GMS'),
  ('GROSS','Measure','GRS'),
  ('GROSS YARDS','Length','GYD'),
  ('KILOGRAMS','Weight','KGS'),
  ('KILOLITER','Volume','KLR'),
  ('KILOMETRE','Length','KME'),
  ('MILLILITRE','Volume','MLT'),
  ('METERS','Length','MTR'),
  ('METRIC TONS','Weight','MTS'),
  ('NUMBERS','Measure','NOS'),
  ('PACKS','Measure','PAC'),
  ('PIECES','Measure','PCS'),
  ('PAIRS','Measure','PRS'),
  ('QUINTAL','Weight','QTL'),
  ('ROLLS','Measure','ROL'),
  ('SETS','Measure','SET'),
  ('SQUARE FEET','Area','SQF'),
  ('SQUARE METERS','Area','SQM'),
  ('SQUARE YARDS','Area','SQY'),
  ('TABLETS','Measure','TBS'),
  ('TEN GROSS','Measure','TGM'),
  ('THOUSANDS','Measure','THD'),
  ('TONNES','Weight','TON'),
  ('TUBES','Measure','TUB'),
  ('US GALLONS','Volume','UGS'),
  ('UNITS','Measure','UNT'),
  ('YARDS','Length','YDS'),
  ('OTHERS','', 'OTH')
on conflict (uqc_code) do nothing;

-- RLS: allow authenticated users to read units
alter table if exists units enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'units' and policyname = 'units_select_auth'
  ) then
    create policy units_select_auth on public.units for select to authenticated using (true);
  end if;
end $$;
