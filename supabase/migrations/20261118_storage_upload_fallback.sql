-- ============================================================
-- STORAGE FALLBACK FOR RECEIPTS / DISPOSAL EVIDENCE
--
-- Files normally go to IPFS (Pinata). When Pinata is not configured or
-- fails, the app stores them in Supabase Storage instead so device
-- registration and disposal logging never fail because of an upload.
--
-- Each signed-in user may upload to, and read from, their own folder
-- ("<auth uid>/...") in the private `receipts` and `evidence` buckets.
-- Files are shared via signed URLs saved on the record.
-- ============================================================

DROP POLICY IF EXISTS "uploads: own folder insert" ON storage.objects;
CREATE POLICY "uploads: own folder insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('receipts', 'evidence')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "uploads: own folder read" ON storage.objects;
CREATE POLICY "uploads: own folder read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id IN ('receipts', 'evidence')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

UPDATE storage.buckets SET file_size_limit = 10485760  -- 10 MB
 WHERE id IN ('receipts', 'evidence');
