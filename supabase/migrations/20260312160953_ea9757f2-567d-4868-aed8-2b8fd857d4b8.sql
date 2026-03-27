-- Create display_items table
CREATE TABLE public.display_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL CHECK (type IN ('media', 'promo')),
  media_url text,
  overlay_text text,
  preco_de numeric,
  preco_por numeric,
  duracao_segundos int DEFAULT 10,
  ativo boolean DEFAULT true,
  ordem int DEFAULT 0,
  criado_em timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.display_items ENABLE ROW LEVEL SECURITY;

-- Public read access (TV display needs to read without auth)
CREATE POLICY "Anyone can read display items"
  ON public.display_items FOR SELECT
  USING (true);

-- Only authenticated users can manage
CREATE POLICY "Authenticated users can insert"
  ON public.display_items FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update"
  ON public.display_items FOR UPDATE
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete"
  ON public.display_items FOR DELETE
  TO authenticated USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.display_items;

-- Create public storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('display-media', 'display-media', true);

-- Storage policies
CREATE POLICY "Public read display media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'display-media');

CREATE POLICY "Authenticated upload display media"
  ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'display-media');

CREATE POLICY "Authenticated update display media"
  ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'display-media');

CREATE POLICY "Authenticated delete display media"
  ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'display-media');