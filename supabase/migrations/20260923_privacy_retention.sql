-- SWUFORCE v2.5. First apply schema.sql, page_entries and mentoring migrations.
-- Adds *new* guest-post deadlines only. Legacy guest posts remain unchanged for review.
-- Does not delete existing members, member posts, or officer history.
ALTER TABLE public.board_posts
  ADD COLUMN IF NOT EXISTS guest_delete_at timestamptz,
  ADD COLUMN IF NOT EXISTS retention_hold boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS privacy_notice_version text,
  ADD COLUMN IF NOT EXISTS privacy_ack_at timestamptz;
CREATE INDEX IF NOT EXISTS board_guest_retention_idx
  ON public.board_posts (guest_delete_at)
  WHERE author_id IS NULL AND guest_delete_at IS NOT NULL AND NOT retention_hold;

CREATE TABLE IF NOT EXISTS public.privacy_retention_runs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ran_at timestamptz NOT NULL DEFAULT now(),
  expired_mentor_requests integer NOT NULL DEFAULT 0,
  deleted_mentor_requests integer NOT NULL DEFAULT 0,
  deleted_guest_posts integer NOT NULL DEFAULT 0
);
ALTER TABLE public.privacy_retention_runs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.privacy_retention_runs FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.privacy_retention_runs TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.privacy_retention_runs_id_seq TO service_role;

-- Keep this routine separate from public.purge_mentor_requests(), which the mentoring
-- endpoints may call after user interactions. The scheduled routine records aggregate
-- counts, not names, user IDs, questions, or IP addresses.
CREATE OR REPLACE FUNCTION public.run_swuforce_retention()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  expired_count integer := 0;
  mentor_delete_count integer := 0;
  guest_delete_count integer := 0;
BEGIN
  UPDATE public.mentor_requests
     SET status = 'expired', closed_at = now()
   WHERE status IN ('pending','accepted') AND expires_at <= now();
  GET DIAGNOSTICS expired_count = ROW_COUNT;

  DELETE FROM public.mentor_requests
   WHERE closed_at IS NOT NULL AND closed_at <= now() - INTERVAL '30 days';
  GET DIAGNOSTICS mentor_delete_count = ROW_COUNT;

  -- Only guest posts created after v2.5 opt-in and carrying an explicit deadline.
  -- A hold is set by authorized staff in SQL only when legally justified.
  DELETE FROM public.board_posts
   WHERE author_id IS NULL AND guest_delete_at IS NOT NULL
     AND guest_delete_at <= now() AND NOT retention_hold;
  GET DIAGNOSTICS guest_delete_count = ROW_COUNT;

  INSERT INTO public.privacy_retention_runs
    (expired_mentor_requests, deleted_mentor_requests, deleted_guest_posts)
  VALUES (expired_count, mentor_delete_count, guest_delete_count);

  RETURN jsonb_build_object('expiredMentoring',expired_count,
    'deletedMentoring',mentor_delete_count,'deletedGuestPosts',guest_delete_count);
END;
$$;
REVOKE ALL ON FUNCTION public.run_swuforce_retention() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.run_swuforce_retention() TO service_role;
