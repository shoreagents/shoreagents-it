-- Members Activity Log System - Track Field Changes
-- Shows: "James set Name to ABC Corp" and "James changed Name from ABC Corp to XYZ Corp"

\echo '🔧 Setting up Members Activity Log System for Field Changes...'

-- Create the members_activity_log table
\echo '📋 Creating members_activity_log table...'
CREATE TABLE IF NOT EXISTS public.members_activity_log (
    id SERIAL PRIMARY KEY,
    members_id INTEGER NOT NULL,
    user_id INTEGER,
    field_name VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'deleted'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT members_activity_log_members_id_fkey 
        FOREIGN KEY (members_id) REFERENCES public.members(id) ON DELETE CASCADE,
    CONSTRAINT members_activity_log_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL
);

-- Create indexes for better performance
\echo '📊 Creating indexes...'
CREATE INDEX IF NOT EXISTS idx_members_activity_log_members_id ON public.members_activity_log(members_id);
CREATE INDEX IF NOT EXISTS idx_members_activity_log_created_at ON public.members_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_members_activity_log_action ON public.members_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_members_activity_log_user_id ON public.members_activity_log(user_id);

-- Create function to log members activity
\echo '🔧 Creating log_members_activity function...'
CREATE OR REPLACE FUNCTION log_members_activity(
    p_members_id INTEGER,
    p_field_name VARCHAR(100),
    p_action VARCHAR(50),
    p_old_value TEXT DEFAULT NULL,
    p_new_value TEXT DEFAULT NULL,
    p_user_id INTEGER DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    log_id INTEGER;
BEGIN
    INSERT INTO public.members_activity_log (
        members_id,
        user_id,
        field_name,
        old_value,
        new_value,
        action
    ) VALUES (
        p_members_id,
        p_user_id,
        p_field_name,
        p_old_value,
        p_new_value,
        p_action
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function for automatic members activity logging
\echo '🔄 Creating trigger_members_activity_log function...'
CREATE OR REPLACE FUNCTION trigger_members_activity_log()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id INTEGER;
BEGIN
    -- Get current user ID from session or default to NULL
    current_user_id := COALESCE(
        current_setting('app.current_user_id', true)::INTEGER,
        NULL
    );
    
    -- Determine action type and log accordingly
    CASE TG_OP
        WHEN 'INSERT' THEN 
            -- Company created - log all initial values
            PERFORM log_members_activity(
                NEW.id,
                'company',
                'created',
                NULL,
                NEW.company,
                current_user_id
            );
            
            IF NEW.address IS NOT NULL THEN
                PERFORM log_members_activity(
                    NEW.id,
                    'address',
                    'created',
                    NULL,
                    NEW.address,
                    current_user_id
                );
            END IF;
            
            IF NEW.phone IS NOT NULL THEN
                PERFORM log_members_activity(
                    NEW.id,
                    'phone',
                    'created',
                    NULL,
                    NEW.phone,
                    current_user_id
                );
            END IF;
            
            IF NEW.country IS NOT NULL THEN
                PERFORM log_members_activity(
                    NEW.id,
                    'country',
                    'created',
                    NULL,
                    NEW.country,
                    current_user_id
                );
            END IF;
            
            IF NEW.service IS NOT NULL THEN
                PERFORM log_members_activity(
                    NEW.id,
                    'service',
                    'created',
                    NULL,
                    NEW.service,
                    current_user_id
                );
            END IF;
            
            IF NEW.website IS NOT NULL THEN
                PERFORM log_members_activity(
                    NEW.id,
                    'website',
                    'created',
                    NULL,
                    NEW.website,
                    current_user_id
                );
            END IF;
            
        WHEN 'UPDATE' THEN 
            -- Company updated - log each field that changed
            IF OLD.company IS DISTINCT FROM NEW.company THEN
                PERFORM log_members_activity(
                    NEW.id,
                    'company',
                    'updated',
                    OLD.company,
                    NEW.company,
                    current_user_id
                );
            END IF;
            
            IF OLD.address IS DISTINCT FROM NEW.address THEN
                PERFORM log_members_activity(
                    NEW.id,
                    'address',
                    'updated',
                    OLD.address,
                    NEW.address,
                    current_user_id
                );
            END IF;
            
            IF OLD.phone IS DISTINCT FROM NEW.phone THEN
                PERFORM log_members_activity(
                    NEW.id,
                    'phone',
                    'updated',
                    OLD.phone,
                    NEW.phone,
                    current_user_id
                );
            END IF;
            
            IF OLD.country IS DISTINCT FROM NEW.country THEN
                PERFORM log_members_activity(
                    NEW.id,
                    'country',
                    'updated',
                    OLD.country,
                    NEW.country,
                    current_user_id
                );
            END IF;
            
            IF OLD.service IS DISTINCT FROM NEW.service THEN
                PERFORM log_members_activity(
                    NEW.id,
                    'service',
                    'updated',
                    OLD.service,
                    NEW.service,
                    current_user_id
                );
            END IF;
            
            IF OLD.website IS DISTINCT FROM NEW.website THEN
                PERFORM log_members_activity(
                    NEW.id,
                    'website',
                    'updated',
                    OLD.website,
                    NEW.website,
                    current_user_id
                );
            END IF;
            
        WHEN 'DELETE' THEN 
            -- Company deleted - log deletion of company field
            PERFORM log_members_activity(
                OLD.id,
                'company',
                'deleted',
                OLD.company,
                NULL,
                current_user_id
            );
    END CASE;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for members table
\echo '🎯 Creating trigger for members table...'
DROP TRIGGER IF EXISTS trigger_members_activity_log ON public.members;
CREATE TRIGGER trigger_members_activity_log
    AFTER INSERT OR UPDATE OR DELETE ON public.members
    FOR EACH ROW EXECUTE FUNCTION trigger_members_activity_log();

-- Grant permissions
\echo '🔐 Setting permissions...'
GRANT SELECT, INSERT ON public.members_activity_log TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.members_activity_log_id_seq TO authenticated;

-- Create view for easy activity log querying
\echo '👁️ Creating members_activity_summary view...'
CREATE OR REPLACE VIEW members_activity_summary AS
SELECT 
    mal.id,
    mal.members_id,
    mal.field_name,
    mal.old_value,
    mal.new_value,
    mal.action,
    mal.created_at,
    COALESCE(u.first_name || ' ' || u.last_name, 'Unknown User') as user_name
FROM public.members_activity_log mal
LEFT JOIN public.users u ON mal.user_id = u.id
ORDER BY mal.created_at DESC;

-- Grant access to the view
GRANT SELECT ON members_activity_summary TO authenticated;

-- Insert sample activity log entry for testing
\echo '🧪 Inserting test activity log entry...'
INSERT INTO public.members_activity_log (members_id, field_name, action, new_value) 
VALUES (1, 'company', 'created', 'Test Company')
ON CONFLICT DO NOTHING;

\echo '✅ Members Activity Log System for Field Changes setup complete!'
\echo ''
\echo '📋 What was created:'
\echo '   - members_activity_log table with field tracking'
\echo '   - Field change logging function'
\echo '   - Automatic trigger for all field changes'
\echo '   - members_activity_summary view with user names'
\echo ''
\echo '🎯 The system will now automatically log:'
\echo '   - Company creation with all initial field values (shows as "set")'
\echo '   - Each field change (shows as "changed from X to Y")'
\echo '   - Field deletion (shows as "changed from X to -")'
\echo '   - Who made each change (user tracking)'
\echo '   - Date and time for all activities'
\echo ''
\echo '📱 Frontend will display:'
\echo '   • James set Name to ABC Corporation'
\echo '   • Sarah changed Address from 123 Old Street to 456 New Avenue'
\echo '   • Mike changed Phone from 555-1234 to -'
