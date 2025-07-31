-- Sample ticket data for testing
-- Make sure you have some users in the users table first

-- Insert sample users if they don't exist
INSERT INTO users (email, user_type) VALUES 
('john.doe@example.com', 'Agent'),
('jane.smith@example.com', 'Agent'),
('mike.wilson@example.com', 'Agent'),
('sarah.jones@example.com', 'Agent'),
('alex.brown@example.com', 'Agent')
ON CONFLICT (email) DO NOTHING;

-- Insert sample personal info for users
INSERT INTO personal_info (user_id, first_name, last_name, profile_picture) VALUES 
((SELECT id FROM users WHERE email = 'john.doe@example.com'), 'John', 'Doe', NULL),
((SELECT id FROM users WHERE email = 'jane.smith@example.com'), 'Jane', 'Smith', NULL),
((SELECT id FROM users WHERE email = 'mike.wilson@example.com'), 'Mike', 'Wilson', NULL),
((SELECT id FROM users WHERE email = 'sarah.jones@example.com'), 'Sarah', 'Jones', NULL),
((SELECT id FROM users WHERE email = 'alex.brown@example.com'), 'Alex', 'Brown', NULL)
ON CONFLICT (user_id) DO NOTHING;

-- Insert sample tickets with various statuses and categories
INSERT INTO tickets (ticket_id, user_id, concern, details, category, status, position, created_at) VALUES 
-- For Approval tickets
('TKT-000001', (SELECT id FROM users WHERE email = 'john.doe@example.com'), 'Computer not turning on', 'My computer suddenly stopped working this morning. No power light.', 'Computer & Equipment', 'For Approval', 0, NOW() - INTERVAL '2 hours'),
('TKT-000002', (SELECT id FROM users WHERE email = 'jane.smith@example.com'), 'Need new keyboard', 'Current keyboard has sticky keys and needs replacement.', 'Computer & Equipment', 'For Approval', 1, NOW() - INTERVAL '1 hour'),

-- On Hold tickets
('TKT-000003', (SELECT id FROM users WHERE email = 'mike.wilson@example.com'), 'Station lighting issue', 'Fluorescent lights flickering at station 3', 'Station', 'On Hold', 0, NOW() - INTERVAL '3 hours'),
('TKT-000004', (SELECT id FROM users WHERE email = 'sarah.jones@example.com'), 'Air conditioning problem', 'AC unit making loud noise in office area', 'Surroundings', 'On Hold', 1, NOW() - INTERVAL '4 hours'),

-- Approved tickets
('TKT-000005', (SELECT id FROM users WHERE email = 'alex.brown@example.com'), 'Schedule change request', 'Need to adjust shift schedule for next week', 'Schedule', 'Approved', 0, NOW() - INTERVAL '5 hours'),
('TKT-000006', (SELECT id FROM users WHERE email = 'john.doe@example.com'), 'Transport reimbursement', 'Requesting reimbursement for parking fees', 'Transport', 'Approved', 1, NOW() - INTERVAL '6 hours'),

-- In Progress tickets
('TKT-000007', (SELECT id FROM users WHERE email = 'jane.smith@example.com'), 'Software installation', 'Need Adobe Creative Suite installed on workstation', 'Computer & Equipment', 'In Progress', 0, NOW() - INTERVAL '7 hours'),
('TKT-000008', (SELECT id FROM users WHERE email = 'mike.wilson@example.com'), 'Desk adjustment', 'Need ergonomic desk setup for better posture', 'Station', 'In Progress', 1, NOW() - INTERVAL '8 hours'),

-- Completed tickets (today)
('TKT-000009', (SELECT id FROM users WHERE email = 'sarah.jones@example.com'), 'Printer cartridge replacement', 'Replaced empty ink cartridge in main printer', 'Computer & Equipment', 'Completed', 0, NOW() - INTERVAL '1 day'),
('TKT-000010', (SELECT id FROM users WHERE email = 'alex.brown@example.com'), 'Internet connection fixed', 'Resolved slow internet connection issue', 'Computer & Equipment', 'Completed', 1, NOW() - INTERVAL '1 day'),

-- Completed tickets (past dates)
('TKT-000011', (SELECT id FROM users WHERE email = 'john.doe@example.com'), 'Office chair replacement', 'Replaced broken office chair with new ergonomic one', 'Station', 'Completed', 0, NOW() - INTERVAL '2 days'),
('TKT-000012', (SELECT id FROM users WHERE email = 'jane.smith@example.com'), 'Phone system setup', 'Installed new phone system for reception area', 'Computer & Equipment', 'Completed', 1, NOW() - INTERVAL '3 days'),
('TKT-000013', (SELECT id FROM users WHERE email = 'mike.wilson@example.com'), 'Security camera installation', 'Installed security cameras in parking area', 'Surroundings', 'Completed', 0, NOW() - INTERVAL '4 days'),
('TKT-000014', (SELECT id FROM users WHERE email = 'sarah.jones@example.com'), 'Coffee machine repair', 'Fixed coffee machine in break room', 'Surroundings', 'Completed', 1, NOW() - INTERVAL '5 days'),
('TKT-000015', (SELECT id FROM users WHERE email = 'alex.brown@example.com'), 'WiFi password update', 'Updated WiFi password and distributed to team', 'Computer & Equipment', 'Completed', 0, NOW() - INTERVAL '6 days');

-- Update resolved_at for completed tickets
UPDATE tickets SET 
  resolved_at = created_at + INTERVAL '2 hours',
  resolved_by = (SELECT id FROM users WHERE email = 'john.doe@example.com')
WHERE status = 'Completed';

-- Update the ticket_id_seq to start from the next number after our sample data
SELECT setval('ticket_id_seq', 16); 