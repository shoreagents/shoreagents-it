-- Add clear column to tickets table
-- This column will hide closed tickets when set to true

-- Add the clear column
ALTER TABLE public.tickets ADD COLUMN clear boolean DEFAULT false;

-- Update existing closed tickets to set clear = false (so they remain visible)
UPDATE public.tickets SET clear = false WHERE status = 'Closed';

-- Create index for better performance
CREATE INDEX idx_tickets_clear_status ON public.tickets(clear, status);


