-- Create function to generate ticket_id using existing sequence
CREATE OR REPLACE FUNCTION generate_ticket_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ticket_id := 'TKT-' || LPAD(nextval('ticket_id_seq')::text, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate ticket_id before insert
CREATE TRIGGER auto_generate_ticket_id
  BEFORE INSERT ON tickets
  FOR EACH ROW
  WHEN (NEW.ticket_id IS NULL OR NEW.ticket_id = '')
  EXECUTE FUNCTION generate_ticket_id(); 