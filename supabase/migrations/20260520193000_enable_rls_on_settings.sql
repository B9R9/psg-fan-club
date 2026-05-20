-- Fix Supabase advisor warning:
-- settings table has RLS policies but RLS was not enabled.
alter table if exists public.settings
enable row level security;
