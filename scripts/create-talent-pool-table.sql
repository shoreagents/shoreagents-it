-- Create bpoc_comments table to store shared comments across the system
CREATE TABLE IF NOT EXISTS public.bpoc_comments (
    id SERIAL PRIMARY KEY,
    comment TEXT NOT NULL, -- The comment content
    comment_type VARCHAR(50) DEFAULT 'general', -- Type of comment (general, talent_pool, interview, feedback, etc.)
    created_by INTEGER, -- User ID from users table who created the comment
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (created_by) REFERENCES public.users(id)
);

-- Simple table creation - drop and recreate for clean setup
DROP TABLE IF EXISTS public.talent_pool CASCADE;

-- Create talent_pool table to store applicants who have passed the recruitment process
CREATE TABLE IF NOT EXISTS public.talent_pool (
    id SERIAL PRIMARY KEY,
    applicant_id UUID NOT NULL, -- Reference to the applicant in bpoc_recruits
    comment_id INTEGER, -- Reference to the comment in bpoc_comments table
    interested_clients INTEGER[], -- Array of client IDs who are interested in this talent
    last_contact_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (comment_id) REFERENCES public.bpoc_comments(id),
    FOREIGN KEY (applicant_id) REFERENCES public.bpoc_recruits(applicant_id)
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_bpoc_comments_created_by ON public.bpoc_comments(created_by);
CREATE INDEX IF NOT EXISTS idx_bpoc_comments_type ON public.bpoc_comments(comment_type);
CREATE INDEX IF NOT EXISTS idx_talent_pool_applicant_id ON public.talent_pool(applicant_id);
CREATE INDEX IF NOT EXISTS idx_talent_pool_comment_id ON public.talent_pool(comment_id);
CREATE INDEX IF NOT EXISTS idx_talent_pool_interested_clients ON public.talent_pool USING GIN(interested_clients);

-- Create trigger function to automatically add applicants to talent pool when status changes to 'passed'
CREATE OR REPLACE FUNCTION public.add_to_talent_pool()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle status change TO 'passed'
    IF NEW.status = 'passed' AND (OLD.status IS NULL OR OLD.status != 'passed') THEN
        
        -- Check if applicant already exists in talent pool
        IF NOT EXISTS (SELECT 1 FROM public.talent_pool WHERE applicant_id = NEW.applicant_id) THEN
            
            -- First, create a comment and get its ID
            INSERT INTO public.bpoc_comments (
                comment,
                comment_type,
                created_by,
                created_at,
                updated_at
            ) VALUES (
                'Added to Talent Pool', -- Default comment
                'activity', -- Comment type for talent pool entries
                NULL, -- Will be set by application layer with actual user ID
                NOW(),
                NOW()
            );
            
            -- Then, insert into talent pool using the comment ID
            INSERT INTO public.talent_pool (
                applicant_id,
                comment_id,
                created_at,
                updated_at
            ) VALUES (
                NEW.applicant_id,
                currval('public.bpoc_comments_id_seq'), -- Get the ID of the comment we just created
                NOW(),
                NOW()
            );
            
            RAISE NOTICE 'Applicant % added to talent pool', NEW.applicant_id;
        ELSE
            RAISE NOTICE 'Applicant % already exists in talent pool', NEW.applicant_id;
        END IF;
        
    -- Handle status change FROM 'passed' to something else
    ELSIF OLD.status = 'passed' AND NEW.status != 'passed' THEN
        
        -- Remove from talent pool
        DELETE FROM public.talent_pool WHERE applicant_id = NEW.applicant_id;
        
        RAISE NOTICE 'Applicant % removed from talent pool (status changed to: %)', NEW.applicant_id, NEW.status;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on bpoc_recruits table
DROP TRIGGER IF EXISTS trigger_add_to_talent_pool ON public.bpoc_recruits;

CREATE TRIGGER trigger_add_to_talent_pool
    AFTER UPDATE OF status ON public.bpoc_recruits
    FOR EACH ROW
    EXECUTE FUNCTION public.add_to_talent_pool();

-- Create trigger for INSERT operations as well (in case status is 'passed' from the start)
DROP TRIGGER IF EXISTS trigger_add_to_talent_pool_insert ON public.bpoc_recruits;

CREATE TRIGGER trigger_add_to_talent_pool_insert
    AFTER INSERT ON public.bpoc_recruits
    FOR EACH ROW
    EXECUTE FUNCTION public.add_to_talent_pool();

-- No need for populate function since there's no existing passed data

-- Grant necessary permissions (adjust as needed for your setup)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bpoc_comments TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.bpoc_comments_id_seq TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.talent_pool TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.talent_pool_id_seq TO authenticated;

-- Example queries for managing talent pool:

-- View all talent pool members with job details
-- SELECT tp.*, a.job_title, a.company_name FROM public.talent_pool tp 
-- JOIN public.bpoc_applicants a ON tp.applicant_id = a.id::VARCHAR 
-- ORDER BY tp.created_at DESC;

-- View all talent pool members with job details
-- SELECT tp.*, a.job_title, a.company_name FROM public.talent_pool tp 
-- JOIN public.bpoc_applicants a ON tp.applicant_id = a.id::VARCHAR 
-- ORDER BY tp.created_at DESC;

-- Search by specific job ID (now via bpoc_recruits)
-- SELECT tp.*, br.job_title, br.company_name 
-- FROM public.talent_pool tp
-- JOIN public.bpoc_recruits br ON tp.applicant_id = br.applicant_id
-- WHERE br.job_id = 123 AND br.status = 'passed';

-- View talent pool with applicant info from bpoc_recruits
-- SELECT tp.*, c.comment, c.comment_type, c.created_at as comment_date,
--        br.job_title, br.company_name, br.job_id
-- FROM public.talent_pool tp
-- JOIN public.bpoc_comments c ON tp.comment_id = c.id
-- JOIN public.bpoc_recruits br ON tp.applicant_id = br.applicant_id
-- WHERE tp.applicant_id = '123'
-- ORDER BY tp.created_at DESC;

-- View comments for bpoc recruits (if you add comment_id to bpoc_recruits later)
-- SELECT c.*, br.applicant_id, br.job_title, br.company_name
-- FROM public.bpoc_comments c
-- JOIN public.bpoc_recruits br ON c.id = br.comment_id
-- WHERE br.applicant_id = '123'
-- ORDER BY c.created_at DESC;

-- Add new comment that can be shared between tables
-- INSERT INTO public.bpoc_comments (comment, comment_type, created_by) 
-- VALUES ('Great candidate for senior positions', 'feedback', 1);

-- Filter comments by type
-- SELECT * FROM public.bpoc_comments WHERE comment_type = 'talent_pool';
-- SELECT * FROM public.bpoc_comments WHERE comment_type = 'feedback';
-- SELECT * FROM public.bpoc_comments WHERE comment_type = 'interview';

-- Update existing comment (updates everywhere it's referenced)
-- UPDATE public.bpoc_comments SET comment = 'Updated comment', updated_at = NOW() WHERE id = 1;

-- Update created_by for system-generated comments
-- UPDATE public.bpoc_comments SET created_by = 1 WHERE created_by IS NULL;

-- View comments with user information
-- SELECT c.*, u.email as user_email, u.user_type 
-- FROM public.bpoc_comments c
-- LEFT JOIN public.users u ON c.created_by = u.id
-- ORDER BY c.created_at DESC;

-- Link existing comment to talent_pool
-- UPDATE public.talent_pool SET comment_id = 1 WHERE applicant_id = '123';

-- Note: To link comments to bpoc_recruits, you would need to:
-- 1. Add comment_id column to bpoc_recruits table
-- 2. Then use: UPDATE public.bpoc_recruits SET comment_id = 1 WHERE applicant_id = '123';

-- Get all jobs for a specific applicant from talent pool
-- SELECT tp.*, c.comment, br.job_title, br.company_name, br.job_id
-- FROM public.talent_pool tp
-- JOIN public.bpoc_comments c ON tp.comment_id = c.id
-- JOIN public.bpoc_recruits br ON tp.applicant_id = br.applicant_id
-- WHERE tp.applicant_id = '123' AND br.status = 'passed'
-- ORDER BY br.created_at DESC;

-- Toggle client interest in talent (add client if not interested, remove if already interested)
-- UPDATE public.talent_pool 
-- SET interested_clients = CASE 
--   WHEN $1 = ANY(interested_clients) 
--   THEN array_remove(interested_clients, $1)  -- Remove client if already interested
--   ELSE array_append(interested_clients, $1)  -- Add client if not interested
-- END
-- WHERE id = 1;

-- Get all talent that a specific client is interested in
-- SELECT tp.*, c.comment, br.job_title, br.company_name, cl.company_name as client_company
-- FROM public.talent_pool tp
-- JOIN public.bpoc_comments c ON tp.comment_id = c.id
-- JOIN public.bpoc_recruits br ON tp.applicant_id = br.applicant_id
-- JOIN public.clients cl ON cl.id = ANY(tp.interested_clients)
-- WHERE cl.id = $1
-- ORDER BY tp.created_at DESC;

-- Get all talent that a specific applicant is in
-- SELECT tp.*, c.comment, br.job_title, br.company_name
-- FROM public.talent_pool tp
-- JOIN public.bpoc_comments c ON tp.comment_id = c.id
-- JOIN public.bpoc_recruits br ON tp.applicant_id = br.applicant_id
-- WHERE tp.applicant_id = '123e4567-e89b-12d3-a456-426614174000'::UUID
-- ORDER BY tp.created_at DESC;

-- Get count of interested clients for each talent
-- SELECT tp.id, tp.applicant_id, array_length(tp.interested_clients, 1) as client_interest_count
-- FROM public.talent_pool tp
-- ORDER BY client_interest_count DESC NULLS LAST;

-- Run this to populate talent pool with existing passed applicants
-- SELECT public.populate_talent_pool_from_existing();
