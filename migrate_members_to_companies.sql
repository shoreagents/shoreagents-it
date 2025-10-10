-- Migration script to rename "members" to "companies"
-- This script contains only the necessary changes to rename the members schema to companies

-- ==============================================
-- 1. RENAME ENUM TYPES
-- ==============================================

-- Rename member_service_enum to company_service_enum
ALTER TYPE public."member_service_enum" RENAME TO "company_service_enum";

-- Rename member_status_enum to company_status_enum  
ALTER TYPE public."member_status_enum" RENAME TO "company_status_enum";

-- ==============================================
-- 2. RENAME TABLES
-- ==============================================

-- Rename members table to companies
ALTER TABLE public.members RENAME TO companies;

-- Rename members_activity_log table to companies_activity_log
ALTER TABLE public.members_activity_log RENAME TO companies_activity_log;

-- Rename floor_plan_members table to floor_plan_companies
ALTER TABLE public.floor_plan_members RENAME TO floor_plan_companies;

-- Rename member_comments table to company_comments
ALTER TABLE public.member_comments RENAME TO company_comments;

-- ==============================================
-- 3. UPDATE FOREIGN KEY COLUMNS
-- ==============================================

-- Update agents table: rename member_id to company_id
ALTER TABLE public.agents RENAME COLUMN member_id TO company_id;

-- Update clients table: rename member_id to company_id
ALTER TABLE public.clients RENAME COLUMN member_id TO company_id;

-- Update departments table: rename member_id to company_id
ALTER TABLE public.departments RENAME COLUMN member_id TO company_id;

-- Update companies_activity_log table: rename member_id to company_id
ALTER TABLE public.companies_activity_log RENAME COLUMN member_id TO company_id;

-- Update floor_plan_companies table: rename member_id to company_id
ALTER TABLE public.floor_plan_companies RENAME COLUMN member_id TO company_id;

-- Update company_comments table: rename member_id to company_id
ALTER TABLE public.company_comments RENAME COLUMN member_id TO company_id;

-- ==============================================
-- 4. UPDATE FOREIGN KEY CONSTRAINTS
-- ==============================================

-- Drop old foreign key constraints
ALTER TABLE public.agents DROP CONSTRAINT agents_member_id_fkey;
ALTER TABLE public.clients DROP CONSTRAINT clients_member_id_fkey;
ALTER TABLE public.departments DROP CONSTRAINT departments_member_id_fkey;
ALTER TABLE public.companies_activity_log DROP CONSTRAINT fk_members_activity_log_member;
ALTER TABLE public.floor_plan_companies DROP CONSTRAINT floor_plan_members_member_id_fkey;
ALTER TABLE public.company_comments DROP CONSTRAINT member_comments_member_id_fkey;

-- Add new foreign key constraints
ALTER TABLE public.agents ADD CONSTRAINT agents_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.clients ADD CONSTRAINT clients_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.departments ADD CONSTRAINT departments_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.companies_activity_log ADD CONSTRAINT fk_companies_activity_log_company FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.floor_plan_companies ADD CONSTRAINT floor_plan_companies_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.company_comments ADD CONSTRAINT company_comments_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- ==============================================
-- 5. UPDATE UNIQUE CONSTRAINTS
-- ==============================================

-- Update departments unique constraints
ALTER TABLE public.departments DROP CONSTRAINT unique_department_id_member;
ALTER TABLE public.departments DROP CONSTRAINT unique_department_per_member;
ALTER TABLE public.departments ADD CONSTRAINT unique_department_id_company UNIQUE (id, company_id);
ALTER TABLE public.departments ADD CONSTRAINT unique_department_per_company UNIQUE (name, company_id);

-- Update floor_plan_companies unique constraint
ALTER TABLE public.floor_plan_companies DROP CONSTRAINT floor_plan_members_floor_plan_id_member_id_key;
ALTER TABLE public.floor_plan_companies ADD CONSTRAINT floor_plan_companies_floor_plan_id_company_id_key UNIQUE (floor_plan_id, company_id);

-- ==============================================
-- 6. UPDATE INDEXES
-- ==============================================

-- Drop old indexes
DROP INDEX IF EXISTS public.idx_members_company;
DROP INDEX IF EXISTS public.idx_members_country;
DROP INDEX IF EXISTS public.idx_members_listing;
DROP INDEX IF EXISTS public.idx_members_status;
DROP INDEX IF EXISTS public.idx_members_activity_log_member_id;

-- Create new indexes
CREATE INDEX idx_companies_company ON public.companies USING btree (company);
CREATE INDEX idx_companies_country ON public.companies USING btree (country);
CREATE INDEX idx_companies_listing ON public.companies USING btree (status, country) INCLUDE (id, company, service, badge_color);
CREATE INDEX idx_companies_status ON public.companies USING btree (status);
CREATE INDEX idx_companies_activity_log_company_id ON public.companies_activity_log USING btree (company_id);

-- ==============================================
-- 7. UPDATE SEQUENCES
-- ==============================================

-- Rename sequences
ALTER SEQUENCE public.members_id_seq RENAME TO companies_id_seq;
ALTER SEQUENCE public.members_activity_log_id_seq RENAME TO companies_activity_log_id_seq;
ALTER SEQUENCE public.floor_plan_members_id_seq RENAME TO floor_plan_companies_id_seq;

-- ==============================================
-- 8. UPDATE FUNCTIONS
-- ==============================================

-- Drop old functions
DROP FUNCTION IF EXISTS public.notify_member_changes();
DROP FUNCTION IF EXISTS public.notify_member_activity_changes();
DROP FUNCTION IF EXISTS public.notify_member_comment_changes();
DROP FUNCTION IF EXISTS public.notify_agent_member_changes();
DROP FUNCTION IF EXISTS public.notify_client_member_changes();

-- Create new functions
CREATE OR REPLACE FUNCTION public.notify_company_changes()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM pg_notify('company_changes', json_build_object(
            'operation', 'insert',
            'id', NEW.id,
            'company', NEW.company,
            'company_id', NEW.company_id
        )::text);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM pg_notify('company_changes', json_build_object(
            'operation', 'update',
            'id', NEW.id,
            'company', NEW.company,
            'company_id', NEW.company_id
        )::text);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM pg_notify('company_changes', json_build_object(
            'operation', 'delete',
            'id', OLD.id,
            'company', OLD.company,
            'company_id', OLD.company_id
        )::text);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_company_activity_changes()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM pg_notify('company_activity_changes', json_build_object(
            'operation', 'insert',
            'id', NEW.id,
            'company_id', NEW.company_id,
            'action', NEW.action,
            'field_name', NEW.field_name
        )::text);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM pg_notify('company_activity_changes', json_build_object(
            'operation', 'update',
            'id', NEW.id,
            'company_id', NEW.company_id,
            'action', NEW.action,
            'field_name', NEW.field_name
        )::text);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM pg_notify('company_activity_changes', json_build_object(
            'operation', 'delete',
            'id', OLD.id,
            'company_id', OLD.company_id,
            'action', OLD.action,
            'field_name', OLD.field_name
        )::text);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_company_comment_changes()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM pg_notify('company_comment_changes', json_build_object(
            'operation', 'insert',
            'id', NEW.id,
            'company_id', NEW.company_id,
            'user_id', NEW.user_id
        )::text);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM pg_notify('company_comment_changes', json_build_object(
            'operation', 'update',
            'id', NEW.id,
            'company_id', NEW.company_id,
            'user_id', NEW.user_id
        )::text);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM pg_notify('company_comment_changes', json_build_object(
            'operation', 'delete',
            'id', OLD.id,
            'company_id', OLD.company_id,
            'user_id', OLD.user_id
        )::text);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_agent_company_changes()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  old_company_id INTEGER;
  new_company_id INTEGER;
  old_employee_count INTEGER;
  new_employee_count INTEGER;
  agent_data JSON;
BEGIN
  -- Only send notification if company_id changed (assignment change)
  IF TG_OP = 'UPDATE' AND (OLD.company_id IS DISTINCT FROM NEW.company_id) THEN
    -- Get old and new company IDs
    old_company_id := OLD.company_id;
    new_company_id := NEW.company_id;
    
    -- Get full agent data by joining with correct tables
    SELECT json_build_object(
      'user_id', u.id,
      'first_name', pi.first_name,        -- ✅ From personal_info
      'last_name', pi.last_name,          -- ✅ From personal_info
      'profile_picture', pi.profile_picture, -- ✅ From personal_info
      'employee_id', ji.employee_id,      -- ✅ From job_info
      'job_title', ji.job_title,          -- ✅ From job_info
      'company_id', a.company_id
    ) INTO agent_data
    FROM public.agents a
    JOIN public.users u ON a.user_id = u.id
    JOIN public.personal_info pi ON a.user_id = pi.user_id  -- ✅ JOIN personal_info
    LEFT JOIN public.job_info ji ON a.user_id = ji.agent_user_id  -- ✅ LEFT JOIN job_info
    WHERE a.user_id = NEW.user_id;
    
    -- Calculate employee counts for old and new companies
    IF old_company_id IS NOT NULL THEN
      SELECT COUNT(*) INTO old_employee_count 
      FROM public.agents 
      WHERE company_id = old_company_id;
    ELSE
      old_employee_count := NULL;
    END IF;
    
    IF new_company_id IS NOT NULL THEN
      SELECT COUNT(*) INTO new_employee_count 
      FROM public.agents 
      WHERE company_id = new_company_id;
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
$function$;

CREATE OR REPLACE FUNCTION public.notify_client_company_changes()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  old_company_id INTEGER;
  new_company_id INTEGER;
  old_client_count INTEGER;
  new_client_count INTEGER;
  client_data JSON;
BEGIN
  -- Only send notification if company_id changed (assignment change)
  IF TG_OP = 'UPDATE' AND (OLD.company_id IS DISTINCT FROM NEW.company_id) THEN
    -- Get old and new company IDs
    old_company_id := OLD.company_id;
    new_company_id := NEW.company_id;
    
    -- Get full client data by joining with correct tables
    SELECT json_build_object(
      'user_id', u.id,
      'first_name', pi.first_name,        -- ✅ From personal_info
      'last_name', pi.last_name,          -- ✅ From personal_info
      'profile_picture', pi.profile_picture, -- ✅ From personal_info
      'company_id', c.company_id
    ) INTO client_data
    FROM public.clients c
    JOIN public.users u ON c.user_id = u.id
    JOIN public.personal_info pi ON c.user_id = pi.user_id  -- ✅ JOIN personal_info
    WHERE c.user_id = NEW.user_id;
    
    -- Calculate client counts for old and new companies
    IF old_company_id IS NOT NULL THEN
      SELECT COUNT(*) INTO old_client_count 
      FROM public.clients 
      WHERE company_id = old_company_id;
    ELSE
      old_client_count := NULL;
    END IF;
    
    IF new_company_id IS NOT NULL THEN
      SELECT COUNT(*) INTO new_client_count 
      FROM public.clients 
      WHERE company_id = new_company_id;
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
$function$;

-- ==============================================
-- 9. UPDATE TRIGGERS
-- ==============================================

-- Drop old triggers
DROP TRIGGER IF EXISTS update_members_updated_at ON public.companies;
DROP TRIGGER IF EXISTS notify_member_changes ON public.companies;
DROP TRIGGER IF EXISTS notify_member_activity_changes ON public.companies_activity_log;
DROP TRIGGER IF EXISTS notify_member_comment_insert ON public.company_comments;
DROP TRIGGER IF EXISTS notify_member_comment_update ON public.company_comments;
DROP TRIGGER IF EXISTS notify_member_comment_delete ON public.company_comments;
DROP TRIGGER IF EXISTS trigger_agent_member_changes ON public.agents;
DROP TRIGGER IF EXISTS trigger_client_member_changes ON public.clients;

-- Create new triggers
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER notify_company_changes AFTER INSERT OR UPDATE OR DELETE ON public.companies FOR EACH ROW EXECUTE FUNCTION notify_company_changes();

CREATE TRIGGER notify_company_activity_changes AFTER INSERT OR UPDATE OR DELETE ON public.companies_activity_log FOR EACH ROW EXECUTE FUNCTION notify_company_activity_changes();

CREATE TRIGGER notify_company_comment_insert AFTER INSERT ON public.company_comments FOR EACH ROW EXECUTE FUNCTION notify_company_comment_changes();
CREATE TRIGGER notify_company_comment_update AFTER UPDATE ON public.company_comments FOR EACH ROW EXECUTE FUNCTION notify_company_comment_changes();
CREATE TRIGGER notify_company_comment_delete AFTER DELETE ON public.company_comments FOR EACH ROW EXECUTE FUNCTION notify_company_comment_changes();

CREATE TRIGGER trigger_agent_company_changes AFTER UPDATE ON public.agents FOR EACH ROW EXECUTE FUNCTION notify_agent_company_changes();
CREATE TRIGGER trigger_client_company_changes AFTER UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION notify_client_company_changes();

-- ==============================================
-- 10. UPDATE TABLE COMMENTS (if any exist)
-- ==============================================

-- Update table comments to reflect new names
COMMENT ON TABLE public.companies IS 'Companies table (formerly members)';
COMMENT ON TABLE public.companies_activity_log IS 'Companies activity log (formerly members_activity_log)';
COMMENT ON TABLE public.floor_plan_companies IS 'Floor plan companies (formerly floor_plan_members)';
COMMENT ON TABLE public.company_comments IS 'Company comments (formerly member_comments)';

-- ==============================================
-- MIGRATION COMPLETE
-- ==============================================

-- Summary of changes:
-- 1. Renamed enum types: member_service_enum → company_service_enum, member_status_enum → company_status_enum
-- 2. Renamed tables: members → companies, members_activity_log → companies_activity_log, etc.
-- 3. Updated foreign key columns: member_id → company_id
-- 4. Updated foreign key constraints and unique constraints
-- 5. Updated indexes and sequences
-- 6. Updated functions: notify_member_* → notify_company_*, notify_agent_member_changes → notify_agent_company_changes, notify_client_member_changes → notify_client_company_changes
-- 7. Updated triggers to use new function names
-- 8. Updated table comments

SELECT 'Migration completed successfully: members renamed to companies' AS status;
