-- Migration: Leaderboard RPC Functions
-- Creates get_top_authors and get_top_readers for the homepage leaderboard

CREATE OR REPLACE FUNCTION public.get_top_authors(limit_count integer DEFAULT 5)
RETURNS TABLE (
  author_id bigint,
  pen_name varchar,
  username varchar,
  profile_image varchar,
  total_views bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    a.author_id,
    a.pen_name,
    a.username,
    a.profile_image,
    COALESCE(SUM(n.view_count), 0)::bigint AS total_views
  FROM public.author a
  LEFT JOIN public.novel n ON a.author_id = n.author_id AND n.status <> 'suspended'
  WHERE a.status = 'active'
  GROUP BY a.author_id, a.pen_name, a.username, a.profile_image
  ORDER BY total_views DESC, a.author_id ASC
  LIMIT limit_count;
$$;

CREATE OR REPLACE FUNCTION public.get_top_readers(limit_count integer DEFAULT 5)
RETURNS TABLE (
  user_id bigint,
  username varchar,
  full_name varchar,
  profile_image varchar,
  chapters_read bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    u.user_id,
    u.username,
    u.full_name,
    u.profile_image,
    COUNT(rh.history_id)::bigint AS chapters_read
  FROM public.users u
  INNER JOIN public.reading_history rh ON u.user_id = rh.user_id
  WHERE u.status = 'active'
  GROUP BY u.user_id, u.username, u.full_name, u.profile_image
  ORDER BY chapters_read DESC, u.user_id ASC
  LIMIT limit_count;
$$;

GRANT EXECUTE ON FUNCTION public.get_top_authors(integer) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_top_readers(integer) TO anon, authenticated, service_role;
