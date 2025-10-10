-- Migration script focused on companies, agents, and clients tables only
-- This script contains necessary changes to migrate from members to companies

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

-- ==============================================
-- 3. UPDATE FOREIGN KEY COLUMNS
-- ==============================================

-- Update agents table: rename member_id to company_id
ALTER TABLE public.agents RENAME COLUMN member_id TO company_id;

-- Update clients table: rename member_id to company_id
ALTER TABLE public.clients RENAME COLUMN member_id TO company_id;

-- ==============================================
-- 4. UPDATE FOREIGN KEY CONSTRAINTS
-- ==============================================

-- Drop old foreign key constraints
ALTER TABLE public.agents DROP CONSTRAINT agents_member_id_fkey;
ALTER TABLE public.clients DROP CONSTRAINT clients_member_id_fkey;

-- Add new foreign key constraints
ALTER TABLE public.agents ADD CONSTRAINT agents_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.clients ADD CONSTRAINT clients_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;

-- ==============================================
-- 5. UPDATE INDEXES
-- ==============================================

-- Drop old indexes
DROP INDEX IF EXISTS public.idx_members_company;
DROP INDEX IF EXISTS public.idx_members_country;
DROP INDEX IF EXISTS public.idx_members_listing;
DROP INDEX IF EXISTS public.idx_members_status;
DROP INDEX IF EXISTS public.idx_agents_member_department;
DROP INDEX IF EXISTS public.idx_agents_member_user;
DROP INDEX IF EXISTS public.idx_clients_member_department;

-- Create new indexes
CREATE INDEX idx_companies_company ON public.companies USING btree (company);
CREATE INDEX idx_companies_country ON public.companies USING btree (country);
CREATE INDEX idx_companies_listing ON public.companies USING btree (status, country) INCLUDE (id, company, service, badge_color);
CREATE INDEX idx_companies_status ON public.companies USING btree (status);
CREATE INDEX idx_agents_company_department ON public.agents USING btree (company_id, department_id);
CREATE INDEX idx_agents_company_user ON public.agents USING btree (company_id, user_id);
CREATE INDEX idx_clients_company_department ON public.clients USING btree (company_id, department_id);

-- ==============================================
-- 6. UPDATE SEQUENCES
-- ==============================================

-- Rename sequences
ALTER SEQUENCE public.members_id_seq RENAME TO companies_id_seq;

-- ==============================================
-- 7. UPDATE FUNCTIONS
-- ==============================================

-- Drop old functions
DROP FUNCTION IF EXISTS public.notify_member_changes();
DROP FUNCTION IF EXISTS public.notify_agent_member_changes();
DROP FUNCTION IF EXISTS public.notify_client_member_changes();

-- ==============================================
-- 8. UPDATE TRIGGERS
-- ==============================================

-- Drop old triggers
DROP TRIGGER IF EXISTS update_members_updated_at ON public.companies;
DROP TRIGGER IF EXISTS notify_member_changes ON public.companies;
DROP TRIGGER IF EXISTS trigger_agent_member_changes ON public.agents;
DROP TRIGGER IF EXISTS trigger_client_member_changes ON public.clients;

-- Create new trigger (only the updated_at trigger)
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 9. UPDATE TABLE COMMENTS
-- ==============================================

-- Update table comments to reflect new names
COMMENT ON TABLE public.companies IS 'Companies table (formerly members)';

-- ==============================================
-- MIGRATION COMPLETE
-- ==============================================

-- Summary of changes:
-- 1. Renamed enum types: member_service_enum → company_service_enum, member_status_enum → company_status_enum
-- 2. Renamed table: members → companies
-- 3. Updated foreign key columns: member_id → company_id in agents and clients tables
-- 4. Updated foreign key constraints for agents and clients
-- 5. Updated indexes for companies, agents, and clients tables
-- 6. Updated sequence: members_id_seq → companies_id_seq
-- 7. Dropped old notify functions and triggers
-- 8. Updated table comments

SELECT 'Migration completed successfully: members renamed to companies (agents, clients, companies tables only)' AS status;
