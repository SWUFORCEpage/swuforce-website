-- SWUFORCE v2.3: run in the EXISTING Supabase project's SQL Editor before deploying.
-- Idempotent migration; no changes to profiles, auth, existing board or officer tables.
create table if not exists public.page_entries (
  id uuid primary key default gen_random_uuid(),
  page text not null check (page in ('home','about','study','news','community','members','recruit','me')),
  category text not null default '' check (char_length(category) <= 35),
  title text not null check (char_length(title) between 2 and 120),
  body text not null default '' check (char_length(body) <= 2200),
  link_label text not null default '' check (char_length(link_label) <= 45),
  link_url text,
  image_url text,
  sort_order integer not null default 100 check (sort_order between 0 and 9999),
  is_published boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists page_entries_public_idx
  on public.page_entries(page, is_published, sort_order, created_at desc);
alter table public.page_entries enable row level security;
-- Do not let browsers bypass the Express permission checks through Supabase Data API.
revoke all on table public.page_entries from public, anon, authenticated;
grant all on table public.page_entries to service_role;
