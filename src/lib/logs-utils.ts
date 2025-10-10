import pool from './database';

export interface CompaniesActivityLog {
  id: number;
  company_id: number;
  field_name: string;
  action: 'created' | 'set' | 'updated' | 'removed' | 'selected' | 'deselected';
  old_value: string | null;
  new_value: string | null;
  user_id: number | null;
  created_at: Date;
  user_name?: string; // From users table via JOIN
}

export class CompaniesActivityLogger {
  /**
   * Log any activity
   */
  static async logActivity(params: {
    companyId: number;
    fieldName: string;
    action: 'created' | 'set' | 'updated' | 'removed' | 'selected' | 'deselected';
    oldValue?: string | null;
    newValue?: string | null;
    userId?: number | null;
  }): Promise<void> {
    const { companyId, fieldName, action, oldValue, newValue, userId } = params;
    
    console.log('🔍 logActivity called with params:', { companyId, fieldName, action, oldValue, newValue, userId });
    
    try {
      const result = await pool.query(`
        INSERT INTO public.companies_activity_log 
        (company_id, field_name, action, old_value, new_value, user_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [companyId, fieldName, action, oldValue, newValue, userId]);
      
      console.log('✅ Activity logged successfully:', {
        id: result.rows[0]?.id,
        companyId,
        fieldName,
        action,
        oldValue,
        newValue,
        userId
      });
    } catch (error) {
      console.error('❌ Failed to log activity:', error);
      if (error instanceof Error) {
        console.error('❌ Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
      }
      throw error;
    }
  }

  /**
   * Log agent assignment changes using 'selected' and 'deselected' actions
   */
  static async logAgentAssignmentChange(companyId: number, oldAgentIds: number[], newAgentIds: number[], userId?: number): Promise<void> {
    // Find newly added and removed agents
    const addedAgentIds = newAgentIds.filter(id => !oldAgentIds.includes(id));
    const removedAgentIds = oldAgentIds.filter(id => !newAgentIds.includes(id));
    
    // Log newly added agents
    if (addedAgentIds.length > 0) {
      try {
        const addedAgentNames = await this.getAgentNames(addedAgentIds);
        const addedNames = addedAgentNames.length > 0 ? addedAgentNames.join(', ') : `${addedAgentIds.length} agent(s)`;
        
        await this.logActivity({
          companyId,
          fieldName: 'Agents',
          action: 'selected',
          newValue: addedNames,
          userId
        });
        
        console.log('✅ Logged agent selection:', addedNames);
      } catch (error) {
        console.error('Failed to log agent selection:', error);
      }
    }
    
    // Log newly removed agents
    if (removedAgentIds.length > 0) {
      try {
        const removedAgentNames = await this.getAgentNames(removedAgentIds);
        const removedNames = removedAgentNames.length > 0 ? removedAgentNames.join(', ') : `${removedAgentIds.length} agent(s)`;
        
        await this.logActivity({
          companyId,
          fieldName: 'Agents',
          action: 'deselected',
          oldValue: removedNames,
          userId
        });
        
        console.log('✅ Logged agent deselection:', removedNames);
      } catch (error) {
        console.error('Failed to log agent deselection:', error);
      }
    }
  }

  /**
   * Log client assignment changes using 'selected' and 'deselected' actions
   */
  static async logClientAssignmentChange(companyId: number, oldClientIds: number[], newClientIds: number[], userId?: number): Promise<void> {
    // Find newly added and removed clients
    const addedClientIds = newClientIds.filter(id => !oldClientIds.includes(id));
    const removedClientIds = oldClientIds.filter(id => !newClientIds.includes(id));
    
    // Log newly added clients
    if (addedClientIds.length > 0) {
      try {
        const addedClientNames = await this.getClientNames(addedClientIds);
        const addedNames = addedClientNames.length > 0 ? addedClientNames.join(', ') : `${addedClientIds.length} client(s)`;
        
        await this.logActivity({
          companyId,
          fieldName: 'Clients',
          action: 'selected',
          newValue: addedNames,
          userId
        });
        
        console.log('✅ Logged client selection:', addedNames);
      } catch (error) {
        console.error('Failed to log client selection:', error);
      }
    }
    
    // Log newly removed clients
    if (removedClientIds.length > 0) {
      try {
        const removedClientNames = await this.getClientNames(removedClientIds);
        const removedNames = removedClientNames.length > 0 ? removedClientNames.join(', ') : `${removedClientIds.length} client(s)`;
        
        await this.logActivity({
          companyId,
          fieldName: 'Clients',
          action: 'deselected',
          oldValue: removedNames,
          userId
        });
        
        console.log('✅ Logged client deselection:', removedNames);
      } catch (error) {
        console.error('Failed to log client deselection:', error);
      }
    }
  }

  /**
   * Get agent names by IDs
   */
  private static async getAgentNames(agentIds: number[]): Promise<string[]> {
    if (agentIds.length === 0) return [];
    
    try {
      const result = await pool.query(`
        SELECT 
          COALESCE(pi.first_name || ' ' || pi.last_name, u.email) as agent_name
        FROM public.users u
        LEFT JOIN public.personal_info pi ON u.id = pi.user_id
        WHERE u.id = ANY($1)
        ORDER BY pi.first_name, pi.last_name, u.email
      `, [agentIds]);
      
      return result.rows.map(row => row.agent_name);
    } catch (error) {
      console.error('Failed to get agent names:', error);
      return [];
    }
  }

  /**
   * Get client names by IDs
   */
  private static async getClientNames(clientIds: number[]): Promise<string[]> {
    if (clientIds.length === 0) return [];
    
    try {
      const result = await pool.query(`
        SELECT 
          COALESCE(pi.first_name || ' ' || pi.last_name, u.email) as client_name
        FROM public.users u
        LEFT JOIN public.personal_info pi ON u.id = pi.user_id
        WHERE u.id = ANY($1)
        ORDER BY pi.first_name, pi.last_name, u.email
      `, [clientIds]);
      
      return result.rows.map(row => row.client_name);
    } catch (error) {
      console.error('Failed to get client names:', error);
      return [];
    }
  }

  /**
   * Log company creation
   */
  static async logCompanyCreated(companyId: number, companyName: string, userId?: number): Promise<void> {
    console.log('🔍 logCompanyCreated called:', { companyId, companyName, userId });
    
    try {
      await this.logActivity({
        companyId,
        fieldName: 'Company',
        action: 'created',
        newValue: companyName,
        userId
      });
      
      console.log('✅ Company creation logged successfully');
    } catch (error) {
      console.error('❌ Failed to log company creation:', error);
      throw error;
    }
  }

  /**
   * Log field creation
   */
  static async logFieldCreated(companyId: number, fieldName: string, value: string, userId?: number): Promise<void> {
    await this.logActivity({
      companyId,
      fieldName,
      action: 'created',
      newValue: value,
      userId
    });
  }

  /**
   * Log field being set
   */
  static async logFieldSet(companyId: number, fieldName: string, value: string, userId?: number): Promise<void> {
    console.log('🔍 logFieldSet called:', { companyId, fieldName, value, userId });
    
    try {
      await this.logActivity({
        companyId,
        fieldName,
        action: 'set',
        newValue: value,
        userId
      });
      
      console.log('✅ Field set logged successfully:', { fieldName, value });
    } catch (error) {
      console.error('❌ Failed to log field set:', { fieldName, value, error });
      throw error;
    }
  }

  /**
   * Log field update
   */
  static async logFieldUpdated(companyId: number, fieldName: string, oldValue: string, newValue: string, userId?: number): Promise<void> {
    await this.logActivity({
      companyId,
      fieldName,
      action: 'updated',
      oldValue,
      newValue,
      userId
    });
  }

  /**
   * Log field removal
   */
  static async logFieldRemoved(companyId: number, fieldName: string, oldValue: string, userId?: number): Promise<void> {
    await this.logActivity({
      companyId,
      fieldName,
      action: 'removed',
      oldValue,
      userId
    });
  }

  /**
   * Get activity log for a specific company
   */
  static async getCompanyActivityLog(companyId: number, limit: number = 50): Promise<CompaniesActivityLog[]> {
    try {
      const result = await pool.query(`
        SELECT 
          mal.id,
          mal.company_id,
          mal.field_name,
          mal.action,
          mal.old_value,
          mal.new_value,
          mal.user_id,
          mal.created_at,
          COALESCE(pi.first_name || ' ' || pi.last_name, u.email) as user_name
        FROM public.companies_activity_log mal
        LEFT JOIN public.users u ON mal.user_id = u.id
        LEFT JOIN public.personal_info pi ON u.id = pi.user_id
        WHERE mal.company_id = $1
        ORDER BY mal.created_at DESC
        LIMIT $2
      `, [companyId, limit]);

      return result.rows.map(row => ({
        ...row,
        created_at: new Date(row.created_at)
      }));
    } catch (error) {
      console.error('Failed to get company activity log:', error);
      return [];
    }
  }

  /**
   * Log website changes (handles array format)
   */
  static async logWebsiteChange(companyId: number, oldWebsite: any, newWebsite: any, userId?: number): Promise<void> {
    console.log('🔍 logWebsiteChange called:', { companyId, oldWebsite, newWebsite, userId });
    
    try {
      // Convert arrays to strings for comparison and logging
      const oldWebsiteStr = Array.isArray(oldWebsite) ? oldWebsite.join(', ') : (oldWebsite || '');
      const newWebsiteStr = Array.isArray(newWebsite) ? newWebsite.join(', ') : (newWebsite || '');
      
      console.log('🔍 Website strings:', { oldWebsiteStr, newWebsiteStr });
      
      if (!oldWebsiteStr && newWebsiteStr) {
        // Website was set for the first time
        await this.logFieldSet(companyId, 'Website', newWebsiteStr, userId);
        console.log('✅ Website set logged successfully');
      } else if (oldWebsiteStr && !newWebsiteStr) {
        // Website was removed
        await this.logFieldRemoved(companyId, 'Website', oldWebsiteStr, userId);
        console.log('✅ Website removal logged successfully');
      } else if (oldWebsiteStr !== newWebsiteStr) {
        // Website was updated
        await this.logFieldUpdated(companyId, 'Website', oldWebsiteStr, newWebsiteStr, userId);
        console.log('✅ Website update logged successfully');
      } else {
        console.log('ℹ️ No website change detected');
      }
    } catch (error) {
      console.error('❌ Failed to log website change:', error);
      throw error;
    }
  }

  /**
   * Get activity log for a specific user
   */
  static async getUserActivityLog(userId: number, limit: number = 50): Promise<CompaniesActivityLog[]> {
    try {
      const result = await pool.query(`
        SELECT 
          mal.id,
          mal.company_id,
          mal.field_name,
          mal.action,
          mal.old_value,
          mal.new_value,
          mal.user_id,
          mal.created_at,
          COALESCE(pi.first_name || ' ' || pi.last_name, u.email) as user_name
        FROM public.companies_activity_log mal
        LEFT JOIN public.users u ON mal.user_id = u.id
        LEFT JOIN public.personal_info pi ON u.id = pi.user_id
        WHERE mal.user_id = $1
        ORDER BY mal.created_at DESC
        LIMIT $2
      `, [userId, limit]);

      return result.rows.map(row => ({
        ...row,
        created_at: new Date(row.created_at)
      }));
    } catch (error) {
      console.error('Failed to get user activity log:', error);
      return [];
    }
  }
}

// Helper function to format activity text for display
export function formatActivityText(activity: CompaniesActivityLog): string {
  console.log('🔍 formatActivityText called with:', {
    field_name: activity.field_name,
    action: activity.action,
    new_value: activity.new_value,
    old_value: activity.old_value,
    user_name: activity.user_name
  });
  
  const fieldDisplayName = getFieldDisplayName(activity.field_name);
  console.log('🔍 fieldDisplayName result:', fieldDisplayName);
  
  if (activity.action === 'created') {
    const result = `${activity.user_name || 'Unknown User'} created ${fieldDisplayName} "${activity.new_value || '-'}"`;
    console.log('🔍 Created action result:', result);
    return result;
  } else if (activity.action === 'set') {
    // Check if this is a removal (old_value is null but new_value contains the removed value)
    if (activity.old_value === null && activity.new_value) {
      return `${activity.user_name || 'Unknown User'} removed ${fieldDisplayName} from ${activity.new_value}`;
    } else {
      return `${activity.user_name || 'Unknown User'} set ${fieldDisplayName} to ${activity.new_value || '-'}`;
    }
  } else if (activity.action === 'updated') {
    return `${activity.user_name || 'Unknown User'} changed ${fieldDisplayName} from ${activity.old_value || '-'} to ${activity.new_value}`;
  } else if (activity.action === 'removed') {
    return `${activity.user_name || 'Unknown User'} removed ${fieldDisplayName}`;
  } else if (activity.action === 'selected') {
    return `${activity.user_name || 'Unknown User'} added ${activity.new_value || '-'} to ${getFieldDisplayName(activity.field_name)}`;
  } else if (activity.action === 'deselected') {
    return `${activity.user_name || 'Unknown User'} removed ${activity.old_value || '-'} from ${getFieldDisplayName(activity.field_name)}`;
  }
  
  return 'Unknown action';
}

// Helper function to get field display names
function getFieldDisplayName(fieldName: string): string {
  const fieldNames: Record<string, string> = {
    'company': 'Company Name',
    'Company Name': 'Company Name',
    'address': 'Address',
    'Address': 'Address',
    'phone': 'Phone',
    'Phone': 'Phone',
    'country': 'Country',
    'Country': 'Country',
    'service': 'Service',
    'Service': 'Service',
    'website': 'Website',
    'Website': 'Website',
    'logo': 'Logo',
    'Logo': 'Logo',
    'badge_color': 'Badge Color',
    'Badge Color': 'Badge Color',
    'status': 'Status',
    'Status': 'Status',

  };
  return fieldNames[fieldName] || fieldName;
}

// Helper function to format date for display
export function formatActivityDate(date: Date): string {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes} mins ago`;
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
