-- SWUFORCE v2 database. Run once in Supabase > SQL Editor.
-- No public Data API access: all data requests go through the Render API.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 32),
  cohort text not null default '미지정' check (cohort ~ '^([1-9][0-9]?)(\.5)?$' or cohort = '미지정'),
  requested_status text not null default 'active' check (requested_status in ('active','alumni')),
  membership_status text not null default 'pending' check (membership_status in ('pending','active','alumni')),
  is_verified boolean not null default false,
  current_executive boolean not null default false,
  site_admin boolean not null default false,
  public_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  constraint verified_status check (not is_verified or membership_status <> 'pending'),
  constraint executive_status check (not current_executive or (is_verified and membership_status = 'active'))
);

create table if not exists public.officer_terms (
  id bigint generated always as identity primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  term_label text not null check (char_length(term_label) between 2 and 50),
  position text not null check (position in ('president','vice_president')),
  start_on date not null,
  end_on date,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  constraint valid_term_dates check (end_on is null or end_on >= start_on)
);

create table if not exists public.board_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles(id) on delete cascade,
  guest_name text check (guest_name is null or char_length(guest_name) between 2 and 30),
  guest_token_hash text unique,
  title text not null check (char_length(title) between 2 and 100),
  body text not null check (char_length(body) between 5 and 5000),
  visibility text not null default 'public' check (visibility in ('public','private')),
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  constraint exactly_one_author check ((author_id is not null and guest_token_hash is null and guest_name is null)
    or (author_id is null and guest_token_hash is not null and guest_name is not null))
);

create table if not exists public.board_replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.board_posts(id) on delete cascade,
  officer_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 2 and 5000),
  created_at timestamptz not null default now()
);

create index if not exists posts_created_idx on public.board_posts(created_at desc);
create index if not exists posts_author_idx on public.board_posts(author_id, created_at desc);
create index if not exists terms_profile_idx on public.officer_terms(profile_id);
create index if not exists replies_post_idx on public.board_replies(post_id, created_at);

-- The Auth trigger creates a *pending* application. User metadata is NOT trusted for privileges.
create or replace function public.handle_swuforce_signup() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  requested_name text;
  requested_cohort text;
  requested_member_status text;
begin
  requested_name := left(btrim(coalesce(new.raw_user_meta_data ->> 'display_name','')),32);
  if char_length(requested_name) < 2 then requested_name := '새 학회원'; end if;
  requested_cohort := coalesce(new.raw_user_meta_data ->> 'cohort','');
  if requested_cohort !~ '^([1-9][0-9]?)(\.5)?$' then requested_cohort := '미지정'; end if;
  requested_member_status := coalesce(new.raw_user_meta_data ->> 'requested_status','active');
  if requested_member_status not in ('active','alumni') then requested_member_status := 'active'; end if;
  insert into public.profiles(id, display_name, cohort, requested_status)
  values (new.id, requested_name, requested_cohort, requested_member_status);
  return new;
end;
$$;

revoke all on function public.handle_swuforce_signup() from public, anon, authenticated;

drop trigger if exists swuforce_signup_profile on auth.users;
create trigger swuforce_signup_profile after insert on auth.users
for each row execute function public.handle_swuforce_signup();

-- Every table has RLS enabled AND client Data API access revoked.
-- Backend secret key bypasses RLS; server/index.js must authorize every request.
alter table public.profiles enable row level security;
alter table public.officer_terms enable row level security;
alter table public.board_posts enable row level security;
alter table public.board_replies enable row level security;
revoke all on table public.profiles, public.officer_terms, public.board_posts, public.board_replies from anon, authenticated;
revoke all on sequence public.officer_terms_id_seq from anon, authenticated;
grant all on table public.profiles, public.officer_terms, public.board_posts, public.board_replies to service_role;
grant usage, select on sequence public.officer_terms_id_seq to service_role;

-- AFTER your first account is signed up and its email is verified, bootstrap ONE admin
-- from Supabase SQL Editor (replace the placeholder):
-- update public.profiles set membership_status='active', is_verified=true, site_admin=true,
--   current_executive=true
-- where id = (select id from auth.users where email = 'OFFICIAL_ADMIN_EMAIL');
-- This is intentionally not exposed as a website endpoint.
