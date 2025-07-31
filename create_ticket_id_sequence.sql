-- Create sequence for auto-generating ticket_id
CREATE SEQUENCE IF NOT EXISTS ticket_id_seq START 1;

-- Optional: Set the sequence to start from the current max ticket_id if you have existing data
-- This is only needed if you have existing tickets and want to continue from where you left off
-- SELECT setval('ticket_id_seq', (SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_id FROM 5) AS INTEGER)), 0) + 1) FROM tickets; 