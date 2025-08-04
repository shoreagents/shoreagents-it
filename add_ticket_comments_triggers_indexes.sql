-- Add trigger to update updated_at column
CREATE TRIGGER update_ticket_comments_updated_at 
    BEFORE UPDATE ON public.ticket_comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_ticket_comments_ticket_id ON public.ticket_comments(ticket_id);
CREATE INDEX idx_ticket_comments_created_at ON public.ticket_comments(created_at);
CREATE INDEX idx_ticket_comments_user_id ON public.ticket_comments(user_id); 