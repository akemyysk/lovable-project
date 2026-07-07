/*
# Remove auth requirement — make all tables anon-accessible

This app no longer requires authentication. All RLS policies are updated
to allow the anon role (used by the client-side Supabase client with the
publishable key) to perform full CRUD on every table.

## Changes
- Drop all existing `auth.uid() = user_id` policies on every table.
- Create 4 policies per table (SELECT, INSERT, UPDATE, DELETE) with
  `TO anon, authenticated` and `USING (true)` / `WITH CHECK (true)`,
  since the data is intentionally shared in this single-tenant app.
- Tables affected: tasks, habits, habit_logs, events, goals,
  goal_milestones, period_goals, day_offs, month_summaries,
  year_summaries, profiles.
*/

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'tasks','habits','habit_logs','events','goals','goal_milestones',
    'period_goals','day_offs','month_summaries','year_summaries','profiles'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', 'anon_select_' || t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', 'anon_insert_' || t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', 'anon_update_' || t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', 'anon_delete_' || t, t);
  END LOOP;
END $$;

-- Drop old auth-based policies
DROP POLICY IF EXISTS "own tasks" ON public.tasks;
DROP POLICY IF EXISTS "own habits" ON public.habits;
DROP POLICY IF EXISTS "own habit_logs" ON public.habit_logs;
DROP POLICY IF EXISTS "own events" ON public.events;
DROP POLICY IF EXISTS "own goals" ON public.goals;
DROP POLICY IF EXISTS "own goal_milestones" ON public.goal_milestones;
DROP POLICY IF EXISTS "own goals" ON public.period_goals;
DROP POLICY IF EXISTS "own day_offs" ON public.day_offs;
DROP POLICY IF EXISTS "own month_summaries" ON public.month_summaries;
DROP POLICY IF EXISTS "own year_summaries" ON public.year_summaries;
DROP POLICY IF EXISTS "own profile insert" ON public.profiles;
DROP POLICY IF EXISTS "own profile select" ON public.profiles;
DROP POLICY IF EXISTS "own profile update" ON public.profiles;

-- Create anon-accessible policies for all tables
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'tasks','habits','habit_logs','events','goals','goal_milestones',
    'period_goals','day_offs','month_summaries','year_summaries','profiles'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO anon, authenticated USING (true);', 'anon_select_' || t, t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO anon, authenticated WITH CHECK (true);', 'anon_insert_' || t, t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);', 'anon_update_' || t, t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO anon, authenticated USING (true);', 'anon_delete_' || t, t);
  END LOOP;
END $$;