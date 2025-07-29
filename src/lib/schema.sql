-- Railway PostgreSQL Database Schema for Tickets System

-- Create ticket category enum
CREATE TYPE public.ticket_category_enum AS ENUM (
  'Computer & Equipment',
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
  updated_at TIMESTAMP DEFAULT (now() AT TIME ZONE 'Asia/Manila'::text) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON public.tickets(category);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON public.tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_id ON public.tickets(ticket_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status_position ON public.tickets(status, position);

-- Insert sample data with correct enum values
INSERT INTO public.tickets (ticket_id, user_id, concern, details, category, status) VALUES
('TKT-000001', 1, 'Computer not turning on', 'Desktop computer shows no power indicator when switched on', 'Computer & Equipment', 'On Hold'),
('TKT-000002', 2, 'Station chair broken', 'Office chair at station 5 has loose backrest', 'Station', 'In Progress'),
('TKT-000003', 3, 'Air conditioning too cold', 'AC temperature needs adjustment in main office area', 'Surroundings', 'For Approval'),
('TKT-000004', 4, 'Schedule change request', 'Need to adjust shift schedule for next week', 'Schedule', 'For Approval'),
('TKT-000005', 5, 'Overtime compensation query', 'Inquiry about overtime pay calculation', 'Compensation', 'Completed'),
('TKT-000006', 6, 'Transportation allowance', 'Request for transport allowance documentation', 'Transport', 'In Progress'),
('TKT-000007', 7, 'New software suggestion', 'Proposal to implement new project management tool', 'Suggestion', 'Approved'),
('TKT-000008', 8, 'Check-in system issue', 'Unable to check-in using the biometric system', 'Check-in', 'Approved');

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