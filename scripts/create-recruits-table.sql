-- =====================================================
-- CREATE RECRUITS TABLE FOR DUAL DATABASE TRACKING
-- =====================================================
-- 
-- This table tracks all applicant status changes in the main database
-- while maintaining links to the BPOC database for data consistency.
-- 
-- Purpose: Create a comprehensive audit trail of recruitment pipeline
--          progress with enhanced applicant information tracking.
-- =====================================================

-- Create the main recruits table
-- This table will store every status change for every applicant
CREATE TABLE IF NOT EXISTS public.recruits (
  -- Primary identification
  id SERIAL PRIMARY KEY,                                    -- Auto-incrementing unique identifier
  
  -- BPOC Database Connection Fields
  bpoc_application_id UUID NOT NULL,                        -- Links back to BPOC applications table (foreign key)
  applicant_id UUID,                                        -- Applicant's user ID from BPOC database
  job_id INTEGER,                                           -- Job posting ID from BPOC database
  resume_slug TEXT,                                         -- Resume identifier from BPOC database
  
  -- Status Tracking Fields
  status TEXT NOT NULL,                                     -- New status after the change (e.g., 'screened', 'verified')
  previous_status TEXT,                                      -- Previous status before the change (e.g., 'new', 'screened')
  status_changed_at TIMESTAMPTZ DEFAULT NOW(),              -- When the status change occurred (automatically set)
  
  -- Position Field
  position INTEGER DEFAULT 0,                               -- Position within the status column for drag-and-drop ordering
  
  -- Metadata Fields
  created_at TIMESTAMPTZ DEFAULT NOW(),                     -- When this record was created
  updated_at TIMESTAMPTZ DEFAULT NOW(),                     -- When this record was last updated (auto-updated)
  recruiter_id INTEGER,                                     -- ID of the recruiter who made the status change
  
  -- Enhanced Applicant Information Fields
  video_introduction_url TEXT,                              -- URL to applicant's video introduction (optional)
  current_salary DECIMAL(10,2),                             -- Applicant's current monthly salary (optional)
  expected_monthly_salary DECIMAL(10,2),                    -- Applicant's desired monthly salary (optional)
  shift TEXT    
   created_at TIMESTAMPTZ DEFAULT NOW(),                     -- When this record was created
  updated_at TIMESTAMPTZ DEFAULT NOW(),                                                     -- Preferred work shift (morning/afternoon/night/flexible)
);

-- =====================================================
-- CREATE COMMENTS TABLE FOR USER INTERACTIONS
-- =====================================================
-- 
-- This table allows multiple users to add comments and notes
-- about specific recruits, enabling team collaboration and
-- comprehensive candidate assessment tracking.
-- =====================================================

-- Create the comments table for multiple user comments
CREATE TABLE IF NOT EXISTS public.recruit_comments (
  -- Primary identification
  id SERIAL PRIMARY KEY,                                    -- Auto-incrementing unique identifier
  
  -- Relationship Fields
  recruit_id INTEGER NOT NULL,                              -- Links to the recruits table (foreign key)
  user_id UUID NOT NULL,                                    -- ID of the user who made the comment
  
  -- Comment Content
  comments TEXT NOT NULL,                                   -- The actual comment content
  
  -- Metadata Fields
  created_at TIMESTAMPTZ DEFAULT NOW(),                     -- When the comment was created
  updated_at TIMESTAMPTZ DEFAULT NOW()                      -- When the comment was last updated (auto-updated)
);

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE OPTIMIZATION
-- =====================================================
-- 
-- These indexes will make queries faster when searching by:
-- - Application ID, status, dates, salary ranges, and shifts
-- - Comments by user, date, and type
-- =====================================================

-- Core lookup indexes for recruits table
CREATE INDEX IF NOT EXISTS idx_recruits_bpoc_application_id ON public.recruits(bpoc_application_id);  -- Fast BPOC lookups
CREATE INDEX IF NOT EXISTS idx_recruits_applicant_id ON public.recruits(applicant_id);                -- Fast applicant lookups
CREATE INDEX IF NOT EXISTS idx_recruits_status ON public.recruits(status);                            -- Fast status filtering
CREATE INDEX IF NOT EXISTS idx_recruits_status_changed_at ON public.recruits(status_changed_at);      -- Fast date range queries
CREATE INDEX IF NOT EXISTS idx_recruits_position ON public.recruits(status, position);                -- Fast position-based sorting within status

-- Comments table indexes
CREATE INDEX IF NOT EXISTS idx_recruit_comments_recruit_id ON public.recruit_comments(recruit_id);    -- Fast recruit comment lookups
CREATE INDEX IF NOT EXISTS idx_recruit_comments_user_id ON public.recruit_comments(user_id);          -- Fast user comment lookups
CREATE INDEX IF NOT EXISTS idx_recruit_comments_created_at ON public.recruit_comments(created_at);    -- Fast date-based comment queries

-- =====================================================
-- CREATE FOREIGN KEY CONSTRAINTS
-- =====================================================
-- 
-- These constraints ensure data integrity between the
-- recruits table and the comments table.
-- =====================================================

-- Add foreign key constraint for comments table
ALTER TABLE public.recruit_comments 
ADD CONSTRAINT fk_recruit_comments_recruit_id 
FOREIGN KEY (recruit_id) REFERENCES public.recruits(id) ON DELETE CASCADE;

-- =====================================================
-- CREATE AUTOMATIC TIMESTAMP UPDATES
-- =====================================================
-- 
-- This function automatically updates the 'updated_at' field
-- whenever a record is modified, ensuring accurate tracking.
-- =====================================================

-- Create or replace the timestamp update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();  -- Set updated_at to current timestamp
  RETURN NEW;              -- Return the modified record
END;
$$ language 'plpgsql';

-- Create the trigger for recruits table
DROP TRIGGER IF EXISTS update_recruits_updated_at ON public.recruits;
CREATE TRIGGER update_recruits_updated_at 
  BEFORE UPDATE ON public.recruits                           -- Before any update operation
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); -- Execute for each updated row

-- Create the trigger for recruit_comments table
DROP TRIGGER IF EXISTS update_recruit_comments_updated_at ON public.recruit_comments;
CREATE TRIGGER update_recruit_comments_updated_at 
  BEFORE UPDATE ON public.recruit_comments                   -- Before any update operation
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); -- Execute for each updated row

-- =====================================================
-- ADD TABLE AND COLUMN COMMENTS FOR DOCUMENTATION
-- =====================================================
-- 
-- These comments help developers understand the purpose
-- and usage of each field in the table.
-- =====================================================

-- Table-level comments explaining the overall purpose
COMMENT ON TABLE public.recruits IS 'Tracks all applicant status changes for recruitment pipeline analytics with enhanced applicant information. This table serves as a comprehensive audit trail connecting to BPOC database data.';
COMMENT ON TABLE public.recruit_comments IS 'Stores multiple user comments and notes for each recruit, enabling team collaboration and comprehensive candidate assessment tracking.';

-- Core field comments for recruits table
COMMENT ON COLUMN public.recruits.bpoc_application_id IS 'Foreign key linking to BPOC applications table. This maintains referential integrity between databases.';
COMMENT ON COLUMN public.recruits.applicant_id IS 'Foreign key to applicant user in BPOC database. Links status changes to specific candidates.';
COMMENT ON COLUMN public.recruits.job_id IS 'Job posting ID from BPOC database. Enables job-specific recruitment analytics.';
COMMENT ON COLUMN public.recruits.resume_slug IS 'Resume identifier from BPOC database. Links to candidate resume data.';

-- Status tracking comments
COMMENT ON COLUMN public.recruits.status IS 'New status after the change (e.g., screened, verified, ready for sale). This is the current pipeline position.';
COMMENT ON COLUMN public.recruits.previous_status IS 'Previous status before the change. Enables tracking of progression through the pipeline.';
COMMENT ON COLUMN public.recruits.status_changed_at IS 'Timestamp when the status change occurred. Critical for pipeline velocity analysis.';

-- Metadata comments
COMMENT ON COLUMN public.recruits.created_at IS 'When this status change record was created. Useful for audit trails.';
COMMENT ON COLUMN public.recruits.updated_at IS 'When this record was last modified. Auto-updated by trigger.';
COMMENT ON COLUMN public.recruits.recruiter_id IS 'ID of the recruiter who made the status change (links to main database users table). Enables accountability and performance tracking.';

-- Enhanced applicant information comments
COMMENT ON COLUMN public.recruits.video_introduction_url IS 'URL to applicant video introduction. Enables video screening and assessment.';
COMMENT ON COLUMN public.recruits.current_salary IS 'Current monthly salary in specified currency. Helps with compensation planning.';
COMMENT ON COLUMN public.recruits.expected_monthly_salary IS 'Expected monthly salary in specified currency. Critical for budget and negotiation planning.';
COMMENT ON COLUMN public.recruits.shift IS 'Preferred work shift (morning, afternoon, night, flexible). Important for scheduling and placement.';

-- Comments table field comments
COMMENT ON COLUMN public.recruit_comments.recruit_id IS 'Foreign key to the recruits table. Links comments to specific recruitment records.';
COMMENT ON COLUMN public.recruit_comments.user_id IS 'ID of the user who created the comment. Enables user attribution and accountability.';
COMMENT ON COLUMN public.recruit_comments.comments IS 'The actual comment content. Supports rich text for detailed notes and assessments.';
COMMENT ON COLUMN public.recruit_comments.created_at IS 'When the comment was created. Useful for chronological comment tracking.';
COMMENT ON COLUMN public.recruit_comments.updated_at IS 'When the comment was last modified. Auto-updated by trigger.';

-- =====================================================
-- VERIFY TABLE CREATION AND TEST BASIC FUNCTIONALITY
-- =====================================================
-- 
-- These queries confirm the tables were created successfully
-- and show the initial state.
-- =====================================================

-- Confirm successful table creation
SELECT 'Recruits table created successfully!' as message;
SELECT 'Recruit comments table created successfully!' as message;

-- Show current record count (should be 0 for new tables)
SELECT 'recruits' as table_name, COUNT(*) as total_records FROM public.recruits
UNION ALL
SELECT 'recruit_comments' as table_name, COUNT(*) as total_records FROM public.recruit_comments;

-- Display table structure for verification
SELECT 'recruits' as table_name, column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'recruits' 
ORDER BY ordinal_position;

SELECT 'recruit_comments' as table_name, column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'recruit_comments' 
ORDER BY ordinal_position;

-- =====================================================
-- TABLE CREATION COMPLETE!
-- =====================================================
-- 
-- Your recruitment tracking system is now ready with:
-- ✓ Applicant status changes (recruits table)
-- ✓ Multiple user comments (recruit_comments table)
-- ✓ Video introductions
-- ✓ Salary expectations  
-- ✓ Shift preferences
-- ✓ Complete audit trail
-- ✓ Team collaboration features
-- 
-- Next steps:
-- 1. Test the dual database connection
-- 2. Start tracking applicant status changes
-- 3. Add comments and notes for team collaboration
-- 4. Monitor recruitment pipeline analytics
-- =====================================================
