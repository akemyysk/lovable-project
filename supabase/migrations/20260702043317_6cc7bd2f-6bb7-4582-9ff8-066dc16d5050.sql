
-- ============ GOALS ============
CREATE TABLE public.goals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  horizon text NOT NULL DEFAULT 'year',
  category text,
  color text NOT NULL DEFAULT '#2F5D8C',
  target_date date,
  progress smallint NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  sort_order integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals TO authenticated;
GRANT ALL ON public.goals TO service_role;

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own goals" ON public.goals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX goals_user_horizon_idx ON public.goals(user_id, horizon);

-- ============ GOAL MILESTONES ============
CREATE TABLE public.goal_milestones (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id uuid NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.goal_milestones TO authenticated;
GRANT ALL ON public.goal_milestones TO service_role;

ALTER TABLE public.goal_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own goal_milestones" ON public.goal_milestones
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER goal_milestones_updated_at
  BEFORE UPDATE ON public.goal_milestones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX goal_milestones_goal_idx ON public.goal_milestones(goal_id);

-- ============ LINK TASKS & HABITS TO GOALS ============
ALTER TABLE public.tasks
  ADD COLUMN goal_id uuid REFERENCES public.goals(id) ON DELETE SET NULL;

ALTER TABLE public.habits
  ADD COLUMN goal_id uuid REFERENCES public.goals(id) ON DELETE SET NULL;

CREATE INDEX tasks_goal_idx ON public.tasks(goal_id);
CREATE INDEX habits_goal_idx ON public.habits(goal_id);
