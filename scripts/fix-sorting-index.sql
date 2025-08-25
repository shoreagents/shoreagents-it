-- SOLUTION: Drop the problematic composite index
-- The index idx_personal_info_user_names ON (user_id, first_name, last_name) 
-- is causing PostgreSQL to ignore our ORDER BY clause for first_name sorting

-- This index is interfering with sorting because PostgreSQL is using the index order
-- instead of our ORDER BY clause. We need to drop it to fix the sorting.

-- Drop the problematic index
DROP INDEX IF EXISTS idx_personal_info_user_names;

-- Verify the index is dropped
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE tablename = 'personal_info' AND indexname = 'idx_personal_info_user_names';

-- After dropping this index:
-- 1. ✅ Sorting will work correctly (ASC/DESC will be respected)
-- 2. ⚠️ JOIN performance might be slightly slower
-- 3. ✅ WHERE clause performance will still be good due to other indexes

-- Alternative: If you want to keep some performance benefits, you can create a simpler index:
-- CREATE INDEX idx_personal_info_user_id ON public.personal_info USING btree (user_id);

-- Test the sorting after dropping the index - it should now work correctly!
