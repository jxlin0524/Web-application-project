import { db } from '../config/database';

export interface ProjectData {
  title: string;
  description?: string;
  authorId: number;
  genre?: string;
}

export interface ProjectRecord {
  project_id: number;
  author_id: number;
  title: string;
  description: string | null;
  created_at: Date;
}

export class Project {
  
  static async create(projectData: ProjectData): Promise<number> {
    const { title, description, authorId, genre } = projectData;

    
    if (!title || !authorId) {
      throw new Error('Project title and author ID are required');
    }

    const sql = `INSERT INTO projects (author_id, title, description) 
                 VALUES (?, ?, ?)`;
    const insertId = await db.insert(sql, [authorId, title, description || null]);
    
    return insertId;
  }

  
  static async findById(projectId: number): Promise<ProjectRecord | null> {
    const sql = 'SELECT * FROM projects WHERE project_id = ?';
    const projects = await db.query(sql, [projectId]) as ProjectRecord[];
    return projects.length > 0 ? projects[0] : null;
  }

  static async findByAuthor(authorId: number): Promise<ProjectRecord[]> {
    const sql = 'SELECT * FROM projects WHERE author_id = ? ORDER BY project_id DESC';
    return await db.query(sql, [authorId]) as ProjectRecord[];
  }

  static async update(projectId: number, updates: Partial<ProjectData>): Promise<boolean> {
    const allowedFields = ['title', 'description'];
    const updateFields = Object.keys(updates).filter(key => 
      allowedFields.includes(key) && updates[key as keyof ProjectData] !== undefined
    );

    if (updateFields.length === 0) {
      throw new Error('No valid update fields');
    }

    const setClause = updateFields.map(field => `${field} = ?`).join(', ');
    const values = updateFields.map(field => updates[field as keyof ProjectData]);
    values.push(projectId);

    const sql = `UPDATE projects SET ${setClause} WHERE project_id = ?`;
    const result = await db.query(sql, values);
    
    return (result as any).affectedRows > 0;
  }

  static async delete(projectId: number, authorId: number): Promise<boolean> {
    const sql = 'DELETE FROM projects WHERE project_id = ? AND author_id = ?';
    const result = await db.query(sql, [projectId, authorId]);
    return (result as any).affectedRows > 0;
  }
}