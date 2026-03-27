
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can insert" ON public.display_items;
DROP POLICY IF EXISTS "Authenticated users can update" ON public.display_items;
DROP POLICY IF EXISTS "Authenticated users can delete" ON public.display_items;

-- Create open policies for the store admin panel
CREATE POLICY "Anyone can insert display items" ON public.display_items FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update display items" ON public.display_items FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can delete display items" ON public.display_items FOR DELETE TO public USING (true);
