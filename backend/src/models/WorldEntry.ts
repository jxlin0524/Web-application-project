import { db } from '../config/database';

export interface WorldEntryData {
  id?: number;
  project_id: number;
  name: string;
  content: string; 
  image_url?: string;
}

export class WorldEntry {
  static async findAllByProjectId(projectId: number): Promise<WorldEntryData[]> {
    const rows = await db.query(
      'SELECT * FROM world_entries WHERE project_id = ? ORDER BY id DESC', 
      [projectId]
    ) as any;
    return Array.isArray(rows) ? rows as WorldEntryData[] : [];
  }

  static async create(data: WorldEntryData): Promise<any> {
    const result = await db.query(
      'INSERT INTO world_entries (project_id, name, content, image_url) VALUES (?, ?, ?, ?)',
      [data.project_id, data.name, data.content || '', data.image_url || null]
    ) as any;
    return result;
  }

  static async delete(id: number): Promise<void> {
    await db.query('DELETE FROM world_entries WHERE id = ?', [id]);
  }

  static async update(id: number, data: { name: string; content: string; image_url?: string }): Promise<void> {
    if (data.image_url !== undefined) {
       await db.query(
        'UPDATE world_entries SET name = ?, content = ?, image_url = ? WHERE id = ?',
        [data.name, data.content, data.image_url, id]
      );
    } else {
       await db.query(
        'UPDATE world_entries SET name = ?, content = ? WHERE id = ?',
        [data.name, data.content, id]
      );
    }
  }
}