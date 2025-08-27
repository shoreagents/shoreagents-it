-- Create member/company change notifications for real-time updates
-- This script adds triggers to the members, agents, and clients tables to send notifications
-- when records are inserted, updated, or deleted

-- First, ensure the notification functions exist
CREATE OR REPLACE FUNCTION notify_member_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Send notification for member/company changes
  PERFORM pg_notify(
    'member_detail_changes',
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
$$ LANGUAGE plpgsql;

-- Function for agent member changes
CREATE OR REPLACE FUNCTION notify_agent_member_changes()
RETURNS TRIGGER AS $$
DECLARE
  old_company_id INTEGER;
  new_company_id INTEGER;
  old_employee_count INTEGER;
  new_employee_count INTEGER;
  agent_data JSON;
BEGIN
  -- Only send notification if member_id changed (assignment change)
  IF TG_OP = 'UPDATE' AND (OLD.member_id IS DISTINCT FROM NEW.member_id) THEN
    -- Get old and new company IDs
    old_company_id := OLD.member_id;
    new_company_id := NEW.member_id;
    
    -- Get full agent data by joining with users table
    SELECT json_build_object(
      'user_id', u.id,
      'first_name', u.first_name,
      'last_name', u.last_name,
      'profile_picture', u.profile_picture,
      'employee_id', a.employee_id,
      'job_title', a.job_title,
      'member_id', a.member_id
    ) INTO agent_data
    FROM public.agents a
    JOIN public.users u ON a.user_id = u.id
    WHERE a.user_id = NEW.user_id;
    
    -- Calculate employee counts for old and new companies
    IF old_company_id IS NOT NULL THEN
      SELECT COUNT(*) INTO old_employee_count 
      FROM public.agents 
      WHERE member_id = old_company_id;
    ELSE
      old_employee_count := NULL;
    END IF;
    
    IF new_company_id IS NOT NULL THEN
      SELECT COUNT(*) INTO new_employee_count 
      FROM public.agents 
      WHERE member_id = new_company_id;
    ELSE
      new_employee_count := NULL;
    END IF;
    
    PERFORM pg_notify(
      'agent_assignment_changes',
      json_build_object(
        'table', TG_TABLE_NAME,
        'action', TG_OP,
        'record', COALESCE(agent_data, row_to_json(NEW)),
        'old_record', row_to_json(OLD),
        'count_updates', json_build_object(
          'old_company_id', old_company_id,
          'old_employee_count', old_employee_count,
          'new_company_id', new_company_id,
          'new_employee_count', new_employee_count
        ),
        'timestamp', now()
      )::text
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function for client member changes
CREATE OR REPLACE FUNCTION notify_client_member_changes()
RETURNS TRIGGER AS $$
DECLARE
  old_company_id INTEGER;
  new_company_id INTEGER;
  old_client_count INTEGER;
  new_client_count INTEGER;
  client_data JSON;
BEGIN
  -- Only send notification if member_id changed (assignment change)
  IF TG_OP = 'UPDATE' AND (OLD.member_id IS DISTINCT FROM NEW.member_id) THEN
    -- Get old and new company IDs
    old_company_id := OLD.member_id;
    new_company_id := NEW.member_id;
    
    -- Get full client data by joining with users table
    SELECT json_build_object(
      'user_id', u.id,
      'first_name', u.first_name,
      'last_name', u.last_name,
      'profile_picture', u.profile_picture,
      'member_id', c.member_id
    ) INTO client_data
    FROM public.clients c
    JOIN public.users u ON c.user_id = u.id
    WHERE c.user_id = NEW.user_id;
    
    -- Calculate client counts for old and new companies
    IF old_company_id IS NOT NULL THEN
      SELECT COUNT(*) INTO old_client_count 
      FROM public.clients 
      WHERE member_id = old_company_id;
    ELSE
      old_client_count := NULL;
    END IF;
    
    IF new_company_id IS NOT NULL THEN
      SELECT COUNT(*) INTO new_client_count 
      FROM public.clients 
      WHERE member_id = new_company_id;
    ELSE
      new_client_count := NULL;
    END IF;
    
    PERFORM pg_notify(
      'client_assignment_changes',
      json_build_object(
        'table', TG_TABLE_NAME,
        'action', TG_OP,
        'record', COALESCE(client_data, row_to_json(NEW)),
        'old_record', row_to_json(OLD),
        'count_updates', json_build_object(
          'old_company_id', old_company_id,
          'old_client_count', old_client_count,
          'new_company_id', new_company_id,
          'new_client_count', new_client_count
        ),
        'timestamp', now()
      )::text
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_member_changes ON public.members;
DROP TRIGGER IF EXISTS trigger_agent_member_changes ON public.agents;
DROP TRIGGER IF EXISTS trigger_client_member_changes ON public.clients;

-- Create trigger for members table
CREATE TRIGGER trigger_member_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.members
    FOR EACH ROW EXECUTE FUNCTION notify_member_changes();

-- Create trigger for agents table (only on member_id changes)
CREATE TRIGGER trigger_agent_member_changes
    AFTER UPDATE ON public.agents
    FOR EACH ROW EXECUTE FUNCTION notify_agent_member_changes();

-- Create trigger for clients table (only on member_id changes)
CREATE TRIGGER trigger_client_member_changes
    AFTER UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION notify_client_member_changes();

-- Test the triggers (optional)
-- UPDATE public.agents SET member_id = 1 WHERE id = 1;
-- UPDATE public.clients SET member_id = 1 WHERE id = 1;
-- UPDATE public.members SET company = 'Test Company Updated' WHERE id = 1;

-- You should see notifications in your PostgreSQL logs
-- To monitor notifications: 
-- LISTEN member_detail_changes;
-- LISTEN agent_assignment_changes;
-- LISTEN client_assignment_changes;
