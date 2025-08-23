import pool from './database';

// Generic interface for any table's activity
export interface TableActivity {
  id: number;
  record_id: number; // Generic ID for any table
  table_name: string; // Which table this activity belongs to
  user_id?: number;
  user_name?: string; // From users table via JOIN
  old_data?: any; // JSON data before change
  new_data?: any; // JSON data after change
  changed_at: Date;
  change_type: 'created' | 'updated' | 'deleted';
}

// Generic audit service that works with any table
export class GenericAuditService {
  
  /**
   * Get all activity for a specific record in any table
   */
  static async getRecordActivity(tableName: string, recordId: number): Promise<TableActivity[]> {
    const result = await pool.query(`
      SELECT 
        mal.id,
        mal.record_id,
        mal.table_name,
        mal.user_id,
        u.full_name as user_name,
        mal.old_data,
        mal.new_data,
        mal.changed_at,
        CASE 
          WHEN mal.old_data IS NULL AND mal.new_data IS NOT NULL THEN 'created'
          WHEN mal.old_data IS NOT NULL AND mal.new_data IS NULL THEN 'deleted'
          ELSE 'updated'
        END as change_type
      FROM table_activity_log mal
      LEFT JOIN users u ON mal.user_id = u.id
      WHERE mal.table_name = $1 AND mal.record_id = $2
      ORDER BY mal.changed_at DESC
    `, [tableName, recordId]);
    
    return result.rows.map(row => ({
      ...row,
      changed_at: new Date(row.changed_at)
    }));
  }

  /**
   * Get activity by a specific user across all tables
   */
  static async getUserActivity(userName: string, limit: number = 50): Promise<TableActivity[]> {
    const result = await pool.query(`
      SELECT 
        mal.id,
        mal.record_id,
        mal.table_name,
        mal.user_id,
        u.full_name as user_name,
        mal.old_data,
        mal.new_data,
        mal.changed_at,
        CASE 
          WHEN mal.old_data IS NULL AND mal.new_data IS NOT NULL THEN 'created'
          WHEN mal.old_data IS NOT NULL AND mal.new_data IS NULL THEN 'deleted'
          ELSE 'updated'
        END as change_type
      FROM table_activity_log mal
      LEFT JOIN users u ON mal.user_id = u.id
      WHERE u.full_name = $1
      ORDER BY mal.changed_at DESC 
      LIMIT $2
    `, [userName, limit]);
    
    return result.rows.map(row => ({
      ...row,
      changed_at: new Date(row.changed_at)
    }));
  }

  /**
   * Get recent activity across all tables
   */
  static async getRecentActivity(days: number = 7, limit: number = 50): Promise<TableActivity[]> {
    const result = await pool.query(`
      SELECT 
        mal.id,
        mal.record_id,
        mal.table_name,
        mal.user_id,
        u.full_name as user_name,
        mal.old_data,
        mal.new_data,
        mal.changed_at,
        CASE 
          WHEN mal.old_data IS NULL AND mal.new_data IS NOT NULL THEN 'created'
          WHEN mal.old_data IS NOT NULL AND mal.new_data IS NULL THEN 'deleted'
          ELSE 'updated'
        END as change_type
      FROM table_activity_log mal
      LEFT JOIN users u ON mal.user_id = u.id
      WHERE mal.changed_at >= CURRENT_DATE - INTERVAL '1 day' * $1
      ORDER BY mal.changed_at DESC 
      LIMIT $2
    `, [days, limit]);
    
    return result.rows.map(row => ({
      ...row,
      changed_at: new Date(row.changed_at)
    }));
  }

  /**
   * Get activity for a specific table
   */
  static async getTableActivity(tableName: string, limit: number = 50): Promise<TableActivity[]> {
    const result = await pool.query(`
      SELECT 
        mal.id,
        mal.record_id,
        mal.table_name,
        mal.user_id,
        u.full_name as user_name,
        mal.old_data,
        mal.new_data,
        mal.changed_at,
        CASE 
          WHEN mal.old_data IS NULL AND mal.new_data IS NOT NULL THEN 'created'
          WHEN mal.old_data IS NOT NULL AND mal.new_data IS NULL THEN 'deleted'
          ELSE 'updated'
        END as change_type
      FROM table_activity_log mal
      LEFT JOIN users u ON mal.user_id = u.id
      WHERE mal.table_name = $1
      ORDER BY mal.changed_at DESC 
      LIMIT $2
    `, [tableName, limit]);
    
    return result.rows.map(row => ({
      ...row,
      changed_at: new Date(row.changed_at)
    }));
  }

  /**
   * Get specific field changes across all tables
   */
  static async getFieldActivity(fieldName: string, limit: number = 50): Promise<TableActivity[]> {
    const result = await pool.query(`
      SELECT 
        mal.id,
        mal.record_id,
        mal.table_name,
        mal.user_id,
        u.full_name as user_name,
        mal.old_data,
        mal.new_data,
        mal.changed_at,
        CASE 
          WHEN mal.old_data IS NULL AND mal.new_data IS NOT NULL THEN 'created'
          WHEN mal.old_data IS NOT NULL AND mal.new_data IS NULL THEN 'deleted'
          ELSE 'updated'
        END as change_type
      FROM table_activity_log mal
      LEFT JOIN users u ON mal.user_id = u.id
      WHERE (mal.old_data ? $1 OR mal.new_data ? $1)
      ORDER BY mal.changed_at DESC 
      LIMIT $2
    `, [fieldName, limit]);
    
    return result.rows.map(row => ({
      ...row,
      changed_at: new Date(row.changed_at)
    }));
  }

  /**
   * Compare old vs new data for a specific activity
   */
  static async getActivityComparison(activityId: number): Promise<{
    old_data: any;
    new_data: any;
    changed_at: Date;
    user_name?: string;
    table_name: string;
  } | null> {
    const result = await pool.query(`
      SELECT mal.old_data, mal.new_data, mal.changed_at, mal.table_name, u.full_name as user_name
      FROM table_activity_log mal
      LEFT JOIN users u ON mal.user_id = u.id
      WHERE mal.id = $1
    `, [activityId]);
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
    return {
      old_data: row.old_data,
      new_data: row.new_data,
      changed_at: new Date(row.changed_at),
      user_name: row.user_name,
      table_name: row.table_name
    };
  }
}

// Helper function to format activity data for display
export function formatActivityData(activity: TableActivity): string {
  const timestamp = new Date(activity.changed_at).toLocaleString();
  const user = activity.user_name || 'Unknown User';
  
  switch (activity.change_type) {
    case 'created':
      return `${timestamp} - ${user} created record in ${activity.table_name} (ID: ${activity.record_id})`;
    
    case 'updated':
      return `${timestamp} - ${user} updated record in ${activity.table_name} (ID: ${activity.record_id})`;
    
    case 'deleted':
      return `${timestamp} - ${user} deleted record in ${activity.table_name} (ID: ${activity.record_id})`;
    
    default:
      return `${timestamp} - ${user} made changes to ${activity.table_name} (ID: ${activity.record_id})`;
  }
}

// Helper function to get field differences
export function getFieldDifferences(oldData: any, newData: any): Array<{
  field: string;
  old_value: any;
  new_value: any;
}> {
  if (!oldData || !newData) return [];
  
  const differences: Array<{ field: string; old_value: any; new_value: any }> = [];
  
  // Check all fields in new data
  Object.keys(newData).forEach(field => {
    if (oldData[field] !== newData[field]) {
      differences.push({
        field,
        old_value: oldData[field],
        new_value: newData[field]
      });
    }
  });
  
  // Check fields that were removed
  Object.keys(oldData).forEach(field => {
    if (!(field in newData)) {
      differences.push({
        field,
        old_value: oldData[field],
        new_value: null
      });
    }
  });
  
  return differences;
}

// Helper function to format field changes
export function formatFieldChanges(differences: Array<{ field: string; old_value: any; new_value: any }>): string[] {
  return differences.map(diff => {
    if (diff.new_value === null) {
      return `Removed ${diff.field}: was "${diff.old_value}"`;
    } else if (diff.old_value === null || diff.old_value === undefined) {
      return `Added ${diff.field}: "${diff.new_value}"`;
    } else {
      return `Changed ${diff.field}: "${diff.old_value}" → "${diff.new_value}"`;
    }
  });
}
