-- Test database connection and verify tables exist
-- Run this script in your Neon SQL editor to test the connection

-- Check if tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN '✅ Table exists'
        ELSE '❌ Table missing'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('emails', 'mailboxes');

-- Check table structure for emails table
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'emails'
ORDER BY ordinal_position;

-- Check table structure for mailboxes table
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'mailboxes'
ORDER BY ordinal_position;
