import { db } from '../config/database';

export interface DocumentData {
  projectId: number;
  title: string;
  content?: string;
  displayOrder?: number;
  ai_summary?: string | null;
}

export interface DocumentRecord {
  document_id: number;
  project_id: number;
  title: string;
  content: string | null;
  display_order: number;
  created_at: Date;
  updated_at: Date;
  ai_summary: string | null;
}

interface DocumentContentRow {
  project_id: number;
  content: string | null;
}

const countWords = (text?: string | null): number => {
  if (!text) {
    return 0;
  }
  const normalized = text.trim().replace(/\s+/g, ' ');
  if (!normalized) {
    return 0;
  }
  return normalized.split(' ').length;
};

export class Document {

  static async create(documentData: DocumentData): Promise<number> {
    const { projectId, title, content, displayOrder } = documentData;

    if (!projectId || !title) {
      throw new Error('Project ID and document title are required');
    }

    let order = displayOrder;
    if (!order) {
      const maxOrderResult = await db.query(
        'SELECT MAX(display_order) as maxOrder FROM documents WHERE project_id = ?',
        [projectId]
      ) as any[];
      order = (maxOrderResult[0].maxOrder || 0) + 1;
    }

    const sql = `INSERT INTO documents (project_id, title, content, display_order) 
                 VALUES (?, ?, ?, ?)`;
    const insertId = await db.insert(sql, [projectId, title, content || '', order]);
    
    return insertId;
  }

  static async findById(documentId: number): Promise<DocumentRecord | null> {
    const sql = 'SELECT * FROM documents WHERE document_id = ?';
    const documents = await db.query(sql, [documentId]) as DocumentRecord[];
    return documents.length > 0 ? documents[0] : null;
  }

  static async findByProject(projectId: number): Promise<DocumentRecord[]> {
    const sql = 'SELECT * FROM documents WHERE project_id = ? ORDER BY display_order ASC';
    return await db.query(sql, [projectId]) as DocumentRecord[];
  }

  static async update(documentId: number, updates: Partial<DocumentData>): Promise<boolean> {
    const allowedFields = ['title', 'content', 'displayOrder', 'ai_summary'];
    const updateFields = Object.keys(updates).filter(key => 
      allowedFields.includes(key) && updates[key as keyof DocumentData] !== undefined
    );

    if (updateFields.length === 0) {
      throw new Error('No valid update fields');
    }

    if (updates.content !== undefined && updates.ai_summary === undefined) {
      updates.ai_summary = null;
      if (!updateFields.includes('ai_summary')) {
        updateFields.push('ai_summary');
      }
    }

    const fieldMapping: { [key: string]: string } = {
      displayOrder: 'display_order',
      ai_summary: 'ai_summary'
    };

    const setClause = updateFields.map(field => {
      const dbField = fieldMapping[field] || field;
      return `${dbField} = ?`;
    }).join(', ');

    const values = updateFields.map(field => updates[field as keyof DocumentData]);
    values.push(documentId);

    const sql = `UPDATE documents SET ${setClause} WHERE document_id = ?`;
    const result = await db.query(sql, values);
    
    return (result as any).affectedRows > 0;
  }

  static async delete(documentId: number): Promise<boolean> {
    const sql = 'DELETE FROM documents WHERE document_id = ?';
    const result = await db.query(sql, [documentId]);
    return (result as any).affectedRows > 0;
  }

  static async reorderDocuments(projectId: number, documentOrders: { documentId: number; displayOrder: number }[]): Promise<boolean> {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      for (const item of documentOrders) {
        await connection.execute(
          'UPDATE documents SET display_order = ? WHERE document_id = ? AND project_id = ?',
          [item.displayOrder, item.documentId, projectId]
        );
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async autoSave(documentId: number, content: string): Promise<boolean> {
    const sql = 'UPDATE documents SET content = ?, ai_summary = NULL, updated_at = CURRENT_TIMESTAMP WHERE document_id = ?';
    const result = await db.query(sql, [content, documentId]);
    return (result as any).affectedRows > 0;
  }

  static async batchAutoSave(saves: { documentId: number; content: string }[]): Promise<boolean> {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      for (const save of saves) {
        await connection.execute(
          'UPDATE documents SET content = ?, ai_summary = NULL, updated_at = CURRENT_TIMESTAMP WHERE document_id = ?',
          [save.content, save.documentId]
        );
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async getAutoSaveStatus(documentId: number): Promise<{ 
    document_id: number; 
    updated_at: Date;
    has_content: boolean;
  } | null> {
    const sql = 'SELECT document_id, updated_at, content IS NOT NULL as has_content FROM documents WHERE document_id = ?';
    const results = await db.query(sql, [documentId]) as any[];
    return results.length > 0 ? results[0] : null;
  }

  static async getWordCountsForProjects(projectIds: number[]): Promise<Record<number, number>> {
    if (!projectIds.length) {
      return {};
    }

    const placeholders = projectIds.map(() => '?').join(', ');
    const sql = `SELECT project_id, content FROM documents WHERE project_id IN (${placeholders})`;
    const rows = await db.query(sql, projectIds) as DocumentContentRow[];

    return rows.reduce<Record<number, number>>((acc, row) => {
      const current = acc[row.project_id] || 0;
      acc[row.project_id] = current + countWords(row.content);
      return acc;
    }, {});
  }

  static async checkExistsInProject(documentId: number, projectId: number): Promise<boolean> {
    const rows = await db.query(
      'SELECT document_id FROM documents WHERE document_id = ? AND project_id = ?',
      [documentId, projectId]
    )as any;
    return rows.length > 0;
  }
}