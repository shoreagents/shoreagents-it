# Dual Database Setup Guide

## 🔄 **Overview**

The applicants page now saves status changes to **both databases**:
1. **BPOC Database** - Primary source for application data
2. **Main Database** - Tracks recruitment history and status changes

## 🏗️ **Database Tables**

### **BPOC Database (Applications)**
- `public.applications` - Current application statuses
- Updates happen in real-time when dragging/dropping

### **Main Database (Recruitment Tracking)**
- `public.recruits` - Historical record of all status changes
- Tracks the complete recruitment journey

### **Main Database (Team Collaboration)**
- `public.recruit_comments` - Multiple user comments and notes for each recruit
- Enables team communication and candidate assessment tracking

## 📊 **Database Schema**

### **Recruits Table Schema**

```sql
CREATE TABLE public.recruits (
  id SERIAL PRIMARY KEY,
  bpoc_application_id UUID NOT NULL,  -- Links to BPOC application
  applicant_id UUID,                   -- Applicant user ID
  job_id INTEGER,                     -- Job posting ID
  resume_slug TEXT,                   -- Resume identifier
  status TEXT NOT NULL,               -- New status
  previous_status TEXT,                -- Previous status
  status_changed_at TIMESTAMPTZ DEFAULT NOW(),  -- When change occurred
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,                         -- Optional notes
  recruiter_id INTEGER,               -- Recruiter who made the change
  
  -- Enhanced applicant information
  video_introduction_url TEXT,        -- URL to video introduction
  current_salary DECIMAL(10,2),       -- Current monthly salary
  expected_monthly_salary DECIMAL(10,2), -- Expected monthly salary
  shift TEXT,                         -- Preferred shift (morning, afternoon, night, flexible)
  shift TEXT                          -- Preferred shift (morning, afternoon, night, flexible)
);
```

### **Recruit Comments Table Schema**

```sql
CREATE TABLE public.recruit_comments (
  id SERIAL PRIMARY KEY,                                    -- Auto-incrementing unique identifier
  recruit_id INTEGER NOT NULL,                              -- Links to the recruits table (foreign key)
  user_id UUID NOT NULL,                                    -- ID of the user who made the comment
  comments TEXT NOT NULL,                                   -- The actual comment content
  created_at TIMESTAMPTZ DEFAULT NOW(),                     -- When the comment was created
  updated_at TIMESTAMPTZ DEFAULT NOW()                      -- When the comment was last updated (auto-updated)
);
```
```

## 🚀 **Setup Instructions**

### **Step 1: Create Recruits Table**
```sql
-- Option 1: Run directly in your database
psql -d your_database_name -f scripts/create-recruits-table.sql

-- Option 2: Copy and paste the SQL into your database client
-- The SQL file is located at: scripts/create-recruits-table.sql
```

### **Step 2: Verify Both Databases**
```bash
npm run test-db          # Test main database
npm run test-bpoc-db     # Test BPOC database
```

### **Step 3: Test Dual Updates**
1. Start your server: `npm run dev:web`
2. Go to `/admin/bpoc-applicants` (labeled as "BPOC" in the sidebar)
3. Drag a card from "New" to "Screened"
4. Check both databases for the update

## 🔍 **How It Works**

### **When You Drag & Drop:**

1. **Frontend**: Card moves to new status column
2. **API Call**: PATCH request sent to `/api/bpoc`
3. **BPOC Update**: Status updated in `applications` table
4. **Main DB Insert**: New record added to `recruits` table
5. **Success**: Both databases updated, UI reflects changes

### **API Flow:**
```
Frontend → API → BPOC Database (UPDATE) → Main Database (INSERT)
```

### **Comments API Endpoints:**
- **GET** `/api/recruit-comments?recruitId=X` - Fetch all comments for a recruit
- **POST** `/api/recruit-comments` - Add a new comment
- **PUT** `/api/recruit-comments` - Update an existing comment
- **DELETE** `/api/recruit-comments?commentId=X` - Permanently delete a comment

## 📈 **Benefits**

- **Complete History**: Track every status change with timestamps
- **Audit Trail**: Know who changed what and when
- **Analytics**: Analyze recruitment pipeline performance
- **Compliance**: Maintain records for regulatory requirements
- **Backup**: Redundant data storage for reliability
- **Enhanced Applicant Data**: Track video introductions, salary expectations, and shift preferences
- **Recruitment Insights**: Better understand candidate requirements and preferences

## 🎯 **Enhanced Applicant Information**

The recruits table now captures additional applicant details beyond status changes:

### **Video Introduction**
- `video_introduction_url`: Link to applicant's video introduction
- `video_duration_seconds`: Length of the video for screening efficiency

### **Salary Information**
- `current_salary`: Applicant's current monthly salary
- `expected_monthly_salary`: Desired monthly salary
- `salary_currency`: Currency (default: PHP)
- `salary_negotiable`: Whether salary expectations are flexible

### **Shift Preferences**
- `shift`: Primary preferred shift
- Common values: "morning", "afternoon", "night", "flexible"

## 👥 **Team Collaboration Features**

The recruit comments system enables comprehensive team collaboration:

### **Multiple User Comments**
- **Unlimited comments**: Each recruit can have multiple comments from different users
- **User attribution**: Track who made each comment and when
- **Simple structure**: Clean, straightforward comment system

### **Comment Management**
- **Timestamps**: Track when comments were created and last modified
- **Direct deletion**: Permanently remove comments when needed
- **User accountability**: Know who made each comment

### **Team Communication**
- **Candidate assessments**: Share insights and observations about applicants
- **Progress notes**: Document recruitment progress and decisions
- **Team insights**: Collaborate on candidate evaluations

## 🚨 **Error Handling**

- **BPOC Update Fails**: Entire request fails (critical)
- **Main DB Insert Fails**: Warning logged, but BPOC update succeeds
- **Graceful Degradation**: System continues working even if main DB is down

## 🔧 **Monitoring**

### **Check BPOC Database:**
```sql
SELECT id, status FROM public.applications WHERE id = 'your_app_id';
```

### **Check Main Database:**
```sql
SELECT * FROM public.recruits WHERE bpoc_application_id = 'your_app_id' ORDER BY status_changed_at DESC;
```

## ✅ **Verification Checklist**

- [ ] Recruits table created successfully
- [ ] Both database connections working
- [ ] Status changes saved to BPOC database
- [ ] Status changes logged to recruits table
- [ ] Previous status correctly tracked
- [ ] Timestamps accurate
- [ ] Error handling working

## 🎯 **Example Workflow**

1. **Application starts** in "New" status
2. **Drag to "Screened"** → Both databases updated
3. **Drag to "For Verification"** → Both databases updated
4. **Drag to "Verified"** → Both databases updated
5. **Complete history** available in recruits table

The system now provides a robust, dual-database solution for tracking applicant recruitment progress! 🎉
