-- Create member_comments table for storing comments on companies/members
CREATE TABLE IF NOT EXISTS member_comments (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_member_comments_member_id ON member_comments(member_id);
CREATE INDEX IF NOT EXISTS idx_member_comments_user_id ON member_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_member_comments_created_at ON member_comments(created_at);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_member_comments_updated_at 
    BEFORE UPDATE ON member_comments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data (optional)
-- INSERT INTO member_comments (member_id, user_id, comment) VALUES 
-- (1, 1, 'This is a sample comment on the first company'),
-- (1, 2, 'Another sample comment from a different user');
