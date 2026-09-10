-- Migration to fetch novels completely read by a user
CREATE OR REPLACE FUNCTION public.get_user_completed_novels(p_user_id bigint)
RETURNS TABLE (novel_id bigint)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT c.novel_id
  FROM public.chapter c
  JOIN public.reading_history rh ON c.chapter_id = rh.chapter_id
  WHERE rh.user_id = p_user_id
    AND c.status = 'published'
  GROUP BY c.novel_id
  HAVING COUNT(DISTINCT c.chapter_id) >= (
    SELECT COUNT(*) 
    FROM public.chapter tc 
    WHERE tc.novel_id = c.novel_id 
      AND tc.status = 'published'
  ) AND (
    SELECT COUNT(*) 
    FROM public.chapter tc 
    WHERE tc.novel_id = c.novel_id 
      AND tc.status = 'published'
  ) > 0;
$$;

CREATE OR REPLACE FUNCTION public.get_my_completed_novels()
RETURNS TABLE (novel_id bigint)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT c.novel_id
  FROM public.chapter c
  JOIN public.reading_history rh ON c.chapter_id = rh.chapter_id
  JOIN public.users u ON rh.user_id = u.user_id
  WHERE u.auth_user_id = auth.uid()
    AND c.status = 'published'
  GROUP BY c.novel_id
  HAVING COUNT(DISTINCT c.chapter_id) >= (
    SELECT COUNT(*) 
    FROM public.chapter tc 
    WHERE tc.novel_id = c.novel_id 
      AND tc.status = 'published'
  ) AND (
    SELECT COUNT(*) 
    FROM public.chapter tc 
    WHERE tc.novel_id = c.novel_id 
      AND tc.status = 'published'
  ) > 0;
$$;
