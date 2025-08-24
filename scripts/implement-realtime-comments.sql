-- Implement Real-time Comments using PostgreSQL NOTIFY/LISTEN
-- This script adds real-time functionality to member comments

-- 1. Create notification function for member comments
CREATE OR REPLACE FUNCTION public.notify_member_comment_changes()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Send notification for member comment changes
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

-- 3. Add updated_at trigger to member_comments table
CREATE TRIGGER update_member_comments_updated_at
  BEFORE UPDATE ON public.member_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. Create a view for easier comment retrieval with user information
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

-- 5. Grant necessary permissions
GRANT SELECT ON public.member_comments_with_users TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 6. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_member_comments_member_id_created_at 
ON public.member_comments(member_id, created_at DESC);

-- 7. Create a function to get comments with real-time capability
CREATE OR REPLACE FUNCTION public.get_member_comments(p_member_id integer)
 RETURNS TABLE(
   id integer,
   member_id integer,
   user_id integer,
   comment text,
   created_at timestamptz,
   updated_at timestamptz,
   first_name text,
   last_name text,
   profile_picture text,
   user_name text
 )
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
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
  WHERE mc.member_id = p_member_id
  ORDER BY mc.created_at DESC;
END;
$function$;

-- 8. Add comment count function
CREATE OR REPLACE FUNCTION public.get_member_comment_count(p_member_id integer)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
  comment_count integer;
BEGIN
  SELECT COUNT(*) INTO comment_count
  FROM public.member_comments
  WHERE member_id = p_member_id;
  
  RETURN comment_count;
END;
$function$;

-- 9. Create a function to add comment with validation
CREATE OR REPLACE FUNCTION public.add_member_comment(
  p_member_id integer,
  p_user_id integer,
  p_comment text
)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
  new_comment_id integer;
BEGIN
  -- Validate input
  IF p_comment IS NULL OR trim(p_comment) = '' THEN
    RAISE EXCEPTION 'Comment cannot be empty';
  END IF;
  
  IF p_member_id IS NULL OR p_user_id IS NULL THEN
    RAISE EXCEPTION 'Member ID and User ID are required';
  END IF;
  
  -- Check if member exists
  IF NOT EXISTS (SELECT 1 FROM public.members WHERE id = p_member_id) THEN
    RAISE EXCEPTION 'Member does not exist';
  END IF;
  
  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User does not exist';
  END IF;
  
  -- Insert comment
  INSERT INTO public.member_comments (member_id, user_id, comment)
  VALUES (p_member_id, p_user_id, trim(p_comment))
  RETURNING id INTO new_comment_id;
  
  RETURN new_comment_id;
END;
$function$;

-- 10. Create a function to delete comment with permission check
CREATE OR REPLACE FUNCTION public.delete_member_comment(
  p_comment_id integer,
  p_user_id integer
)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
DECLARE
  comment_owner_id integer;
BEGIN
  -- Get the comment owner
  SELECT user_id INTO comment_owner_id
  FROM public.member_comments
  WHERE id = p_comment_id;
  
  -- Check if comment exists
  IF comment_owner_id IS NULL THEN
    RAISE EXCEPTION 'Comment not found';
  END IF;
  
  -- Check if user owns the comment or is admin (you can modify this logic)
  IF comment_owner_id != p_user_id THEN
    RAISE EXCEPTION 'You can only delete your own comments';
  END IF;
  
  -- Delete the comment
  DELETE FROM public.member_comments WHERE id = p_comment_id;
  
  RETURN true;
END;
$function$;

-- 11. Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.get_member_comments(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_member_comment_count(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_member_comment(integer, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_member_comment(integer, integer) TO authenticated;

-- 12. Create a notification channel for real-time updates
-- This will be used by the application to listen for changes
-- Channel name: 'member_comment_changes'
-- Payload format: JSON with table, action, record, old_record, and timestamp

COMMENT ON FUNCTION public.notify_member_comment_changes() IS 'Sends real-time notifications when member comments change';
COMMENT ON FUNCTION public.get_member_comments(integer) IS 'Retrieves comments for a specific member with user information';
COMMENT ON FUNCTION public.add_member_comment(integer, integer, text) IS 'Adds a new comment with validation';
COMMENT ON FUNCTION public.delete_member_comment(integer, integer) IS 'Deletes a comment with permission check';
