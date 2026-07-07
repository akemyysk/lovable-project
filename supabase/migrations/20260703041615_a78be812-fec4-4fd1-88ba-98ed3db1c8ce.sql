
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS reminder_time time;

CREATE TABLE IF NOT EXISTS public.day_offs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  day_date date NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, day_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.day_offs TO authenticated;
GRANT ALL ON public.day_offs TO service_role;
ALTER TABLE public.day_offs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own day_offs" ON public.day_offs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.month_summaries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  month_key text NOT NULL,
  habits_done integer NOT NULL DEFAULT 0,
  habits_total integer NOT NULL DEFAULT 0,
  completion_pct smallint NOT NULL DEFAULT 0,
  moments_count integer NOT NULL DEFAULT 0,
  goals_done integer NOT NULL DEFAULT 0,
  reflection text,
  photos jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, month_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.month_summaries TO authenticated;
GRANT ALL ON public.month_summaries TO service_role;
ALTER TABLE public.month_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own month_summaries" ON public.month_summaries
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER month_summaries_updated_at
  BEFORE UPDATE ON public.month_summaries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.year_summaries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  year_key text NOT NULL,
  habits_done integer NOT NULL DEFAULT 0,
  habits_total integer NOT NULL DEFAULT 0,
  avg_pct smallint NOT NULL DEFAULT 0,
  moments_count integer NOT NULL DEFAULT 0,
  goals_done integer NOT NULL DEFAULT 0,
  retrospective text,
  photos jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, year_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.year_summaries TO authenticated;
GRANT ALL ON public.year_summaries TO service_role;
ALTER TABLE public.year_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own year_summaries" ON public.year_summaries
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER year_summaries_updated_at
  BEFORE UPDATE ON public.year_summaries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
