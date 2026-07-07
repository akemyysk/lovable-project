
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS vision_images text[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS completion_photo text;
