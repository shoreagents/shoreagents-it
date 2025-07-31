const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

async function applyRealtimeSchema() {
  try {
    console.log('Applying real-time notification schema...')
    
    // Create notification function
    const notificationFunction = `
      CREATE OR REPLACE FUNCTION notify_ticket_change()
      RETURNS TRIGGER AS $$
      DECLARE
          notification JSON;
      BEGIN
          -- Create notification payload
          notification = json_build_object(
              'table', TG_TABLE_NAME,
              'action', TG_OP,
              'record', row_to_json(NEW),
              'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
              'timestamp', now()
          );
          
          -- Send notification
          PERFORM pg_notify('ticket_changes', notification::text);
          
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `
    
    await pool.query(notificationFunction)
    console.log('✅ Created notification function')
    
    // Create triggers
    const triggers = [
      {
        name: 'notify_ticket_insert',
        query: `
          DROP TRIGGER IF EXISTS notify_ticket_insert ON public.tickets;
          CREATE TRIGGER notify_ticket_insert
              AFTER INSERT ON public.tickets
              FOR EACH ROW
              EXECUTE FUNCTION notify_ticket_change();
        `
      },
      {
        name: 'notify_ticket_update',
        query: `
          DROP TRIGGER IF EXISTS notify_ticket_update ON public.tickets;
          CREATE TRIGGER notify_ticket_update
              AFTER UPDATE ON public.tickets
              FOR EACH ROW
              EXECUTE FUNCTION notify_ticket_change();
        `
      },
      {
        name: 'notify_ticket_delete',
        query: `
          DROP TRIGGER IF EXISTS notify_ticket_delete ON public.tickets;
          CREATE TRIGGER notify_ticket_delete
              AFTER DELETE ON public.tickets
              FOR EACH ROW
              EXECUTE FUNCTION notify_ticket_change();
        `
      }
    ]
    
    for (const trigger of triggers) {
      await pool.query(trigger.query)
      console.log(`✅ Created ${trigger.name} trigger`)
    }
    
    console.log('🎉 Real-time notification schema applied successfully!')
    console.log('📡 Your database is now ready for real-time updates')
    
  } catch (error) {
    console.error('❌ Error applying real-time schema:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

applyRealtimeSchema() 