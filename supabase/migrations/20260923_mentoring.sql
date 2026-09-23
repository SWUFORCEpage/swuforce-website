-- SWUFORCE v2.4: execute AFTER schema.sql and v2.3 page_entries migration.
-- Existing members, board posts, and officer records are preserved.
create table if not exists public.mentor_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  job_field text not null default '' check (char_length(job_field) <= 80),
  job_title text not null default '' check (char_length(job_title) <= 80),
  introduction text not null default '' check (char_length(introduction) <= 500),
  show_cohort boolean not null default false,
  accepting_requests boolean not null default false,
  email_notifications boolean not null default false,
  allow_full_question_email boolean not null default false,
  consent_version text,
  consent_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint mentor_opt_in check (not accepting_requests or (char_length(job_field) >= 2 and consent_at is not null)),
  constraint full_email_requires_alerts check (not allow_full_question_email or email_notifications)
);
create table if not exists public.mentor_requests (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.mentor_profiles(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  requester_nickname text not null check (char_length(requester_nickname) between 2 and 32),
  requester_cohort text,
  question text not null check (char_length(question) between 20 and 2000),
  status text not null default 'pending' check (status in ('pending','accepted','declined','answered','expired','closed')),
  allow_full_email boolean not null default false,
  consent_version text not null,
  consent_collect_at timestamptz not null,
  consent_share_at timestamptz not null,
  answer text check (answer is null or char_length(answer) between 2 and 5000),
  answered_at timestamptz,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '14 days'),
  closed_at timestamptz,
  email_notified_at timestamptz,
  constraint no_self_mentoring check (mentor_id <> requester_id)
);
create index if not exists mentor_requests_requester_created_idx on public.mentor_requests(requester_id, created_at desc);
create index if not exists mentor_requests_mentor_created_idx on public.mentor_requests(mentor_id, created_at desc);
create index if not exists mentor_requests_retention_idx on public.mentor_requests(closed_at);
alter table public.mentor_profiles enable row level security;
alter table public.mentor_requests enable row level security;
revoke all on table public.mentor_profiles, public.mentor_requests from public, anon, authenticated;
grant all on table public.mentor_profiles, public.mentor_requests to service_role;

-- Restrict direct access to the matching Render backend via the service role.
-- Requests without an answer expire in 14 days. Closed requests are deleted after 30 days.
create or replace function public.purge_mentor_requests()
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.mentor_requests
    set status = 'expired', closed_at = now()
    where status in ('pending','accepted') and expires_at <= now();
  delete from public.mentor_requests
    where closed_at is not null and closed_at <= now() - interval '30 days';
end;
$$;
revoke all on function public.purge_mentor_requests() from public, anon, authenticated;
grant execute on function public.purge_mentor_requests() to service_role;

-- The content editor can now show approved mentoring announcements (not private requests).
alter table public.page_entries drop constraint if exists page_entries_page_check;
alter table public.page_entries add constraint page_entries_page_check
  check (page in ('home','about','study','news','community','members','recruit','me','mentoring'));
