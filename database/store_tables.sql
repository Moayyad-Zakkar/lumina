-- Store catalog and order requests
-- Run in Supabase SQL Editor (Dashboard → SQL → New query)

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.store_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description_en text,
  description_ar text,
  price numeric(12, 2) not null check (price >= 0),
  image_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.store_requests (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid references public.store_products (id) on delete set null,
  quantity integer not null default 1 check (quantity > 0),
  -- Snapshots at order time (catalog price/name may change later)
  product_name text not null,
  product_description text,
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  total_price numeric(12, 2) not null check (total_price >= 0),
  notes text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  additional_service_id uuid,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Link approved requests to billing line items (optional but recommended)
alter table public.additional_services
  add column if not exists store_request_id uuid references public.store_requests (id) on delete set null;

alter table public.store_requests
  drop constraint if exists store_requests_additional_service_id_fkey;

alter table public.store_requests
  add constraint store_requests_additional_service_id_fkey
  foreign key (additional_service_id) references public.additional_services (id) on delete set null;

-- ---------------------------------------------------------------------------
-- updated_at trigger for store_products
-- ---------------------------------------------------------------------------

create or replace function public.set_store_products_updated_at ()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists store_products_updated_at on public.store_products;

create trigger store_products_updated_at
before update on public.store_products
for each row
execute function public.set_store_products_updated_at ();


-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.store_products enable row level security;
alter table public.store_requests enable row level security;

-- store_products: doctors read active catalog; admins manage all
drop policy if exists "store_products_select_active" on public.store_products;
create policy "store_products_select_active"
on public.store_products
for select
to authenticated
using (is_active = true or public.is_admin ());

drop policy if exists "store_products_admin_insert" on public.store_products;
create policy "store_products_admin_insert"
on public.store_products
for insert
to authenticated
with check (public.is_admin ());

drop policy if exists "store_products_admin_update" on public.store_products;
create policy "store_products_admin_update"
on public.store_products
for update
to authenticated
using (public.is_admin ())
with check (public.is_admin ());

drop policy if exists "store_products_admin_delete" on public.store_products;
create policy "store_products_admin_delete"
on public.store_products
for delete
to authenticated
using (public.is_admin ());

-- store_requests: doctors create/read own; admins read/update all
drop policy if exists "store_requests_select_own_or_admin" on public.store_requests;
create policy "store_requests_select_own_or_admin"
on public.store_requests
for select
to authenticated
using (doctor_id = auth.uid () or public.is_admin ());

drop policy if exists "store_requests_insert_own" on public.store_requests;
create policy "store_requests_insert_own"
on public.store_requests
for insert
to authenticated
with check (doctor_id = auth.uid ());

drop policy if exists "store_requests_admin_update" on public.store_requests;
create policy "store_requests_admin_update"
on public.store_requests
for update
to authenticated
using (public.is_admin ())
with check (public.is_admin ());

-- ---------------------------------------------------------------------------
-- Storage bucket for product images (public read)
-- Dashboard → Storage → New bucket: store-images, Public: ON
-- Or run (requires service role / dashboard):
-- ---------------------------------------------------------------------------

-- insert into storage.buckets (id, name, public) values ('store-images', 'store-images', true)
-- on conflict (id) do nothing;

drop policy if exists "store_images_public_read" on storage.objects;
create policy "store_images_public_read"
on storage.objects
for select
to public
using (bucket_id = 'store-images');

drop policy if exists "store_images_admin_upload" on storage.objects;
create policy "store_images_admin_upload"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'store-images' and public.is_admin ());

drop policy if exists "store_images_admin_update" on storage.objects;
create policy "store_images_admin_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'store-images' and public.is_admin ());

drop policy if exists "store_images_admin_delete" on storage.objects;
create policy "store_images_admin_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'store-images' and public.is_admin ());

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists store_products_active_sort_idx
on public.store_products (is_active, sort_order, created_at desc);

create index if not exists store_requests_status_created_idx
on public.store_requests (status, created_at desc);

create index if not exists store_requests_doctor_idx
on public.store_requests (doctor_id, created_at desc);
