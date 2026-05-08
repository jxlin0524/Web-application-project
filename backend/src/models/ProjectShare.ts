  import { db } from '../config/database';

export interface ProjectShareData {
  share_id: string;
  project_id: number;
  access_code?: string;
  expires_at?: Date | null;
  created_at?: Date;
}

export class ProjectShare {
  
  static async create(data: ProjectShareData): Promise<void> {
    const result = await db.query(
      `INSERT INTO project_shares (share_id, project_id, access_code, expires_at) 
       VALUES (?, ?, ?, ?)`,
      [
        data.share_id, 
        data.project_id, 
        data.access_code || null, 
        data.expires_at || null
      ]
    );
          
  }

  static async findByShareId(shareId: string): Promise<ProjectShareData | null> {
    const result = await db.query(
      'SELECT * FROM project_shares WHERE share_id = ?',
      [shareId]
    );

    let rows: any[];

    if (Array.isArray(result) && Array.isArray(result[0])) {
        rows = result[0] as any[];
    } 
    else if (Array.isArray(result)) {
        rows = result as any[];
    }
    else {
        rows = [];
    }

    if (rows.length > 0) {
        return rows[0] as ProjectShareData;
    }
    
    return null;
  }
}