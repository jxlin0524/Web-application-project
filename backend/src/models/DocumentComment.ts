import { db } from '../config/database';

export interface DocumentCommentData {
  comment_id?: number;
  document_id: number;
  selected_text: string;
  quote_match_index: number;
  content: string;
  author_name: string;
  status?: string;
  created_at?: Date;
  document_title?: string;
}

export class DocumentComment {
  
  // 创建批注
  static async create(data: DocumentCommentData): Promise<any> {
    const result = await db.query(
      `INSERT INTO document_comments 
      (document_id, selected_text, quote_match_index, content, author_name, status) 
      VALUES (?, ?, ?, ?, ?, 'open')`,
      [data.document_id, data.selected_text || '', data.quote_match_index || 0, data.content, data.author_name || 'Guest']
    );
    return result;
  }

  // 获取某文档的所有批注
  static async findAllByDocumentId(documentId: number): Promise<DocumentCommentData[]> {
    const rows = await db.query(
      `SELECT * FROM document_comments 
       WHERE document_id = ? 
       ORDER BY created_at DESC`,
      [documentId]
    )as any;
    return rows as DocumentCommentData[];
  }

  // 获取整个项目的所有评论 (跨章节)
  static async findAllByProjectId(projectId: number): Promise<DocumentCommentData[]> {
    const rows = await db.query(
      `SELECT dc.*, d.title as document_title 
       FROM document_comments dc
       JOIN documents d ON dc.document_id = d.document_id
       WHERE d.project_id = ?
       ORDER BY dc.created_at DESC`,
      [projectId]
    ) as any;
    
    return rows as DocumentCommentData[];
  }

  // 🟢 [新增] 获取某个作者所有项目的最新批注提醒 (用于 Dashboard 联表查询)
  static async findAllPendingByAuthorId(authorId: number): Promise<any[]> {
    const rows = await db.query(
      `SELECT 
         dc.comment_id, 
         dc.content as comment_content, 
         dc.author_name as reviewer_name, 
         dc.created_at,
         d.document_id,
         d.title as chapter_title,
         p.project_id,
         p.title as project_title
       FROM document_comments dc
       JOIN documents d ON dc.document_id = d.document_id
       JOIN projects p ON d.project_id = p.project_id
       WHERE p.author_id = ?
       ORDER BY dc.created_at DESC
      LIMIT 10`,
      [authorId]
    ) as any;
    return rows;
  }

  static async delete(commentId: number, authorName: string): Promise<boolean> {
    const result = await db.query(
      'DELETE FROM document_comments WHERE comment_id = ? AND author_name = ?',
      [commentId, authorName]
    ) as any; 

    return result.affectedRows > 0;
  }
}