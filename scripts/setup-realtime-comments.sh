#!/bin/bash

# Setup Real-time Comments Script
# This script sets up the database for real-time comments functionality

echo "🚀 Setting up Real-time Comments..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    echo "Please set it to your PostgreSQL connection string:"
    echo "export DATABASE_URL='postgresql://username:password@localhost:5432/database_name'"
    exit 1
fi

# Extract database name from DATABASE_URL
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

if [ -z "$DB_NAME" ]; then
    echo "❌ Error: Could not extract database name from DATABASE_URL"
    exit 1
fi

echo "📊 Database: $DB_NAME"

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql command not found. Please install PostgreSQL client tools."
    exit 1
fi

# Run the SQL script
echo "🔧 Executing SQL script..."
psql "$DATABASE_URL" -f scripts/implement-realtime-comments.sql

if [ $? -eq 0 ]; then
    echo "✅ Real-time comments setup completed successfully!"
    echo ""
    echo "🎉 What was created:"
    echo "  • Notification function: notify_member_comment_changes()"
    echo "  • Triggers on member_comments table"
    echo "  • Helper functions for CRUD operations"
    echo "  • Optimized indexes for performance"
    echo "  • View for easier comment retrieval"
    echo ""
    echo "🔔 Next steps:"
echo "  1. Install pg package: npm install pg @types/pg"
echo "  2. The real-time services are already integrated in src/lib/realtime.ts"
echo "  3. Use the useRealtimeComments hook in your React components"
    echo ""
    echo "📚 See REALTIME_COMMENTS_SETUP.md for detailed instructions"
else
    echo "❌ Error: Failed to execute SQL script"
    exit 1
fi
