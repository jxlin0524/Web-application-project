import { db } from '../config/database';

export interface DocumentData {
  projectId: number;
  title: string;
  content?: string;
  displayOrder?: number;
}

export interface DocumentRecord {
  document_id: number;
  project_id: number;
  title: string;
  content: string | null;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

export class Document {
  /**
   * 创建新文档
   */
  static async create(documentData: DocumentData): Promise<number> {
    const { projectId, title, content, displayOrder } = documentData;

    // 验证输入
    if (!projectId || !title) {
      throw new Error('项目ID和文档标题是必填的');
    }

    // 如果没有提供显示顺序，自动计算下一个顺序
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

  /**
   * 根据文档ID查找文档
   */
  static async findById(documentId: number): Promise<DocumentRecord | null> {
    const sql = 'SELECT * FROM documents WHERE document_id = ?';
    const documents = await db.query(sql, [documentId]) as DocumentRecord[];
    return documents.length > 0 ? documents[0] : null;
  }

  /**
   * 获取项目的所有文档
   */
  static async findByProject(projectId: number): Promise<DocumentRecord[]> {
    const sql = 'SELECT * FROM documents WHERE project_id = ? ORDER BY display_order ASC';
    return await db.query(sql, [projectId]) as DocumentRecord[];
  }

  /**
   * 更新文档
   */
  static async update(documentId: number, updates: Partial<DocumentData>): Promise<boolean> {
    const allowedFields = ['title', 'content', 'displayOrder'];
    const updateFields = Object.keys(updates).filter(key => 
      allowedFields.includes(key) && updates[key as keyof DocumentData] !== undefined
    );

    if (updateFields.length === 0) {
      throw new Error('没有有效的更新字段');
    }

    // 处理字段名映射（JavaScript camelCase 到数据库 snake_case）
    const fieldMapping: { [key: string]: string } = {
      displayOrder: 'display_order'
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

  /**
   * 删除文档
   */
  static async delete(documentId: number): Promise<boolean> {
    const sql = 'DELETE FROM documents WHERE document_id = ?';
    const result = await db.query(sql, [documentId]);
    return (result as any).affectedRows > 0;
  }

  /**
   * 重新排序文档
   */
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
}