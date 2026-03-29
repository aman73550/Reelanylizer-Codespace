
-- Create storage bucket for creator profile images
INSERT INTO storage.buckets (id, name, public) VALUES ('creator-profiles', 'creator-profiles', true);

-- Allow anyone to view creator profile images (public bucket)
CREATE POLICY "Public read access for creator profiles"
ON storage.objects FOR SELECT
USING (bucket_id = 'creator-profiles');

-- Allow authenticated users (admins) to upload/update/delete creator profile images
CREATE POLICY "Admin upload creator profiles"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'creator-profiles');

CREATE POLICY "Admin update creator profiles"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'creator-profiles');

CREATE POLICY "Admin delete creator profiles"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'creator-profiles');
