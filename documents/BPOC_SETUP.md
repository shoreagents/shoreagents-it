# BPOC Database Setup Guide

## 🔧 Required Environment Variables

To connect the applicants page to the BPOC database, you need to set up the following environment variable:

### **Step 1: Add BPOC Database URL**

Add this line to your `.env.local` file:

```bash
BPOC_DATABASE_URL=your_bpoc_postgresql_connection_string_here
```

### **Step 2: Get Your BPOC Database URL**

The BPOC database should contain the following tables based on the schema:
- `public.applications` - Job applications with status tracking
- `public.users` - User information
- `public.processed_job_requests` - Job postings
- `public.members` - Company/member information

### **Step 3: Test BPOC Database Connection**

After setting up your `.env.local` file, test the connection:

```bash
npm run test-bpoc-db
```

You should see:
```
Testing BPOC database connection...
✅ BPOC_DATABASE_URL: Set
✅ BPOC Database connection successful!
✅ BPOC Database query successful: { now: '2024-01-01T12:00:00.000Z' }
✅ Applications table accessible: { count: '0' }
✅ Users table accessible: { count: '0' }
✅ Processed job requests table accessible: { count: '0' }
✅ Members table accessible: { count: '0' }

🎉 BPOC Database is ready for applicants!
```

### **Step 4: Verify Applicants Page**

Once the database connection works:
1. Start your development server: `npm run dev:web`
2. Navigate to `/admin/bpoc-applicants` (labeled as "BPOC" in the sidebar)
3. The page should load applicants from the BPOC database
4. You can drag and drop applications between status columns
5. Status changes are automatically saved to the database

## 🚨 Common Issues

### **Issue: "BPOC_DATABASE_URL: Not set"**
- Make sure you added `BPOC_DATABASE_URL` to your `.env.local` file
- Check that the file is in the project root
- Verify the variable name is exactly `BPOC_DATABASE_URL`

### **Issue: "Connection refused"**
- Check that your BPOC database is running
- Verify the host and port in your connection string
- Ensure your IP is whitelisted (for cloud databases)

### **Issue: "Table does not exist"**
- Make sure the BPOC database has the required tables
- Check that the schema matches the expected structure
- Verify table names are in the `public` schema

## 📝 Example .env.local

```bash
# Primary Database
DATABASE_URL=postgresql://username:password@localhost:5432/primary_db

# BPOC Database (for Applicants)
BPOC_DATABASE_URL=postgresql://username:password@localhost:5432/bpoc_db

# Environment
NODE_ENV=development
```

## 🔒 Security Notes

- Never commit `.env.local` to version control
- The file is already in `.gitignore`
- Keep your database credentials secure
- Use different databases for development and production

## ✅ Verification Checklist

- [ ] Added `BPOC_DATABASE_URL` to `.env.local`
- [ ] Ran `npm run test-bpoc-db` successfully
- [ ] All required tables are accessible
- [ ] Applicants page loads without errors
- [ ] Drag and drop status updates work
- [ ] Status changes are saved to database
