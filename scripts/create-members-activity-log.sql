-- Create members activity log system
-- This script creates the table, functions, and triggers for tracking member/company changes

-- Create the members_activity_log table
CREATE TABLE IF NOT EXISTS public.members_activity_log (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL,
    user_id INTEGER,
    action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'deleted', 'agent_assigned', 'agent_removed', 'client_assigned', 'client_removed'
    old_data JSONB,
    new_data JSONB,
    details TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT members_activity_log_member_id_fkey 
        FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE,
    CONSTRAINT members_activity_log_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_members_activity_log_member_id ON public.members_activity_log(member_id);
CREATE INDEX IF NOT EXISTS idx_members_activity_log_action ON public.members_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_members_activity_log_created_at ON public.members_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_members_activity_log_user_id ON public.members_activity_log(user_id);

-- Create function to log member activity
CREATE OR REPLACE FUNCTION log_member_activity(
    p_member_id INTEGER,
    p_action VARCHAR(50),
    p_old_data JSONB DEFAULT NULL,
    p_new_data JSONB DEFAULT NULL,
    p_details TEXT DEFAULT NULL,
    p_user_id INTEGER DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    log_id INTEGER;
BEGIN
    INSERT INTO public.members_activity_log (
        member_id,
        user_id,
        action,
        old_data,
        new_data,
        details
    ) VALUES (
        p_member_id,
        p_user_id,
        p_action,
        p_old_data,
        p_new_data,
        p_details
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log agent assignment changes
CREATE OR REPLACE FUNCTION log_agent_assignment_change(
    p_member_id INTEGER,
    p_agent_id INTEGER,
    p_action VARCHAR(50), -- 'assigned', 'removed'
    p_user_id INTEGER DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    log_id INTEGER;
    details TEXT;
BEGIN
    details := CASE 
        WHEN p_action = 'assigned' THEN format('Agent ID %s assigned to company', p_agent_id)
        WHEN p_action = 'removed' THEN format('Agent ID %s removed from company', p_agent_id)
        ELSE format('Agent ID %s: %s', p_agent_id, p_action)
    END;
    
    INSERT INTO public.members_activity_log (
        member_id,
        user_id,
        action,
        details
    ) VALUES (
        p_member_id,
        p_user_id,
        'agent_' || p_action,
        details
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log client assignment changes
CREATE OR REPLACE FUNCTION log_client_assignment_change(
    p_member_id INTEGER,
    p_client_id INTEGER,
    p_action VARCHAR(50), -- 'assigned', 'removed'
    p_user_id INTEGER DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    log_id INTEGER;
    details TEXT;
BEGIN
    details := CASE 
        WHEN p_action = 'assigned' THEN format('Client ID %s assigned to company', p_client_id)
        WHEN p_action = 'removed' THEN format('Client ID %s removed from company', p_client_id)
        ELSE format('Client ID %s: %s', p_client_id, p_action)
    END;
    
    INSERT INTO public.members_activity_log (
        member_id,
        user_id,
        action,
        details
    ) VALUES (
        p_member_id,
        p_user_id,
        'client_' || p_action,
        details
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function for automatic member activity logging
CREATE OR REPLACE FUNCTION trigger_member_activity_log()
RETURNS TRIGGER AS $$
DECLARE
    action_type VARCHAR(50);
    old_data JSONB;
    new_data JSONB;
    details TEXT;
BEGIN
    -- Determine action type
    CASE TG_OP
        WHEN 'INSERT' THEN 
            action_type := 'created';
            new_data := row_to_json(NEW);
            details := format('Company "%s" created', NEW.company);
        WHEN 'UPDATE' THEN 
            action_type := 'updated';
            old_data := row_to_json(OLD);
            new_data := row_to_json(NEW);
            
            -- Generate detailed change description
            details := 'Company updated: ';
            IF OLD.company IS DISTINCT FROM NEW.company THEN
                details := details || format('name "%s" → "%s", ', OLD.company, NEW.company);
            END IF;
            IF OLD.address IS DISTINCT FROM NEW.address THEN
                details := details || 'address changed, ';
            END IF;
            IF OLD.phone IS DISTINCT FROM NEW.phone THEN
                details := details || 'phone changed, ';
            END IF;
            IF OLD.country IS DISTINCT FROM NEW.country THEN
                details := details || 'country changed, ';
            END IF;
            IF OLD.service IS DISTINCT FROM NEW.service THEN
                details := details || 'service changed, ';
            END IF;
            IF OLD.status IS DISTINCT FROM NEW.status THEN
                details := details || format('status "%s" → "%s", ', OLD.status, NEW.status);
            END IF;
            IF OLD.badge_color IS DISTINCT FROM NEW.badge_color THEN
                details := details || 'badge color changed, ';
            END IF;
            
            -- Remove trailing comma and space
            details := rtrim(details, ', ');
            
        WHEN 'DELETE' THEN 
            action_type := 'deleted';
            old_data := row_to_json(OLD);
            details := format('Company "%s" deleted', OLD.company);
    END CASE;
    
    -- Log the activity
    PERFORM log_member_activity(
        COALESCE(NEW.id, OLD.id),
        action_type,
        old_data,
        new_data,
        details,
        COALESCE(NEW.updated_by, OLD.updated_by)
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for members table
DROP TRIGGER IF EXISTS trigger_member_activity_log ON public.members;
CREATE TRIGGER trigger_member_activity_log
    AFTER INSERT OR UPDATE OR DELETE ON public.members
    FOR EACH ROW EXECUTE FUNCTION trigger_member_activity_log();

-- Create trigger function for agent assignment changes
CREATE OR REPLACE FUNCTION trigger_agent_assignment_log()
RETURNS TRIGGER AS $$
BEGIN
    -- Log agent assignment changes
    IF TG_OP = 'UPDATE' AND (OLD.member_id IS DISTINCT FROM NEW.member_id) THEN
        IF OLD.member_id IS NOT NULL THEN
            -- Agent removed from company
            PERFORM log_agent_assignment_change(OLD.member_id, NEW.user_id, 'removed', NEW.updated_by);
        END IF;
        
        IF NEW.member_id IS NOT NULL THEN
            -- Agent assigned to company
            PERFORM log_agent_assignment_change(NEW.member_id, NEW.user_id, 'assigned', NEW.updated_by);
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for agents table
DROP TRIGGER IF EXISTS trigger_agent_assignment_log ON public.agents;
CREATE TRIGGER trigger_agent_assignment_log
    AFTER UPDATE ON public.agents
    FOR EACH ROW EXECUTE FUNCTION trigger_agent_assignment_log();

-- Create trigger function for client assignment changes
CREATE OR REPLACE FUNCTION trigger_client_assignment_log()
RETURNS TRIGGER AS $$
BEGIN
    -- Log client assignment changes
    IF TG_OP = 'UPDATE' AND (OLD.member_id IS DISTINCT FROM NEW.member_id) THEN
        IF OLD.member_id IS NOT NULL THEN
            -- Client removed from company
            PERFORM log_client_assignment_change(OLD.member_id, NEW.user_id, 'removed', NEW.updated_by);
        END IF;
        
        IF NEW.member_id IS NOT NULL THEN
            -- Client assigned to company
            PERFORM log_client_assignment_change(NEW.member_id, NEW.user_id, 'assigned', NEW.updated_by);
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for clients table
DROP TRIGGER IF EXISTS trigger_client_assignment_log ON public.clients;
CREATE TRIGGER trigger_client_assignment_log
    AFTER UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION trigger_client_assignment_log();

-- Grant permissions
GRANT SELECT, INSERT ON public.members_activity_log TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.members_activity_log_id_seq TO authenticated;

-- Create view for easy activity log querying
CREATE OR REPLACE VIEW members_activity_summary AS
SELECT 
    mal.id,
    mal.member_id,
    m.company as company_name,
    mal.action,
    mal.details,
    mal.old_data,
    mal.new_data,
    u.first_name || ' ' || u.last_name as user_name,
    mal.created_at,
    mal.ip_address,
    mal.user_agent
FROM public.members_activity_log mal
LEFT JOIN public.members m ON mal.member_id = m.id
LEFT JOIN public.users u ON mal.user_id = u.id
ORDER BY mal.created_at DESC;

-- Grant access to the view
GRANT SELECT ON members_activity_summary TO authenticated;

-- Insert sample activity log entry for testing
-- INSERT INTO public.members_activity_log (member_id, action, details) VALUES (1, 'test', 'Activity log system initialized');

COMMENT ON TABLE public.members_activity_log IS 'Tracks all activity related to member/company changes';
COMMENT ON FUNCTION log_member_activity IS 'Logs member activity with detailed information';
COMMENT ON FUNCTION log_agent_assignment_change IS 'Logs agent assignment changes to companies';
COMMENT ON FUNCTION log_client_assignment_change IS 'Logs client assignment changes to companies';
