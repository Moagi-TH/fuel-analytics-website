-- Clean up old test/visual aid reports from the database
-- This will remove the sample reports that were used for testing

-- First, let's see what reports exist
SELECT id, filename, month, year, created_at, company_id 
FROM monthly_reports 
ORDER BY created_at DESC;

-- Remove reports with test/visual aid filenames
DELETE FROM monthly_reports 
WHERE filename LIKE '%Period Report%' 
   OR filename LIKE '%test%' 
   OR filename LIKE '%visual%' 
   OR filename LIKE '%sample%'
   OR filename LIKE '%4shbx%'
   OR filename LIKE '%96mzry%';

-- Also clean up any orphaned fuel_data and shop_data
DELETE FROM fuel_data 
WHERE report_id NOT IN (SELECT id FROM monthly_reports);

DELETE FROM shop_data 
WHERE report_id NOT IN (SELECT id FROM monthly_reports);

-- Verify cleanup
SELECT COUNT(*) as remaining_reports FROM monthly_reports;
SELECT COUNT(*) as remaining_fuel_data FROM fuel_data;
SELECT COUNT(*) as remaining_shop_data FROM shop_data;

-- Show remaining reports (if any)
SELECT id, filename, month, year, created_at 
FROM monthly_reports 
ORDER BY created_at DESC;
