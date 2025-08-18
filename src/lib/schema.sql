-- Railway PostgreSQL Database Schema for Tickets System

-- Create ticket category enum
CREATE TYPE public.ticket_category_enum AS ENUM (
  'Computer & Equipment',
  'Network & Internet',
  'Station',
  'Surroundings',
  'Schedule',
  'Compensation',
  'Transport',
  'Suggestion',
  'Check-in'
);

-- Create ticket status enum
CREATE TYPE public.ticket_status_enum AS ENUM (
  'For Approval',
  'On Hold',
  'In Progress',
  'Approved',
  'Completed'
);

-- Create tickets table matching the actual DDL
CREATE TABLE IF NOT EXISTS public.tickets (
  id SERIAL PRIMARY KEY,
  ticket_id VARCHAR(50) NOT NULL UNIQUE,
  user_id INTEGER NOT NULL,
  concern TEXT NOT NULL,
  details TEXT NULL,
  category public.ticket_category_enum NOT NULL,
  status public.ticket_status_enum DEFAULT 'For Approval'::ticket_status_enum NOT NULL,
  position INTEGER DEFAULT 0,
  resolved_by INTEGER NULL,
  resolved_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT (now() AT TIME ZONE 'Asia/Manila'::text) NOT NULL,
  updated_at TIMESTAMP DEFAULT (now() AT TIME ZONE 'Asia/Manila'::text) NOT NULL,
  sector VARCHAR(100) DEFAULT 'General'::character varying NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON public.tickets(category);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON public.tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_id ON public.tickets(ticket_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status_position ON public.tickets(status, position);
CREATE INDEX IF NOT EXISTS idx_tickets_sector ON public.tickets(sector);

-- Insert sample data with correct enum values
INSERT INTO public.tickets (ticket_id, user_id, concern, details, category, status, sector) VALUES
('TKT-000001', 1, 'Computer not turning on', 'Desktop computer shows no power indicator when switched on', 'Computer & Equipment', 'On Hold', 'IT'),
('TKT-000002', 2, 'Station chair broken', 'Office chair at station 5 has loose backrest', 'Station', 'In Progress', 'Facilities'),
('TKT-000003', 3, 'Air conditioning too cold', 'AC temperature needs adjustment in main office area', 'Surroundings', 'For Approval', 'Facilities'),
('TKT-000004', 4, 'Schedule change request', 'Need to adjust shift schedule for next week', 'Schedule', 'For Approval', 'HR'),
('TKT-000005', 5, 'Overtime compensation query', 'Inquiry about overtime pay calculation', 'Compensation', 'Completed', 'HR'),
('TKT-000006', 6, 'Transportation allowance', 'Request for transport allowance documentation', 'Transport', 'In Progress', 'HR'),
('TKT-000007', 7, 'New software suggestion', 'Proposal to implement new project management tool', 'Suggestion', 'Approved', 'IT'),
('TKT-000008', 8, 'Check-in system issue', 'Unable to check-in using the biometric system', 'Check-in', 'Approved', 'IT'),
('TKT-000009', 9, 'WiFi connection slow', 'Internet speed is very slow in the east wing', 'Network & Internet', 'In Progress', 'IT');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = (now() AT TIME ZONE 'Asia/Manila'::text);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_tickets_updated_at 
    BEFORE UPDATE ON public.tickets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create stations table
CREATE TABLE IF NOT EXISTS public.stations (
  id SERIAL PRIMARY KEY,
  station_id VARCHAR(50) NOT NULL UNIQUE,
  assigned_user_id INTEGER NULL,
  asset_id VARCHAR(50) NULL,
  floor_plan_id INTEGER NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NULL
);

-- Create trigger to automatically update updated_at for stations
CREATE TRIGGER update_stations_updated_at 
    BEFORE UPDATE ON public.stations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample stations
INSERT INTO public.stations (station_id, assigned_user_id) VALUES
('STN-001', 1),
('STN-002', 2),
('STN-003', 3),
('STN-004', 4),
('STN-005', 5),
('STN-006', NULL),
('STN-007', NULL),
('STN-008', NULL);

-- Insert sample ticket categories
INSERT INTO public.ticket_categories (name) VALUES
('Computer & Equipment'),
('Network & Internet'),
('Station'),
('Surroundings'),
('Schedule'),
('Compensation'),
('Transport'),
('Suggestion'),
('Check-in');

-- Create notification functions for real-time updates
CREATE OR REPLACE FUNCTION notify_ticket_change()
RETURNS TRIGGER AS $$
DECLARE
    notification JSON;
BEGIN
    -- Only send notifications for meaningful changes, not timestamp updates
    IF TG_OP = 'UPDATE' THEN
        -- Check if any meaningful fields changed (excluding updated_at)
        IF (OLD.status IS DISTINCT FROM NEW.status) OR
           (OLD.position IS DISTINCT FROM NEW.position) OR
           (OLD.resolved_by IS DISTINCT FROM NEW.resolved_by) OR
           (OLD.resolved_at IS DISTINCT FROM NEW.resolved_at) OR
           (OLD.role_id IS DISTINCT FROM NEW.role_id) OR
           (OLD.concern IS DISTINCT FROM NEW.concern) OR
           (OLD.details IS DISTINCT FROM NEW.details) OR
           (OLD.category_id IS DISTINCT FROM NEW.category_id) OR
           (OLD.supporting_files IS DISTINCT FROM NEW.supporting_files) OR
           (OLD.file_count IS DISTINCT FROM NEW.file_count) THEN
            
            -- Create notification payload
            notification = json_build_object(
                'table', TG_TABLE_NAME,
                'action', TG_OP,
                'record', row_to_json(NEW),
                'old_record', row_to_json(OLD),
                'timestamp', now()
            );
            
            -- Send notification
            PERFORM pg_notify('ticket_changes', notification::text);
        END IF;
    ELSE
        -- For INSERT and DELETE, always send notification
        notification = json_build_object(
            'table', TG_TABLE_NAME,
            'action', TG_OP,
            'record', CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE row_to_json(NEW) END,
            'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
            'timestamp', now()
        );
        
        -- Send notification
        PERFORM pg_notify('ticket_changes', notification::text);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT operations
CREATE TRIGGER notify_ticket_insert
    AFTER INSERT ON public.tickets
    FOR EACH ROW
    EXECUTE FUNCTION notify_ticket_change();

-- Create trigger for UPDATE operations
CREATE TRIGGER notify_ticket_update
    AFTER UPDATE ON public.tickets
    FOR EACH ROW
    EXECUTE FUNCTION notify_ticket_change();

-- Create trigger for DELETE operations
CREATE TRIGGER notify_ticket_delete
    AFTER DELETE ON public.tickets
    FOR EACH ROW
    EXECUTE FUNCTION notify_ticket_change();