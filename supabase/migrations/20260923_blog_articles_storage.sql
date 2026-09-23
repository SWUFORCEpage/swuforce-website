-- SWUFORCE v2.8: Run AFTER existing page_entries migration; safe for existing entries.
ALTER TABLE public.page_entries DROP CONSTRAINT IF EXISTS page_entries_page_check;
ALTER TABLE public.page_entries ADD CONSTRAINT page_entries_page_check
  CHECK (page IN ('home','about','study','news','community','members','recruit','me','mentoring'));
ALTER TABLE public.page_entries
  ADD COLUMN IF NOT EXISTS article_body text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS published_on date;
ALTER TABLE public.page_entries
  DROP CONSTRAINT IF EXISTS page_entries_article_body_length;
ALTER TABLE public.page_entries
  ADD CONSTRAINT page_entries_article_body_length CHECK (char_length(article_body) <= 100000);

-- Only non-sensitive images intended for public display belong in this bucket.
-- Public URLs can be opened before an article is published; review EXIF and subjects first.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('swuforce-article-images', 'swuforce-article-images', true, 6291456,
        ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
-- Intentionally no INSERT/UPDATE/DELETE policies for anon/authenticated.
-- Only the server service_role performs writes after validating site_admin.
