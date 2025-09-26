# Leads Database Schema

This document describes the database schema for the Leads feature using a new Supabase database.

## Environment Variables

Add these environment variables to your `.env.local` file:

```env
# Leads Supabase Configuration
NEXT_PUBLIC_LEADS_SUPABASE_URL=your_leads_supabase_url
NEXT_PUBLIC_LEADS_SUPABASE_ANON_KEY=your_leads_supabase_anon_key
LEADS_SUPABASE_SERVICE_ROLE_KEY=your_leads_supabase_service_role_key
```

## Database Schema

### Leads Table

```sql
-- Create the leads table
CREATE TABLE leads (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  company VARCHAR(255),
  phone VARCHAR(50),
  status VARCHAR(50) NOT NULL DEFAULT 'New',
  source VARCHAR(255),
  notes TEXT,
  priority VARCHAR(20) NOT NULL DEFAULT 'Medium',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_leads_priority ON leads(priority);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_leads_updated_at 
    BEFORE UPDATE ON leads 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add constraints
ALTER TABLE leads ADD CONSTRAINT chk_status 
  CHECK (status IN ('New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'));

ALTER TABLE leads ADD CONSTRAINT chk_priority 
  CHECK (priority IN ('Low', 'Medium', 'High'));

-- Enable Row Level Security (RLS)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your authentication needs)
-- For now, we'll allow all operations for authenticated users
-- You may want to restrict this based on your specific requirements

CREATE POLICY "Allow all operations for authenticated users" ON leads
  FOR ALL USING (auth.role() = 'authenticated');

-- If you want to allow anonymous access (for testing), uncomment the line below:
-- CREATE POLICY "Allow all operations for anonymous users" ON leads
--   FOR ALL USING (true);
```

## Storage Bucket (Optional)

If you want to store attachments for leads, create a storage bucket:

```sql
-- Create storage bucket for lead attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('leads', 'leads', true);

-- Create policy for the storage bucket
CREATE POLICY "Allow authenticated users to upload lead attachments" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'leads' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to view lead attachments" ON storage.objects
  FOR SELECT USING (bucket_id = 'leads' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update lead attachments" ON storage.objects
  FOR UPDATE USING (bucket_id = 'leads' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete lead attachments" ON storage.objects
  FOR DELETE USING (bucket_id = 'leads' AND auth.role() = 'authenticated');
```

## Sample Data (Optional)

```sql
-- Insert sample leads for testing
INSERT INTO leads (name, email, company, phone, status, source, notes, priority) VALUES
('John Smith', 'john.smith@example.com', 'Acme Corp', '+1-555-0123', 'New', 'Website', 'Interested in our premium package', 'High'),
('Jane Doe', 'jane.doe@techstart.com', 'TechStart Inc', '+1-555-0456', 'Contacted', 'Referral', 'Follow up next week', 'Medium'),
('Bob Johnson', 'bob.johnson@email.com', NULL, '+1-555-0789', 'Qualified', 'Cold Call', 'Very interested, needs proposal', 'High'),
('Alice Brown', 'alice.brown@company.com', 'Company LLC', '+1-555-0321', 'Proposal', 'Trade Show', 'Reviewing our proposal', 'Medium'),
('Charlie Wilson', 'charlie.wilson@email.com', 'Wilson Enterprises', '+1-555-0654', 'Negotiation', 'Website', 'Price negotiation in progress', 'High');
```

## Setup Instructions

1. **Create a new Supabase project** for the Leads feature
2. **Run the SQL schema** above in your Supabase SQL editor
3. **Add the environment variables** to your `.env.local` file
4. **Test the connection** by visiting `/admin/leads` in your application

## Features Included

- ✅ Complete CRUD operations for leads
- ✅ Status management (New, Contacted, Qualified, etc.)
- ✅ Priority levels (Low, Medium, High)
- ✅ Search and filtering
- ✅ Pagination
- ✅ Real-time updates (if needed)
- ✅ File attachments support (optional)
- ✅ Responsive design
- ✅ Admin interface integration

## API Endpoints

- `GET /api/leads` - List leads with pagination and filtering
- `POST /api/leads` - Create a new lead
- `GET /api/leads/[id]` - Get a specific lead
- `PATCH /api/leads/[id]` - Update a lead
- `DELETE /api/leads/[id]` - Delete a lead

## Notes

- The Leads feature uses a separate Supabase database from your main application
- All authentication and authorization policies should be configured based on your specific requirements
- The schema includes proper indexing for optimal performance
- The `updated_at` field is automatically maintained via database triggers
