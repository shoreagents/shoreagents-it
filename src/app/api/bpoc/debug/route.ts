import { NextResponse } from 'next/server'
import { bpocPool } from '@/lib/database'

export async function GET() {
  try {
    console.log('🐛 Debug endpoint called')
    
    // Check environment variables
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      BPOC_DATABASE_URL: process.env.BPOC_DATABASE_URL ? 'Set' : 'Not set',
      DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set'
    }
    
    console.log('🔧 Environment info:', envInfo)
    
    if (!bpocPool) {
      console.log('❌ BPOC pool is null')
      return NextResponse.json({ 
        error: 'BPOC pool is null',
        envInfo,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    // Test simple connection
    const testQuery = 'SELECT 1 as test'
    console.log('📊 Testing simple query:', testQuery)
    
    const { rows } = await bpocPool.query(testQuery)
    console.log('✅ Simple query successful:', rows[0])

    // Test if applications table exists
    const tableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'applications'
      ) as table_exists
    `
    console.log('📊 Checking if applications table exists')
    
    const tableResult = await bpocPool.query(tableQuery)
    const tableExists = tableResult.rows[0].table_exists
    console.log('📋 Applications table exists:', tableExists)

    // Test if users table exists
    const usersTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      ) as table_exists
    `
    const usersTableResult = await bpocPool.query(usersTableQuery)
    const usersTableExists = usersTableResult.rows[0].table_exists
    console.log('📋 Users table exists:', usersTableExists)

    // Test if processed_job_requests table exists
    const jobsTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'processed_job_requests'
      ) as table_exists
    `
    const jobsTableResult = await bpocPool.query(jobsTableQuery)
    const jobsTableExists = jobsTableResult.rows[0].table_exists
    console.log('📋 Processed job requests table exists:', jobsTableExists)

    // Test if members table exists
    const membersTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'members'
      ) as table_exists
    `
    const membersTableResult = await bpocPool.query(membersTableQuery)
    const membersTableExists = membersTableResult.rows[0].table_exists
    console.log('📋 Members table exists:', membersTableExists)

    return NextResponse.json({ 
      message: 'Debug successful',
      envInfo,
      tables: {
        applications: tableExists,
        users: usersTableExists,
        processed_job_requests: jobsTableExists,
        members: membersTableExists
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Debug failed:', error)
    return NextResponse.json({ 
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
