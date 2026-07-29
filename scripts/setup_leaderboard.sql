-- Leaderboard Setup Script (Secure Version)
-- Run this in the Supabase SQL Editor
--
-- Instead of opening up profiles/daily_activity tables to all users,
-- we create a secure RPC function that returns ONLY leaderboard-safe fields.
-- No emails, no personal settings, no sensitive data is ever exposed.

-- Create the leaderboard function
CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    current_streak INT,
    total_ayahs_read INT,
    active_days BIGINT
)
LANGUAGE sql
SECURITY DEFINER  -- Runs with the function owner's privileges, bypasses RLS safely
STABLE
AS $$
    SELECT 
        p.id,
        COALESCE(p.full_name, 'Anonymous Reader') as full_name,
        COALESCE(p.current_streak, 0) as current_streak,
        COALESCE(p.total_ayahs_read, 0) as total_ayahs_read,
        COALESCE(da.active_days, 0) as active_days
    FROM public.profiles p
    LEFT JOIN (
        SELECT user_id, COUNT(*) as active_days
        FROM public.daily_activity
        GROUP BY user_id
    ) da ON da.user_id = p.id
    WHERE p.full_name IS NOT NULL
    ORDER BY active_days DESC, total_ayahs_read DESC
    LIMIT 100;
$$;

-- Grant execute permission to authenticated users only
GRANT EXECUTE ON FUNCTION public.get_leaderboard() TO authenticated;

-- Revoke from anonymous/public so unauthenticated users can't call it
REVOKE EXECUTE ON FUNCTION public.get_leaderboard() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_leaderboard() FROM public;
