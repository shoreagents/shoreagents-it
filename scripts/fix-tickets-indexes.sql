-- Fix problematic indexes in tickets table
-- Drop the problematic indexes first
DROP INDEX IF EXISTS idx_tickets_clear_status;
DROP INDEX IF EXISTS idx_tickets_closed_clear;
DROP INDEX IF EXISTS idx_tickets_status_clear;

-- Recreate them with correct syntax
CREATE INDEX idx_tickets_clear_status ON public.tickets USING btree (clear, status);
CREATE INDEX idx_tickets_closed_clear ON public.tickets USING btree (resolved_at, clear) WHERE (status = 'Closed'::ticket_status_enum);
CREATE INDEX idx_tickets_status_clear ON public.tickets USING btree (status, clear);
