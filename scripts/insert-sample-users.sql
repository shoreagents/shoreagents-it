-- Insert sample internal users for testing
-- This script creates users with user_type 'Internal' and adds them to the internal table

-- Insert users
INSERT INTO users (email, user_type) VALUES
('admin@shoreagents.com', 'Internal'),
('agent1@shoreagents.com', 'Internal'),
('agent2@shoreagents.com', 'Internal')
ON CONFLICT (email) DO NOTHING;

-- Insert personal info for users
INSERT INTO personal_info (user_id, first_name, last_name, phone, city, address, gender) 
SELECT 
  u.id,
  CASE 
    WHEN u.email = 'admin@shoreagents.com' THEN 'Admin'
    WHEN u.email = 'agent1@shoreagents.com' THEN 'John'
    WHEN u.email = 'agent2@shoreagents.com' THEN 'Jane'
  END,
  CASE 
    WHEN u.email = 'admin@shoreagents.com' THEN 'User'
    WHEN u.email = 'agent1@shoreagents.com' THEN 'Doe'
    WHEN u.email = 'agent2@shoreagents.com' THEN 'Smith'
  END,
  '+1234567890',
  'Manila',
  'Philippines',
  'Male'
FROM users u
WHERE u.email IN ('admin@shoreagents.com', 'agent1@shoreagents.com', 'agent2@shoreagents.com')
ON CONFLICT (user_id) DO NOTHING;

-- Insert into internal table
INSERT INTO internal (user_id)
SELECT id FROM users 
WHERE email IN ('admin@shoreagents.com', 'agent1@shoreagents.com', 'agent2@shoreagents.com')
ON CONFLICT (user_id) DO NOTHING;

-- Insert roles
INSERT INTO roles (name, description) VALUES
('Admin', 'Full system administrator'),
('Agent', 'IT support agent'),
('Manager', 'Team manager')
ON CONFLICT (name) DO NOTHING;

-- Assign roles to internal users
INSERT INTO internal_roles (internal_user_id, role_id)
SELECT 
  i.user_id,
  r.id
FROM internal i
CROSS JOIN roles r
WHERE r.name = 'Admin'
ON CONFLICT (internal_user_id, role_id) DO NOTHING;

-- Display the created users
SELECT 
  u.email,
  u.user_type,
  pi.first_name,
  pi.last_name,
  r.name as role
FROM users u
LEFT JOIN personal_info pi ON u.id = pi.user_id
LEFT JOIN internal i ON u.id = i.user_id
LEFT JOIN internal_roles ir ON i.user_id = ir.internal_user_id
LEFT JOIN roles r ON ir.role_id = r.id
WHERE i.user_id IS NOT NULL; 