-- Run only AFTER v2.5 frontend/server deployment and setting privacy metadata on Render.
-- Enforces an explicit sign-up notice acknowledgement on new Supabase Auth registrations.
-- Existing accounts remain unchanged; does not backfill or falsify their agreement.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS privacy_notice_version text,
  ADD COLUMN IF NOT EXISTS privacy_notice_accepted_at timestamptz;

CREATE OR REPLACE FUNCTION public.handle_swuforce_signup() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  requested_name text;
  requested_cohort text;
  requested_member_status text;
  notice_version text;
BEGIN
  notice_version := coalesce(new.raw_user_meta_data ->> 'privacy_notice_version','');
  IF notice_version <> '2026-09-23-v2'
      OR coalesce(new.raw_user_meta_data ->> 'privacy_agreed','') <> 'true' THEN
    RAISE EXCEPTION 'Registration privacy acknowledgement is required';
  END IF;
  requested_name := left(btrim(coalesce(new.raw_user_meta_data ->> 'display_name','')),32);
  IF char_length(requested_name) < 2 THEN requested_name := '새 학회원'; END IF;
  requested_cohort := coalesce(new.raw_user_meta_data ->> 'cohort','');
  IF requested_cohort !~ '^([1-9][0-9]?)(\.5)?$' THEN requested_cohort := '미지정'; END IF;
  requested_member_status := coalesce(new.raw_user_meta_data ->> 'requested_status','active');
  IF requested_member_status NOT IN ('active','alumni') THEN requested_member_status := 'active'; END IF;
  INSERT INTO public.profiles(id, display_name, cohort, requested_status,
    privacy_notice_version, privacy_notice_accepted_at)
  VALUES(new.id, requested_name, requested_cohort, requested_member_status,
    notice_version, now());
  RETURN new;
END;
$$;
REVOKE ALL ON FUNCTION public.handle_swuforce_signup() FROM PUBLIC, anon, authenticated;
-- Existing trigger swuforce_signup_profile continues to call this replaced function.
