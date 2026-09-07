-- Migration: Auto Publish Scheduled Chapters
-- Creates the public.publish_scheduled_chapters() function and schedules it with pg_cron

CREATE OR REPLACE FUNCTION public.publish_scheduled_chapters()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count integer;
BEGIN
  -- 1. Flip chapters whose scheduled time has passed (UTC) to published
  WITH updated AS (
    UPDATE public.chapter
    SET 
      status = 'published',
      published_at = COALESCE(scheduled_at, NOW() AT TIME ZONE 'utc')
    WHERE 
      status = 'scheduled'
      AND scheduled_at IS NOT NULL
      AND scheduled_at <= (NOW() AT TIME ZONE 'utc')
    RETURNING novel_id
  )
  SELECT count(*) INTO updated_count FROM updated;

  -- 2. Bump novel updated_at so listings reflect newly published chapters
  IF updated_count > 0 THEN
    UPDATE public.novel n
    SET updated_at = (NOW() AT TIME ZONE 'utc')
    WHERE n.novel_id IN (
      SELECT c.novel_id 
      FROM public.chapter c
      WHERE c.status = 'published'
        AND c.scheduled_at IS NOT NULL
        AND c.scheduled_at <= (NOW() AT TIME ZONE 'utc')
        AND c.published_at >= (NOW() AT TIME ZONE 'utc') - INTERVAL '5 minutes'
    );
  END IF;

  RETURN updated_count;
END;
$$;

-- Grant execution permission
GRANT EXECUTE ON FUNCTION public.publish_scheduled_chapters() TO anon, authenticated, service_role;

-- Schedule to run every 1 minute via pg_cron
SELECT cron.schedule(
  'publish-scheduled-chapters-every-minute',
  '* * * * *',
  'SELECT public.publish_scheduled_chapters()'
);
