-- DROP SCHEMA public;

CREATE SCHEMA public AUTHORIZATION pg_database_owner;

COMMENT ON SCHEMA public IS 'standard public schema';

-- DROP TYPE public."application_status_enum";

CREATE TYPE public."application_status_enum" AS ENUM (
	'submitted',
	'screened',
	'for verification',
	'verified',
	'initial interview',
	'final interview',
	'failed',
	'passed',
	'rejected',
	'withdrawn',
	'hired');

-- DROP TYPE public."experience_level_enum";

CREATE TYPE public."experience_level_enum" AS ENUM (
	'entry-level',
	'mid-level',
	'senior-level');

-- DROP TYPE public."game_difficulty_enum";

CREATE TYPE public."game_difficulty_enum" AS ENUM (
	'beginner',
	'easy',
	'intermediate',
	'advanced',
	'expert');

-- DROP TYPE public."job_status_enum";

CREATE TYPE public."job_status_enum" AS ENUM (
	'active',
	'inactive',
	'closed',
	'processed');

-- DROP TYPE public."member_status_enum";

CREATE TYPE public."member_status_enum" AS ENUM (
	'Current Client',
	'Lost Client');

-- DROP TYPE public."priority_enum";

CREATE TYPE public."priority_enum" AS ENUM (
	'low',
	'medium',
	'high');

-- DROP TYPE public."work_arrangement_enum";

CREATE TYPE public."work_arrangement_enum" AS ENUM (
	'onsite',
	'remote',
	'hybrid');

-- DROP SEQUENCE public.job_request_comments_id_seq;

CREATE SEQUENCE public.job_request_comments_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.job_requests_id_seq;

CREATE SEQUENCE public.job_requests_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;-- public.members definition

-- Drop table

-- DROP TABLE public.members;

CREATE TABLE public.members ( company text NOT NULL, status public."member_status_enum" NULL, created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL, updated_at timestamp DEFAULT CURRENT_TIMESTAMP NULL, company_id uuid DEFAULT gen_random_uuid() NOT NULL, CONSTRAINT members_company_id_key UNIQUE (company_id), CONSTRAINT members_pkey PRIMARY KEY (company_id));

-- Table Triggers

create trigger update_members_updated_at before
update
    on
    public.members for each row execute function update_updated_at_column();


-- public.users definition

-- Drop table

-- DROP TABLE public.users;

CREATE TABLE public.users ( id uuid NOT NULL, email text NOT NULL, first_name text NOT NULL, last_name text NOT NULL, full_name text NOT NULL, "location" text NOT NULL, avatar_url text NULL, created_at timestamp DEFAULT now() NULL, updated_at timestamp DEFAULT now() NULL, phone text NULL, bio text NULL, "position" text NULL, admin_level varchar(10) DEFAULT 'user'::character varying NULL, is_admin bool DEFAULT false NULL, CONSTRAINT users_admin_level_check CHECK (((admin_level)::text = ANY ((ARRAY['user'::character varying, 'admin'::character varying])::text[]))), CONSTRAINT users_email_key UNIQUE (email), CONSTRAINT users_pkey PRIMARY KEY (id));

-- Table Triggers

create trigger update_users_updated_at before
update
    on
    public.users for each row execute function update_updated_at_column();


-- public.disc_personality_sessions definition

-- Drop table

-- DROP TABLE public.disc_personality_sessions;

CREATE TABLE public.disc_personality_sessions ( id uuid DEFAULT gen_random_uuid() NOT NULL, user_id uuid NOT NULL, started_at timestamptz DEFAULT now() NULL, finished_at timestamptz NULL, duration_ms int4 NULL, d int2 NULL, i int2 NULL, s int2 NULL, c int2 NULL, primary_style text NULL, secondary_style text NULL, consistency_index numeric(5, 2) NULL, strengths jsonb NULL, blind_spots jsonb NULL, preferred_env jsonb NULL, created_at timestamptz DEFAULT now() NULL, updated_at timestamptz DEFAULT now() NULL, CONSTRAINT disc_personality_sessions_c_check CHECK (((c IS NULL) OR ((c >= 0) AND (c <= 100)))), CONSTRAINT disc_personality_sessions_d_check CHECK (((d IS NULL) OR ((d >= 0) AND (d <= 100)))), CONSTRAINT disc_personality_sessions_duration_ms_check CHECK (((duration_ms IS NULL) OR (duration_ms >= 0))), CONSTRAINT disc_personality_sessions_i_check CHECK (((i IS NULL) OR ((i >= 0) AND (i <= 100)))), CONSTRAINT disc_personality_sessions_pkey PRIMARY KEY (id), CONSTRAINT disc_personality_sessions_primary_style_check CHECK (((primary_style IS NULL) OR (primary_style = ANY (ARRAY['D'::text, 'I'::text, 'S'::text, 'C'::text])))), CONSTRAINT disc_personality_sessions_s_check CHECK (((s IS NULL) OR ((s >= 0) AND (s <= 100)))), CONSTRAINT disc_personality_sessions_secondary_style_check CHECK (((secondary_style IS NULL) OR (secondary_style = ANY (ARRAY['D'::text, 'I'::text, 'S'::text, 'C'::text])))), CONSTRAINT disc_personality_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE);
CREATE INDEX idx_disc_sessions_started ON public.disc_personality_sessions USING btree (started_at);
CREATE INDEX idx_disc_sessions_user ON public.disc_personality_sessions USING btree (user_id);

-- Table Triggers

create trigger update_disc_sessions_updated_at before
update
    on
    public.disc_personality_sessions for each row execute function update_updated_at_column();


-- public.disc_personality_stats definition

-- Drop table

-- DROP TABLE public.disc_personality_stats;

CREATE TABLE public.disc_personality_stats ( id uuid DEFAULT gen_random_uuid() NOT NULL, user_id uuid NOT NULL, total_sessions int4 DEFAULT 0 NOT NULL, completed_sessions int4 DEFAULT 0 NOT NULL, last_taken_at timestamptz NULL, d int2 NULL, i int2 NULL, s int2 NULL, c int2 NULL, primary_style text NULL, secondary_style text NULL, consistency_index numeric(5, 2) NULL, percentile numeric(5, 2) NULL, created_at timestamptz DEFAULT now() NULL, updated_at timestamptz DEFAULT now() NULL, ai_interpretation jsonb NULL, CONSTRAINT disc_personality_stats_percentile_check CHECK (((percentile IS NULL) OR ((percentile >= (0)::numeric) AND (percentile <= (100)::numeric)))), CONSTRAINT disc_personality_stats_pkey PRIMARY KEY (id), CONSTRAINT disc_personality_stats_primary_style_check CHECK (((primary_style IS NULL) OR (primary_style = ANY (ARRAY['D'::text, 'I'::text, 'S'::text, 'C'::text])))), CONSTRAINT disc_personality_stats_secondary_style_check CHECK (((secondary_style IS NULL) OR (secondary_style = ANY (ARRAY['D'::text, 'I'::text, 'S'::text, 'C'::text])))), CONSTRAINT disc_personality_stats_user_id_key UNIQUE (user_id), CONSTRAINT disc_personality_stats_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE);
CREATE INDEX idx_disc_stats_ai_interpretation ON public.disc_personality_stats USING gin (ai_interpretation jsonb_path_ops);
CREATE INDEX idx_disc_stats_user ON public.disc_personality_stats USING btree (user_id);

-- Table Triggers

create trigger update_disc_stats_updated_at before
update
    on
    public.disc_personality_stats for each row execute function update_updated_at_column();


-- public.job_requests definition

-- Drop table

-- DROP TABLE public.job_requests;

CREATE TABLE public.job_requests ( id serial4 NOT NULL, company_id uuid NULL, job_title text NOT NULL, work_arrangement public."work_arrangement_enum" NULL, salary_min int4 NULL, salary_max int4 NULL, job_description text NOT NULL, requirements _text DEFAULT '{}'::text[] NULL, responsibilities _text DEFAULT '{}'::text[] NULL, benefits _text DEFAULT '{}'::text[] NULL, skills _text DEFAULT '{}'::text[] NULL, experience_level public."experience_level_enum" NULL, application_deadline date NULL, industry text NULL, department text NULL, work_type text DEFAULT 'full-time'::text NOT NULL, currency text DEFAULT 'PHP'::text NOT NULL, salary_type text DEFAULT 'monthly'::text NOT NULL, status public."job_status_enum" DEFAULT 'active'::job_status_enum NOT NULL, "views" int4 DEFAULT 0 NOT NULL, applicants int4 DEFAULT 0 NOT NULL, created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL, priority public."priority_enum" DEFAULT 'medium'::priority_enum NOT NULL, CONSTRAINT job_requests_pkey PRIMARY KEY (id), CONSTRAINT job_requests_salary_max_check CHECK (((salary_max IS NULL) OR (salary_max >= 0))), CONSTRAINT job_requests_salary_min_check CHECK (((salary_min IS NULL) OR (salary_min >= 0))), CONSTRAINT job_requests_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.members(company_id) ON DELETE SET NULL);
CREATE INDEX idx_job_requests_company_id ON public.job_requests USING btree (company_id);
CREATE INDEX idx_job_requests_created_at ON public.job_requests USING btree (created_at);
CREATE INDEX idx_job_requests_priority ON public.job_requests USING btree (priority);
CREATE INDEX idx_job_requests_status ON public.job_requests USING btree (status);

-- Table Triggers

create trigger update_job_requests_updated_at before
update
    on
    public.job_requests for each row execute function update_updated_at_column();


-- public.processed_job_requests definition

-- Drop table

-- DROP TABLE public.processed_job_requests;

CREATE TABLE public.processed_job_requests ( id int4 NOT NULL, company_id uuid NULL, job_title text NOT NULL, work_arrangement public."work_arrangement_enum" NULL, salary_min int4 NULL, salary_max int4 NULL, job_description text NOT NULL, requirements _text DEFAULT '{}'::text[] NULL, responsibilities _text DEFAULT '{}'::text[] NULL, benefits _text DEFAULT '{}'::text[] NULL, skills _text DEFAULT '{}'::text[] NULL, experience_level public."experience_level_enum" NULL, application_deadline date NULL, industry text NULL, department text NULL, work_type text DEFAULT 'full-time'::text NOT NULL, currency text DEFAULT 'PHP'::text NOT NULL, salary_type text DEFAULT 'monthly'::text NOT NULL, status public."job_status_enum" DEFAULT 'active'::job_status_enum NOT NULL, "views" int4 DEFAULT 0 NOT NULL, applicants int4 DEFAULT 0 NOT NULL, created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL, priority public."priority_enum" DEFAULT 'medium'::priority_enum NOT NULL, CONSTRAINT processed_job_requests_pkey PRIMARY KEY (id), CONSTRAINT processed_job_requests_salary_max_check CHECK (((salary_max IS NULL) OR (salary_max >= 0))), CONSTRAINT processed_job_requests_salary_min_check CHECK (((salary_min IS NULL) OR (salary_min >= 0))), CONSTRAINT processed_job_requests_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.members(company_id) ON DELETE SET NULL, CONSTRAINT processed_job_requests_id_fkey FOREIGN KEY (id) REFERENCES public.job_requests(id) ON DELETE CASCADE);
CREATE INDEX idx_processed_job_requests_company_id ON public.processed_job_requests USING btree (company_id);
CREATE INDEX idx_processed_job_requests_created_at ON public.processed_job_requests USING btree (created_at);
CREATE INDEX idx_processed_job_requests_status ON public.processed_job_requests USING btree (status);

-- Table Triggers

create trigger update_processed_job_requests_updated_at before
update
    on
    public.processed_job_requests for each row execute function update_updated_at_column();


-- public.resumes_extracted definition

-- Drop table

-- DROP TABLE public.resumes_extracted;

CREATE TABLE public.resumes_extracted ( id uuid DEFAULT gen_random_uuid() NOT NULL, user_id uuid NOT NULL, resume_data jsonb NOT NULL, original_filename text NULL, created_at timestamp DEFAULT now() NULL, updated_at timestamp DEFAULT now() NULL, CONSTRAINT resumes_extracted_pkey PRIMARY KEY (id), CONSTRAINT resumes_extracted_user_id_unique UNIQUE (user_id), CONSTRAINT resumes_extracted_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE);
CREATE INDEX idx_resumes_extracted_created_at ON public.resumes_extracted USING btree (created_at);

-- Table Triggers

create trigger update_resumes_extracted_updated_at before
update
    on
    public.resumes_extracted for each row execute function update_updated_at_column();


-- public.resumes_generated definition

-- Drop table

-- DROP TABLE public.resumes_generated;

CREATE TABLE public.resumes_generated ( id uuid DEFAULT gen_random_uuid() NOT NULL, user_id uuid NOT NULL, original_resume_id uuid NULL, generated_resume_data jsonb NOT NULL, template_used text NULL, generation_metadata jsonb NULL, created_at timestamp DEFAULT now() NULL, updated_at timestamp DEFAULT now() NULL, CONSTRAINT resumes_generated_pkey PRIMARY KEY (id), CONSTRAINT resumes_generated_user_id_unique UNIQUE (user_id), CONSTRAINT resumes_generated_original_resume_id_fkey FOREIGN KEY (original_resume_id) REFERENCES public.resumes_extracted(id) ON DELETE SET NULL, CONSTRAINT resumes_generated_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE);
CREATE INDEX idx_resumes_generated_original_resume_id ON public.resumes_generated USING btree (original_resume_id);

-- Table Triggers

create trigger update_resumes_generated_updated_at before
update
    on
    public.resumes_generated for each row execute function update_updated_at_column();


-- public.saved_resumes definition

-- Drop table

-- DROP TABLE public.saved_resumes;

CREATE TABLE public.saved_resumes ( id uuid DEFAULT gen_random_uuid() NOT NULL, user_id uuid NOT NULL, resume_slug text NOT NULL, resume_title text NOT NULL, resume_data jsonb NOT NULL, template_used text NOT NULL, is_public bool DEFAULT true NULL, view_count int4 DEFAULT 0 NULL, created_at timestamp DEFAULT now() NULL, updated_at timestamp DEFAULT now() NULL, original_resume_id uuid NULL, CONSTRAINT saved_resumes_pkey PRIMARY KEY (id), CONSTRAINT saved_resumes_resume_slug_key UNIQUE (resume_slug), CONSTRAINT saved_resumes_original_resume_id_fkey FOREIGN KEY (original_resume_id) REFERENCES public.resumes_generated(id) ON DELETE SET NULL, CONSTRAINT saved_resumes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE);
CREATE INDEX idx_saved_resumes_original_resume_id ON public.saved_resumes USING btree (original_resume_id);
CREATE INDEX idx_saved_resumes_public ON public.saved_resumes USING btree (is_public);

-- Column comments

COMMENT ON COLUMN public.saved_resumes.original_resume_id IS 'References the resumes_generated table to track which AI-generated resume was used to create this saved resume';

-- Table Triggers

create trigger update_saved_resumes_updated_at before
update
    on
    public.saved_resumes for each row execute function update_updated_at_column();


-- public.typing_hero_sessions definition

-- Drop table

-- DROP TABLE public.typing_hero_sessions;

CREATE TABLE public.typing_hero_sessions ( id uuid DEFAULT gen_random_uuid() NOT NULL, user_id uuid NOT NULL, started_at timestamptz DEFAULT now() NULL, finished_at timestamptz NULL, duration_ms int4 NULL, difficulty public."game_difficulty_enum" NULL, "level" text NULL, wpm int4 NULL, accuracy numeric(5, 2) NULL, keypresses int4 NULL, mistakes int4 NULL, error_breakdown jsonb DEFAULT '{}'::jsonb NOT NULL, created_at timestamptz DEFAULT now() NULL, updated_at timestamptz DEFAULT now() NULL, CONSTRAINT typing_hero_sessions_accuracy_check CHECK (((accuracy IS NULL) OR ((accuracy >= (0)::numeric) AND (accuracy <= (100)::numeric)))), CONSTRAINT typing_hero_sessions_duration_ms_check CHECK (((duration_ms IS NULL) OR (duration_ms >= 0))), CONSTRAINT typing_hero_sessions_keypresses_check CHECK (((keypresses IS NULL) OR (keypresses >= 0))), CONSTRAINT typing_hero_sessions_mistakes_check CHECK (((mistakes IS NULL) OR (mistakes >= 0))), CONSTRAINT typing_hero_sessions_pkey PRIMARY KEY (id), CONSTRAINT typing_hero_sessions_wpm_check CHECK (((wpm IS NULL) OR (wpm >= 0))), CONSTRAINT typing_hero_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE);
CREATE INDEX idx_typing_hero_sessions_started ON public.typing_hero_sessions USING btree (started_at);
CREATE INDEX idx_typing_hero_sessions_user ON public.typing_hero_sessions USING btree (user_id);

-- Table Triggers

create trigger update_typing_hero_sessions_updated_at before
update
    on
    public.typing_hero_sessions for each row execute function update_updated_at_column();


-- public.typing_hero_stats definition

-- Drop table

-- DROP TABLE public.typing_hero_stats;

CREATE TABLE public.typing_hero_stats ( id uuid DEFAULT gen_random_uuid() NOT NULL, user_id uuid NOT NULL, total_sessions int4 DEFAULT 0 NOT NULL, completed_sessions int4 DEFAULT 0 NOT NULL, last_played_at timestamptz NULL, best_wpm int4 NULL, best_accuracy numeric(5, 2) NULL, median_wpm numeric(6, 2) NULL, recent_wpm int4 NULL, highest_difficulty public."game_difficulty_enum" NULL, consistency_index numeric(6, 3) NULL, percentile numeric(5, 2) NULL, created_at timestamptz DEFAULT now() NULL, updated_at timestamptz DEFAULT now() NULL, CONSTRAINT typing_hero_stats_best_accuracy_check CHECK (((best_accuracy IS NULL) OR ((best_accuracy >= (0)::numeric) AND (best_accuracy <= (100)::numeric)))), CONSTRAINT typing_hero_stats_percentile_check CHECK (((percentile IS NULL) OR ((percentile >= (0)::numeric) AND (percentile <= (100)::numeric)))), CONSTRAINT typing_hero_stats_pkey PRIMARY KEY (id), CONSTRAINT typing_hero_stats_user_id_key UNIQUE (user_id), CONSTRAINT typing_hero_stats_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE);
CREATE INDEX idx_typing_hero_stats_user ON public.typing_hero_stats USING btree (user_id);

-- Table Triggers

create trigger update_typing_hero_stats_updated_at before
update
    on
    public.typing_hero_stats for each row execute function update_updated_at_column();


-- public.ultimate_sessions definition

-- Drop table

-- DROP TABLE public.ultimate_sessions;

CREATE TABLE public.ultimate_sessions ( id uuid DEFAULT gen_random_uuid() NOT NULL, user_id uuid NOT NULL, started_at timestamptz DEFAULT now() NULL, finished_at timestamptz NULL, duration_ms int4 NULL, smart int4 NULL, motivated int4 NULL, "integrity" int4 NULL, business int4 NULL, platinum_choices int4 NULL, gold_choices int4 NULL, bronze_choices int4 NULL, nightmare_choices int4 NULL, created_at timestamptz DEFAULT now() NULL, updated_at timestamptz DEFAULT now() NULL, tier text NULL, tier_recommendation text NULL, client_value text NULL, team_morale int4 NULL, client_trust int4 NULL, business_impact int4 NULL, crisis_pressure int4 NULL, key_strengths jsonb NULL, development_areas jsonb NULL, player_name text NULL, avatar text NULL, CONSTRAINT ultimate_sessions_pkey PRIMARY KEY (id), CONSTRAINT ultimate_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE);
CREATE INDEX idx_ultimate_sessions_started ON public.ultimate_sessions USING btree (started_at);
CREATE INDEX idx_ultimate_sessions_user ON public.ultimate_sessions USING btree (user_id);

-- Table Triggers

create trigger update_ultimate_sessions_updated_at before
update
    on
    public.ultimate_sessions for each row execute function update_updated_at_column();


-- public.ultimate_stats definition

-- Drop table

-- DROP TABLE public.ultimate_stats;

CREATE TABLE public.ultimate_stats ( id uuid DEFAULT gen_random_uuid() NOT NULL, user_id uuid NOT NULL, total_sessions int4 DEFAULT 0 NOT NULL, last_taken_at timestamptz NULL, smart int4 NULL, motivated int4 NULL, "integrity" int4 NULL, business int4 NULL, platinum_choices int4 NULL, gold_choices int4 NULL, bronze_choices int4 NULL, nightmare_choices int4 NULL, created_at timestamptz DEFAULT now() NULL, updated_at timestamptz DEFAULT now() NULL, last_tier text NULL, last_recommendation text NULL, last_client_value text NULL, latest_competencies jsonb NULL, key_strengths jsonb NULL, development_areas jsonb NULL, CONSTRAINT ultimate_stats_pkey PRIMARY KEY (id), CONSTRAINT ultimate_stats_user_id_key UNIQUE (user_id), CONSTRAINT ultimate_stats_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE);
CREATE INDEX idx_ultimate_stats_user ON public.ultimate_stats USING btree (user_id);

-- Table Triggers

create trigger update_ultimate_stats_updated_at before
update
    on
    public.ultimate_stats for each row execute function update_updated_at_column();


-- public.ai_analysis_results definition

-- Drop table

-- DROP TABLE public.ai_analysis_results;

CREATE TABLE public.ai_analysis_results ( id uuid DEFAULT gen_random_uuid() NOT NULL, user_id uuid NOT NULL, session_id text NOT NULL, original_resume_id uuid NULL, overall_score int4 NOT NULL, ats_compatibility_score int4 NOT NULL, content_quality_score int4 NOT NULL, professional_presentation_score int4 NOT NULL, skills_alignment_score int4 NOT NULL, key_strengths jsonb NOT NULL, strengths_analysis jsonb NOT NULL, improvements jsonb NOT NULL, recommendations jsonb NOT NULL, improved_summary text NOT NULL, salary_analysis jsonb NOT NULL, career_path jsonb NOT NULL, section_analysis jsonb NOT NULL, analysis_metadata jsonb NULL, portfolio_links jsonb NULL, files_analyzed jsonb NULL, created_at timestamp DEFAULT now() NULL, updated_at timestamp DEFAULT now() NULL, candidate_profile jsonb NULL, skills_snapshot jsonb NULL, experience_snapshot jsonb NULL, education_snapshot jsonb NULL, CONSTRAINT ai_analysis_results_ats_compatibility_score_check CHECK (((ats_compatibility_score >= 0) AND (ats_compatibility_score <= 100))), CONSTRAINT ai_analysis_results_content_quality_score_check CHECK (((content_quality_score >= 0) AND (content_quality_score <= 100))), CONSTRAINT ai_analysis_results_overall_score_check CHECK (((overall_score >= 0) AND (overall_score <= 100))), CONSTRAINT ai_analysis_results_pkey PRIMARY KEY (id), CONSTRAINT ai_analysis_results_professional_presentation_score_check CHECK (((professional_presentation_score >= 0) AND (professional_presentation_score <= 100))), CONSTRAINT ai_analysis_results_skills_alignment_score_check CHECK (((skills_alignment_score >= 0) AND (skills_alignment_score <= 100))), CONSTRAINT ai_analysis_results_user_id_key UNIQUE (user_id), CONSTRAINT ai_analysis_results_original_resume_id_fkey FOREIGN KEY (original_resume_id) REFERENCES public.resumes_extracted(id) ON DELETE SET NULL, CONSTRAINT ai_analysis_results_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE);
CREATE INDEX idx_ai_analysis_results_created_at ON public.ai_analysis_results USING btree (created_at);
CREATE INDEX idx_ai_analysis_results_original_resume_id ON public.ai_analysis_results USING btree (original_resume_id);
CREATE INDEX idx_ai_analysis_results_overall_score ON public.ai_analysis_results USING btree (overall_score);
CREATE INDEX idx_ai_analysis_results_session_id ON public.ai_analysis_results USING btree (session_id);
CREATE INDEX idx_ai_analysis_results_user_id ON public.ai_analysis_results USING btree (user_id);
COMMENT ON TABLE public.ai_analysis_results IS 'Stores comprehensive AI analysis results from resume processing';

-- Column comments

COMMENT ON COLUMN public.ai_analysis_results.overall_score IS 'Overall resume quality score (0-100)';
COMMENT ON COLUMN public.ai_analysis_results.key_strengths IS 'Array of key strengths identified by AI';
COMMENT ON COLUMN public.ai_analysis_results.strengths_analysis IS 'Detailed breakdown of strengths (core, technical, soft skills, achievements, market advantage)';
COMMENT ON COLUMN public.ai_analysis_results.improvements IS 'Array of specific improvement suggestions';
COMMENT ON COLUMN public.ai_analysis_results.recommendations IS 'Array of actionable recommendations';
COMMENT ON COLUMN public.ai_analysis_results.improved_summary IS 'AI-generated improved professional summary';
COMMENT ON COLUMN public.ai_analysis_results.salary_analysis IS 'Complete salary analysis including level, range, factors, and negotiation tips';
COMMENT ON COLUMN public.ai_analysis_results.career_path IS 'Career path analysis including current position, next steps, skill gaps, and timeline';
COMMENT ON COLUMN public.ai_analysis_results.section_analysis IS 'Detailed analysis of each resume section (contact, summary, experience, education, skills)';
COMMENT ON COLUMN public.ai_analysis_results.analysis_metadata IS 'Additional metadata about the analysis process';
COMMENT ON COLUMN public.ai_analysis_results.portfolio_links IS 'Portfolio links that were considered in the analysis';
COMMENT ON COLUMN public.ai_analysis_results.files_analyzed IS 'Information about the files that were analyzed';

-- Table Triggers

create trigger update_ai_analysis_results_updated_at before
update
    on
    public.ai_analysis_results for each row execute function update_updated_at_column();


-- public.applications definition

-- Drop table

-- DROP TABLE public.applications;

CREATE TABLE public.applications ( id uuid DEFAULT gen_random_uuid() NOT NULL, user_id uuid NOT NULL, job_id int8 NOT NULL, resume_id uuid NOT NULL, resume_slug text NOT NULL, status public."application_status_enum" DEFAULT 'submitted'::application_status_enum NOT NULL, created_at timestamptz DEFAULT now() NOT NULL, CONSTRAINT applications_pkey PRIMARY KEY (id), CONSTRAINT applications_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.processed_job_requests(id) ON DELETE CASCADE, CONSTRAINT applications_resume_id_fkey FOREIGN KEY (resume_id) REFERENCES public.saved_resumes(id) ON DELETE RESTRICT, CONSTRAINT applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE);
CREATE INDEX applications_job_idx ON public.applications USING btree (job_id);
CREATE INDEX applications_status_idx ON public.applications USING btree (status);
CREATE INDEX applications_user_idx ON public.applications USING btree (user_id);
CREATE UNIQUE INDEX applications_user_job_uidx ON public.applications USING btree (user_id, job_id);

-- Table Triggers

create trigger applications_after_insert_inc_applicants after
insert
    on
    public.applications for each row execute function applications__inc_job_applicants();


-- public.job_request_comments definition

-- Drop table

-- DROP TABLE public.job_request_comments;

CREATE TABLE public.job_request_comments ( id serial4 NOT NULL, job_request_id int4 NOT NULL, user_id uuid NOT NULL, "comment" text NOT NULL, created_at timestamp DEFAULT now() NOT NULL, CONSTRAINT job_request_comments_pkey PRIMARY KEY (id), CONSTRAINT job_request_comments_job_request_id_fkey FOREIGN KEY (job_request_id) REFERENCES public.job_requests(id) ON DELETE CASCADE);
CREATE INDEX idx_job_request_comments_job_request_id ON public.job_request_comments USING btree (job_request_id);


-- public.v_disc_latest_session source

CREATE OR REPLACE VIEW public.v_disc_latest_session
AS SELECT DISTINCT ON (user_id) user_id,
    id AS session_id,
    started_at,
    finished_at,
    d,
    i,
    s,
    c,
    primary_style,
    secondary_style,
    consistency_index,
    strengths,
    blind_spots,
    preferred_env
   FROM disc_personality_sessions
  ORDER BY user_id, started_at DESC;



-- DROP FUNCTION public.applications__inc_job_applicants();

CREATE OR REPLACE FUNCTION public.applications__inc_job_applicants()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Only increment when a brand-new application row is inserted
  UPDATE processed_job_requests
     SET applicants = COALESCE(applicants, 0) + 1
   WHERE id = NEW.job_id;
  RETURN NEW;
END;
$function$
;

-- DROP FUNCTION public.armor(bytea, _text, _text);

CREATE OR REPLACE FUNCTION public.armor(bytea, text[], text[])
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_armor$function$
;

-- DROP FUNCTION public.armor(bytea);

CREATE OR REPLACE FUNCTION public.armor(bytea)
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_armor$function$
;

-- DROP FUNCTION public.crypt(text, text);

CREATE OR REPLACE FUNCTION public.crypt(text, text)
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_crypt$function$
;

-- DROP FUNCTION public.dearmor(text);

CREATE OR REPLACE FUNCTION public.dearmor(text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_dearmor$function$
;

-- DROP FUNCTION public.decrypt(bytea, bytea, text);

CREATE OR REPLACE FUNCTION public.decrypt(bytea, bytea, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_decrypt$function$
;

-- DROP FUNCTION public.decrypt_iv(bytea, bytea, bytea, text);

CREATE OR REPLACE FUNCTION public.decrypt_iv(bytea, bytea, bytea, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_decrypt_iv$function$
;

-- DROP FUNCTION public.digest(text, text);

CREATE OR REPLACE FUNCTION public.digest(text, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_digest$function$
;

-- DROP FUNCTION public.digest(bytea, text);

CREATE OR REPLACE FUNCTION public.digest(bytea, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_digest$function$
;

-- DROP FUNCTION public.encrypt(bytea, bytea, text);

CREATE OR REPLACE FUNCTION public.encrypt(bytea, bytea, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_encrypt$function$
;

-- DROP FUNCTION public.encrypt_iv(bytea, bytea, bytea, text);

CREATE OR REPLACE FUNCTION public.encrypt_iv(bytea, bytea, bytea, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_encrypt_iv$function$
;

-- DROP FUNCTION public.gen_random_bytes(int4);

CREATE OR REPLACE FUNCTION public.gen_random_bytes(integer)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_random_bytes$function$
;

-- DROP FUNCTION public.gen_random_uuid();

CREATE OR REPLACE FUNCTION public.gen_random_uuid()
 RETURNS uuid
 LANGUAGE c
 PARALLEL SAFE
AS '$libdir/pgcrypto', $function$pg_random_uuid$function$
;

-- DROP FUNCTION public.gen_salt(text, int4);

CREATE OR REPLACE FUNCTION public.gen_salt(text, integer)
 RETURNS text
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_gen_salt_rounds$function$
;

-- DROP FUNCTION public.gen_salt(text);

CREATE OR REPLACE FUNCTION public.gen_salt(text)
 RETURNS text
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_gen_salt$function$
;

-- DROP FUNCTION public.hmac(text, text, text);

CREATE OR REPLACE FUNCTION public.hmac(text, text, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_hmac$function$
;

-- DROP FUNCTION public.hmac(bytea, bytea, text);

CREATE OR REPLACE FUNCTION public.hmac(bytea, bytea, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pg_hmac$function$
;

-- DROP FUNCTION public.pgp_armor_headers(in text, out text, out text);

CREATE OR REPLACE FUNCTION public.pgp_armor_headers(text, OUT key text, OUT value text)
 RETURNS SETOF record
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_armor_headers$function$
;

-- DROP FUNCTION public.pgp_key_id(bytea);

CREATE OR REPLACE FUNCTION public.pgp_key_id(bytea)
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_key_id_w$function$
;

-- DROP FUNCTION public.pgp_pub_decrypt(bytea, bytea, text, text);

CREATE OR REPLACE FUNCTION public.pgp_pub_decrypt(bytea, bytea, text, text)
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_decrypt_text$function$
;

-- DROP FUNCTION public.pgp_pub_decrypt(bytea, bytea);

CREATE OR REPLACE FUNCTION public.pgp_pub_decrypt(bytea, bytea)
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_decrypt_text$function$
;

-- DROP FUNCTION public.pgp_pub_decrypt(bytea, bytea, text);

CREATE OR REPLACE FUNCTION public.pgp_pub_decrypt(bytea, bytea, text)
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_decrypt_text$function$
;

-- DROP FUNCTION public.pgp_pub_decrypt_bytea(bytea, bytea);

CREATE OR REPLACE FUNCTION public.pgp_pub_decrypt_bytea(bytea, bytea)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_decrypt_bytea$function$
;

-- DROP FUNCTION public.pgp_pub_decrypt_bytea(bytea, bytea, text);

CREATE OR REPLACE FUNCTION public.pgp_pub_decrypt_bytea(bytea, bytea, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_decrypt_bytea$function$
;

-- DROP FUNCTION public.pgp_pub_decrypt_bytea(bytea, bytea, text, text);

CREATE OR REPLACE FUNCTION public.pgp_pub_decrypt_bytea(bytea, bytea, text, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_decrypt_bytea$function$
;

-- DROP FUNCTION public.pgp_pub_encrypt(text, bytea);

CREATE OR REPLACE FUNCTION public.pgp_pub_encrypt(text, bytea)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_encrypt_text$function$
;

-- DROP FUNCTION public.pgp_pub_encrypt(text, bytea, text);

CREATE OR REPLACE FUNCTION public.pgp_pub_encrypt(text, bytea, text)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_encrypt_text$function$
;

-- DROP FUNCTION public.pgp_pub_encrypt_bytea(bytea, bytea, text);

CREATE OR REPLACE FUNCTION public.pgp_pub_encrypt_bytea(bytea, bytea, text)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_encrypt_bytea$function$
;

-- DROP FUNCTION public.pgp_pub_encrypt_bytea(bytea, bytea);

CREATE OR REPLACE FUNCTION public.pgp_pub_encrypt_bytea(bytea, bytea)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_pub_encrypt_bytea$function$
;

-- DROP FUNCTION public.pgp_sym_decrypt(bytea, text, text);

CREATE OR REPLACE FUNCTION public.pgp_sym_decrypt(bytea, text, text)
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_sym_decrypt_text$function$
;

-- DROP FUNCTION public.pgp_sym_decrypt(bytea, text);

CREATE OR REPLACE FUNCTION public.pgp_sym_decrypt(bytea, text)
 RETURNS text
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_sym_decrypt_text$function$
;

-- DROP FUNCTION public.pgp_sym_decrypt_bytea(bytea, text);

CREATE OR REPLACE FUNCTION public.pgp_sym_decrypt_bytea(bytea, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_sym_decrypt_bytea$function$
;

-- DROP FUNCTION public.pgp_sym_decrypt_bytea(bytea, text, text);

CREATE OR REPLACE FUNCTION public.pgp_sym_decrypt_bytea(bytea, text, text)
 RETURNS bytea
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_sym_decrypt_bytea$function$
;

-- DROP FUNCTION public.pgp_sym_encrypt(text, text, text);

CREATE OR REPLACE FUNCTION public.pgp_sym_encrypt(text, text, text)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_sym_encrypt_text$function$
;

-- DROP FUNCTION public.pgp_sym_encrypt(text, text);

CREATE OR REPLACE FUNCTION public.pgp_sym_encrypt(text, text)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_sym_encrypt_text$function$
;

-- DROP FUNCTION public.pgp_sym_encrypt_bytea(bytea, text, text);

CREATE OR REPLACE FUNCTION public.pgp_sym_encrypt_bytea(bytea, text, text)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_sym_encrypt_bytea$function$
;

-- DROP FUNCTION public.pgp_sym_encrypt_bytea(bytea, text);

CREATE OR REPLACE FUNCTION public.pgp_sym_encrypt_bytea(bytea, text)
 RETURNS bytea
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/pgcrypto', $function$pgp_sym_encrypt_bytea$function$
;

-- DROP FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;