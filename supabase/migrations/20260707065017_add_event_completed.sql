DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'completed'
  ) THEN
    ALTER TABLE public.events ADD COLUMN completed BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;