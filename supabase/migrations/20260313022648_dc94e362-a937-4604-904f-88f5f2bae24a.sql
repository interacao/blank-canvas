
CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read settings" ON public.app_settings FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert settings" ON public.app_settings FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update settings" ON public.app_settings FOR UPDATE TO public USING (true);
