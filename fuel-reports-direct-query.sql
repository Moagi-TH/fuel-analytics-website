-- Direct Query for fuel-reports bucket
-- This will show us exactly what files are in the fuel-reports bucket

-- Query 1: List all files in fuel-reports bucket
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

-- Query 2: Count files in fuel-reports bucket
SELECT 
    COUNT(*) as total_files,
    'fuel-reports' as bucket_name
FROM storage.objects 
WHERE bucket_id = 'fuel-reports';

-- Query 3: Get file details with better formatting
SELECT 
    name as file_name,
    TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_date,
    TO_CHAR(updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated_date,
    (metadata->>'size')::BIGINT as file_size_bytes,
    ROUND((metadata->>'size')::BIGINT / 1024.0, 2) as file_size_kb
FROM storage.objects 
WHERE bucket_id = 'fuel-reports'
ORDER BY created_at DESC;
