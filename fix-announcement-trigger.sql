-- Fix the notify_announcement_change function to include expires_at in INSERT notifications
CREATE OR REPLACE FUNCTION public.notify_announcement_change()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    notification_payload jsonb;
BEGIN
    -- Build notification payload
    notification_payload := jsonb_build_object(
        'type', 'announcement_change',
        'announcement_id', COALESCE(NEW.id, OLD.id),
        'action', TG_OP,
        'title', COALESCE(NEW.title, OLD.title),
        'status', COALESCE(NEW.status, OLD.status),
        'created_by', COALESCE(NEW.created_by, OLD.created_by),
        'updated_at', now()
    );
    
    -- Add additional fields for different operations
    IF TG_OP = 'INSERT' THEN
        notification_payload := notification_payload || jsonb_build_object(
            'message', NEW.message,
            'priority', NEW.priority,
            'scheduled_at', NEW.scheduled_at,
            'expires_at', NEW.expires_at,
            'assigned_user_ids', NEW.assigned_user_ids
        );
    ELSIF TG_OP = 'UPDATE' THEN
        notification_payload := notification_payload || jsonb_build_object(
            'old_status', OLD.status,
            'new_status', NEW.status,
            'status_changed', OLD.status != NEW.status,
            'assigned_user_ids', NEW.assigned_user_ids
        );
    ELSIF TG_OP = 'DELETE' THEN
        notification_payload := notification_payload || jsonb_build_object(
            
        );
    END IF;
    
    -- Send notification
    PERFORM pg_notify('announcements', notification_payload::text);
    
    RETURN COALESCE(NEW, OLD);
END;
$function$
;
