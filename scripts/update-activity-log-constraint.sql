-- Update members_activity_log table constraint to allow new action types
-- Run this script to update your existing database

-- First, drop the existing constraint if it exists
ALTER TABLE public.members_activity_log 
DROP CONSTRAINT IF EXISTS members_activity_log_action_check;

-- Add the new constraint with all allowed action types
ALTER TABLE public.members_activity_log 
ADD CONSTRAINT members_activity_log_action_check 
CHECK (action IN ('created', 'set', 'updated', 'removed', 'selected', 'deselected'));

-- Verify the constraint was added
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.members_activity_log'::regclass 
AND contype = 'c';

-- Show current table structure
\d public.members_activity_log
