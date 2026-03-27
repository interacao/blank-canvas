
DROP POLICY IF EXISTS "Authenticated upload display media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update display media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete display media" ON storage.objects;

CREATE POLICY "Anyone can upload display media" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'display-media');
CREATE POLICY "Anyone can update display media" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'display-media');
CREATE POLICY "Anyone can delete display media" ON storage.objects FOR DELETE TO public USING (bucket_id = 'display-media');
