-- Simple Real-time Comments Setup
-- This script adds real-time functionality to member comments

-- 1. Create notification function for member comments
CREATE OR REPLACE FUNCTION public.notify_member_comment_changes()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Send notification when comments change
  PERFORM pg_notify(
    'member_comment_changes',
    json_build_object(
      'table', TG_TABLE_NAME,
      'action', TG_OP,
      'record', CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE row_to_json(NEW) END,
      'old_record', CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) ELSE NULL END,
      'timestamp', now()
    )::text
  );
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- 2. Add triggers to member_comments table
CREATE TRIGGER notify_member_comment_insert
  AFTER INSERT ON public.member_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_member_comment_changes();

CREATE TRIGGER notify_member_comment_update
  AFTER UPDATE ON public.member_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_member_comment_changes();

CREATE TRIGGER notify_member_comment_delete
  AFTER DELETE ON public.member_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_member_comment_changes();

-- 3. Add updated_at trigger
CREATE TRIGGER update_member_comments_updated_at
  BEFORE UPDATE ON public.member_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. Create view for comments with user info
CREATE OR REPLACE VIEW public.member_comments_with_users AS
SELECT 
  mc.id,
  mc.member_id,
  mc.user_id,
  mc.comment,
  mc.created_at,
  mc.updated_at,
  u.first_name,
  u.last_name,
  u.profile_picture,
  CONCAT(u.first_name, ' ', u.last_name) as user_name
FROM public.member_comments mc
JOIN public.users u ON mc.user_id = u.id
ORDER BY mc.created_at DESC;

-- 5. Grant permissions
GRANT SELECT ON public.member_comments_with_users TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 6. Add performance index
CREATE INDEX IF NOT EXISTS idx_member_comments_member_id_created_at 
ON public.member_comments(member_id, created_at DESC);

-- Done! Now comments will send real-time notifications
