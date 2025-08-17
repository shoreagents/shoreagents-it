-- Create applicant change notifications for real-time updates
-- This script adds triggers to the bpoc_recruits table to send notifications
-- when records are inserted, updated, or deleted

-- First, ensure the notification function exists
CREATE OR REPLACE FUNCTION notify_applicant_changes()
RETURNS TRIGGER AS $$
DECLARE
    payload JSON;
BEGIN
    -- Create payload based on trigger operation
    CASE TG_OP
        WHEN 'INSERT' THEN
            payload = json_build_object(
                'table', TG_TABLE_NAME,
                'action', 'INSERT',
                'record', row_to_json(NEW),
                'timestamp', now()
            );
        WHEN 'UPDATE' THEN
            payload = json_build_object(
                'table', TG_TABLE_NAME,
                'action', 'UPDATE',
                'record', row_to_json(NEW),
                'old_record', row_to_json(OLD),
                'timestamp', now()
            );
        WHEN 'DELETE' THEN
            payload = json_build_object(
                'table', TG_TABLE_NAME,
                'action', 'DELETE',
                'record', row_to_json(OLD),
                'timestamp', now()
            );
    END CASE;
    
    -- Send notification
    PERFORM pg_notify('applicant_changes', payload::text);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_applicant_changes ON public.bpoc_recruits;

-- Create trigger for all operations (INSERT, UPDATE, DELETE)
CREATE TRIGGER trigger_applicant_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.bpoc_recruits
    FOR EACH ROW EXECUTE FUNCTION notify_applicant_changes();

-- Test the trigger (optional)
-- INSERT INTO public.bpoc_recruits (bpoc_application_id, applicant_id, job_id, resume_slug, status) 
-- VALUES ('test-uuid', 'test-user', 1, 'test-resume', 'submitted');

-- You should see a notification in your PostgreSQL logs
-- To monitor notifications: LISTEN applicant_changes;

COMMENT ON FUNCTION notify_applicant_changes() IS 'Sends real-time notifications when bpoc_recruits table changes';
COMMENT ON TRIGGER trigger_applicant_changes ON public.bpoc_recruits IS 'Triggers notifications for INSERT/UPDATE/DELETE operations';
