-- Test Supabase Storage Bucket Connection
-- This SQL function will help us verify what files are actually in the storage buckets

-- Function to list all files in storage buckets
CREATE OR REPLACE FUNCTION list_storage_files()
RETURNS TABLE (
    bucket_name TEXT,
    file_name TEXT,
    file_size BIGINT,
    file_created_at TIMESTAMPTZ,
    file_updated_at TIMESTAMPTZ,
    metadata_json JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- List files from fuel-reports bucket
    RETURN QUERY
    SELECT 
        'fuel-reports'::TEXT as bucket_name,
        name::TEXT as file_name,
        (metadata->>'size')::BIGINT as file_size,
        created_at as file_created_at,
        updated_at as file_updated_at,
        metadata as metadata_json
    FROM storage.objects 
    WHERE bucket_id = 'fuel-reports'
    ORDER BY created_at DESC;
    
    -- List files from reports bucket
    RETURN QUERY
    SELECT 
        'reports'::TEXT as bucket_name,
        name::TEXT as file_name,
        (metadata->>'size')::BIGINT as file_size,
        created_at as file_created_at,
        updated_at as file_updated_at,
        metadata as metadata_json
    FROM storage.objects 
    WHERE bucket_id = 'reports'
    ORDER BY created_at DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION list_storage_files() TO authenticated;
GRANT EXECUTE ON FUNCTION list_storage_files() TO anon;

-- Simple direct queries to test storage bucket access (no function needed)
-- Test fuel-reports bucket directly
SELECT 
    'fuel-reports' as bucket_name,
    name as file_name,
    (metadata->>'size')::BIGINT as file_size,
    created_at,
    updated_at,
    metadata
FROM storage.objects 
WHERE bucket_id = 'fuel-reports'
ORDER BY created_at DESC;

-- Test reports bucket directly
SELECT 
    'reports' as bucket_name,
    name as file_name,
    (metadata->>'size')::BIGINT as file_size,
    created_at,
    updated_at,
    metadata
FROM storage.objects 
WHERE bucket_id = 'reports'
ORDER BY created_at DESC;

-- Test the function (optional)
SELECT * FROM list_storage_files();

-- Also check the monthly_reports table to see what's stored there
SELECT 
    id,
    file_name,
    storage_path,
    report_month,
    report_year,
    created_at,
    updated_at
FROM monthly_reports 
ORDER BY created_at DESC;

-- Check if there are any storage policies that might be blocking access
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename LIKE '%storage%' OR tablename LIKE '%objects%';
