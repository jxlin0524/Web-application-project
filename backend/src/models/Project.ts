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
  /**
   * 创建新项目
   */
  static async create(projectData: ProjectData): Promise<number> {
    const { title, description, authorId, genre } = projectData;

    // 验证输入
    if (!title || !authorId) {
      throw new Error('项目标题和作者ID是必填的');
    }

    const sql = `INSERT INTO projects (author_id, title, description) 
                 VALUES (?, ?, ?)`;
    const insertId = await db.insert(sql, [authorId, title, description || null]);
    
    return insertId;
  }

  /**
   * 根据项目ID查找项目
   */
  static async findById(projectId: number): Promise<ProjectRecord | null> {
    const sql = 'SELECT * FROM projects WHERE project_id = ?';
    const projects = await db.query(sql, [projectId]) as ProjectRecord[];
    return projects.length > 0 ? projects[0] : null;
  }

  /**
   * 获取用户的所有项目
   */
  static async findByAuthor(authorId: number): Promise<ProjectRecord[]> {
    const sql = 'SELECT * FROM projects WHERE author_id = ? ORDER BY project_id DESC';
    return await db.query(sql, [authorId]) as ProjectRecord[];
  }

  /**
   * 更新项目
   */
  static async update(projectId: number, updates: Partial<ProjectData>): Promise<boolean> {
    const allowedFields = ['title', 'description'];
    const updateFields = Object.keys(updates).filter(key => 
      allowedFields.includes(key) && updates[key as keyof ProjectData] !== undefined
    );

    if (updateFields.length === 0) {
      throw new Error('没有有效的更新字段');
    }

    const setClause = updateFields.map(field => `${field} = ?`).join(', ');
    const values = updateFields.map(field => updates[field as keyof ProjectData]);
    values.push(projectId);

    const sql = `UPDATE projects SET ${setClause} WHERE project_id = ?`;
    const result = await db.query(sql, values);
    
    return (result as any).affectedRows > 0;
  }

  /**
   * 删除项目
   */
  static async delete(projectId: number, authorId: number): Promise<boolean> {
    const sql = 'DELETE FROM projects WHERE project_id = ? AND author_id = ?';
    const result = await db.query(sql, [projectId, authorId]);
    return (result as any).affectedRows > 0;
  }
}