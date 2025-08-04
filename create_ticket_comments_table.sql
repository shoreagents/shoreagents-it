-- Create ticket_comments table
CREATE TABLE public.ticket_comments (
    id serial4 NOT NULL,
    ticket_id int4 NOT NULL,
    user_id int4 NOT NULL,
    comment text NOT NULL,
    created_at timestamp DEFAULT (now() AT TIME ZONE 'Asia/Manila'::text) NOT NULL,
    updated_at timestamp DEFAULT (now() AT TIME ZONE 'Asia/Manila'::text) NOT NULL,
    CONSTRAINT ticket_comments_pkey PRIMARY KEY (id),
    CONSTRAINT ticket_comments_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE CASCADE,
    CONSTRAINT ticket_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create trigger to update updated_at column
CREATE TRIGGER update_ticket_comments_updated_at 
    BEFORE UPDATE ON public.ticket_comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_ticket_comments_ticket_id ON public.ticket_comments(ticket_id);
CREATE INDEX idx_ticket_comments_created_at ON public.ticket_comments(created_at); 