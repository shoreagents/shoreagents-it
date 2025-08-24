-- Fix website array handling in trigger function
-- The website field is _text (text[]) but log_members_activity expects text

-- Drop and recreate the trigger function with proper array handling
CREATE OR REPLACE FUNCTION public.trigger_members_activity_log()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    current_user_id INTEGER;
BEGIN
    -- Get current user ID from session or default to NULL
    current_user_id := COALESCE(
        current_setting('app.current_user_id', true)::INTEGER,
        NULL
    );
    
    -- Only log UPDATE operations (existing members), skip INSERT (new members)
    CASE TG_OP
        WHEN 'INSERT' THEN 
            -- Company created - log single creation entry
            PERFORM log_members_activity(
                NEW.id,
                'company',
                'created',
                NULL,
                NEW.company,
                current_user_id
            );
            
        WHEN 'UPDATE' THEN 
            -- Company updated - log each field that changed
            IF OLD.company IS DISTINCT FROM NEW.company THEN
                IF OLD.company IS NULL OR OLD.company = '' THEN
                    -- Setting company for first time
                    PERFORM log_members_activity(
                        NEW.id,
                        'company',
                        'set',
                        NULL,
                        NEW.company,
                        current_user_id
                    );
                ELSE
                    -- Updating existing company
                    PERFORM log_members_activity(
                        NEW.id,
                        'company',
                        'updated',
                        OLD.company,
                        NEW.company,
                        current_user_id
                    );
                END IF;
            END IF;
            
            IF OLD.address IS DISTINCT FROM NEW.address THEN
                IF OLD.address IS NULL OR OLD.address = '' THEN
                    -- Setting address for first time
                    PERFORM log_members_activity(
                        NEW.id,
                        'address',
                        'set',
                        NULL,
                        NEW.address,
                        current_user_id
                    );
                ELSE
                    -- Updating existing address
                    PERFORM log_members_activity(
                        NEW.id,
                        'address',
                        'updated',
                        OLD.address,
                        NEW.address,
                        current_user_id
                    );
                END IF;
            END IF;
            
            IF OLD.phone IS DISTINCT FROM NEW.phone THEN
                IF OLD.phone IS NULL OR OLD.phone = '' THEN
                    -- Setting phone for first time
                    PERFORM log_members_activity(
                        NEW.id,
                        'phone',
                        'set',
                        NULL,
                        NEW.phone,
                        current_user_id
                    );
                ELSE
                    -- Updating existing phone
                    PERFORM log_members_activity(
                        NEW.id,
                        'phone',
                        'updated',
                        OLD.phone,
                        NEW.phone,
                        current_user_id
                    );
                END IF;
            END IF;
            
            IF OLD.country IS DISTINCT FROM NEW.country THEN
                IF OLD.country IS NULL OR OLD.country = '' THEN
                    -- Setting country for first time
                    PERFORM log_members_activity(
                        NEW.id,
                        'country',
                        'set',
                        NULL,
                        NEW.country,
                        current_user_id
                    );
                ELSE
                    -- Updating existing country
                    PERFORM log_members_activity(
                        NEW.id,
                        'country',
                        'updated',
                        OLD.country,
                        NEW.country,
                        current_user_id
                    );
                END IF;
            END IF;
            
            IF OLD.service IS DISTINCT FROM NEW.service THEN
                IF OLD.service IS NULL OR OLD.service = '' THEN
                    -- Setting service for first time
                    PERFORM log_members_activity(
                        NEW.id,
                        'service',
                        'set',
                        NULL,
                        NEW.service,
                        current_user_id
                    );
                ELSE
                    -- Updating existing service
                    PERFORM log_members_activity(
                        NEW.id,
                        'service',
                        'updated',
                        OLD.service,
                        NEW.service,
                        current_user_id
                    );
                END IF;
            END IF;
            
            IF OLD.website IS DISTINCT FROM NEW.website THEN
                IF OLD.website IS NULL OR array_length(OLD.website, 1) IS NULL THEN
                    -- Setting website for first time
                    PERFORM log_members_activity(
                        NEW.id,
                        'website',
                        'set',
                        NULL,
                        array_to_string(NEW.website, ', '),
                        current_user_id
                    );
                ELSE
                    -- Updating existing website
                    PERFORM log_members_activity(
                        NEW.id,
                        'website',
                        'updated',
                        array_to_string(OLD.website, ', '),
                        array_to_string(NEW.website, ', '),
                        current_user_id
                    );
                END IF;
            END IF;
            
        -- No need to log DELETE operations since activity logs are CASCADE deleted
        -- WHEN 'DELETE' THEN 
        --     -- Company deleted - log deletion of company field
        --     PERFORM log_members_activity(
        --         OLD.id,
        --         'company',
        --         'deleted',
        --         OLD.company,
        --         NULL,
        --         current_user_id
        --     );
    END CASE;
    
    RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create trigger to automatically log member changes
-- Log INSERT (company creation) and UPDATE (company modifications)
DROP TRIGGER IF EXISTS trigger_members_activity_log ON public.members;
CREATE TRIGGER trigger_members_activity_log
    AFTER INSERT OR UPDATE
    ON public.members
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_members_activity_log();
