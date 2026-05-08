import { db } from '../config/database';

export interface TimelineEventData {
  year?: string;
  title: string;
  description?: string;
  chapterId?: number;
  color?: string;
}

export interface TimelineEventRecord {
  id: number;
  project_id: number;
  year: string | null;
  title: string | null;
  description: string | null;
  chapter_id: number | null;
  color: string | null;
  created_at: Date;
}

export class TimelineEvent {
  static async findAllByProjectId(projectId: number): Promise<TimelineEventRecord[]> {
    const sql = 'SELECT * FROM timeline_events WHERE project_id = ? ORDER BY id ASC';
    return await db.query(sql, [projectId]) as TimelineEventRecord[];
  }

  static async replaceAll(projectId: number, events: TimelineEventData[]): Promise<boolean> {
    
    const deleteSql = 'DELETE FROM timeline_events WHERE project_id = ?';
    await db.query(deleteSql, [projectId]);

    if (!events || events.length === 0) {
      return true;
    }

    const values = events.map(e => [
      projectId,
      e.year || '',
      e.title || 'Untitled',
      e.description || null,
      e.chapterId || null,
      e.color || 'blue'
    ]);

    const flatValues = values.flat();

    const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
    
    const insertSql = `INSERT INTO timeline_events (project_id, year, title, description, chapter_id, color) VALUES ${placeholders}`;

    await db.query(insertSql, flatValues);

    return true;
  }
}