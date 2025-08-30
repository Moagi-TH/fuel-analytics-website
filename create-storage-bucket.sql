-- Create new storage bucket for PDF uploads
-- Run this in your Supabase SQL Editor

-- Create a new storage bucket for PDF reports
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'fuel-reports',
    'fuel-reports',
    false,
    52428800, -- 50MB limit
    ARRAY['application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the storage bucket
CREATE POLICY "Users can upload reports to their company bucket" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'fuel-reports' AND
        auth.uid() IN (
            SELECT p.id FROM profiles p
            WHERE p.company_id IS NOT NULL
        )
    );

CREATE POLICY "Users can view reports from their company" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'fuel-reports' AND
        auth.uid() IN (
            SELECT p.id FROM profiles p
            WHERE p.company_id IS NOT NULL
        )
    );

CREATE POLICY "Users can update their own reports" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'fuel-reports' AND
        auth.uid() IN (
            SELECT p.id FROM profiles p
            WHERE p.company_id IS NOT NULL
        )
    );

CREATE POLICY "Users can delete their own reports" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'fuel-reports' AND
        auth.uid() IN (
            SELECT p.id FROM profiles p
            WHERE p.company_id IS NOT NULL
        )
    );

-- Verify bucket creation
SELECT 'Storage bucket created successfully' as status;
SELECT * FROM storage.buckets WHERE id = 'fuel-reports';
