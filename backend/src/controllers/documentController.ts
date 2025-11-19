import { Request, Response } from 'express';
import { Document, DocumentData } from '../models/Document';
import { Project } from '../models/Project';
import { AuthRequest } from '../middleware/auth';

export const documentController = {
  /**
   * 在项目中创建新文档
   * POST /api/projects/:projectId/documents
   */
  createDocument: async (req: AuthRequest, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { title, content, displayOrder } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '用户未认证'
        });
      }

      if (isNaN(projectId)) {
        return res.status(400).json({
          success: false,
          message: '无效的项目ID'
        });
      }

      // 验证输入
      if (!title || title.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: '文档标题是必填的'
        });
      }

      // 检查项目是否存在且用户有权限
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: '项目不存在'
        });
      }

      if (project.author_id !== userId) {
        return res.status(403).json({
          success: false,
          message: '无权在此项目中创建文档'
        });
      }

      // 创建文档
      const documentId = await Document.create({
        projectId,
        title: title.trim(),
        content: content?.trim(),
        displayOrder
      });

      // 获取创建的文档信息
      const document = await Document.findById(documentId);

      res.status(201).json({
        success: true,
        message: '文档创建成功',
        data: {
          document: {
            document_id: document?.document_id,
            project_id: document?.project_id,
            title: document?.title,
            content: document?.content,
            display_order: document?.display_order,
            created_at: document?.created_at
          }
        }
      });

    } catch (error: any) {
      console.error('创建文档错误:', error);
      res.status(500).json({
        success: false,
        message: '创建文档失败，请稍后重试'
      });
    }
  },

  /**
   * 获取项目的所有文档
   * GET /api/projects/:projectId/documents
   */
  getProjectDocuments: async (req: AuthRequest, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '用户未认证'
        });
      }

      if (isNaN(projectId)) {
        return res.status(400).json({
          success: false,
          message: '无效的项目ID'
        });
      }

      // 检查项目权限
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: '项目不存在'
        });
      }

      if (project.author_id !== userId) {
        return res.status(403).json({
          success: false,
          message: '无权访问此项目的文档'
        });
      }

      const documents = await Document.findByProject(projectId);

      res.json({
        success: true,
        data: {
          project: {
            project_id: project.project_id,
            title: project.title
          },
          documents: documents.map(doc => ({
            document_id: doc.document_id,
            title: doc.title,
            content: doc.content,
            display_order: doc.display_order,
            created_at: doc.created_at,
            updated_at: doc.updated_at
          }))
        }
      });

    } catch (error) {
      console.error('获取项目文档错误:', error);
      res.status(500).json({
        success: false,
        message: '获取文档列表失败'
      });
    }
  },

  /**
   * 获取特定文档详情
   * GET /api/documents/:documentId
   */
  getDocument: async (req: AuthRequest, res: Response) => {
    try {
      const documentId = parseInt(req.params.documentId);
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '用户未认证'
        });
      }

      if (isNaN(documentId)) {
        return res.status(400).json({
          success: false,
          message: '无效的文档ID'
        });
      }

      const document = await Document.findById(documentId);

      if (!document) {
        return res.status(404).json({
          success: false,
          message: '文档不存在'
        });
      }

      // 检查用户是否有权限访问该文档所属的项目
      const project = await Project.findById(document.project_id);
      if (!project || project.author_id !== userId) {
        return res.status(403).json({
          success: false,
          message: '无权访问此文档'
        });
      }

      res.json({
        success: true,
        data: {
          document: {
            document_id: document.document_id,
            project_id: document.project_id,
            title: document.title,
            content: document.content,
            display_order: document.display_order,
            created_at: document.created_at,
            updated_at: document.updated_at
          }
        }
      });

    } catch (error) {
      console.error('获取文档详情错误:', error);
      res.status(500).json({
        success: false,
        message: '获取文档详情失败'
      });
    }
  },

  /**
   * 更新文档
   * PUT /api/documents/:documentId
   */
  updateDocument: async (req: AuthRequest, res: Response) => {
    try {
      const documentId = parseInt(req.params.documentId);
      const { title, content, displayOrder } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '用户未认证'
        });
      }

      if (isNaN(documentId)) {
        return res.status(400).json({
          success: false,
          message: '无效的文档ID'
        });
      }

      // 检查文档是否存在且用户有权限
      const document = await Document.findById(documentId);
      if (!document) {
        return res.status(404).json({
          success: false,
          message: '文档不存在'
        });
      }

      const project = await Project.findById(document.project_id);
      if (!project || project.author_id !== userId) {
        return res.status(403).json({
          success: false,
          message: '无权更新此文档'
        });
      }

      // 更新文档
      const updates: Partial<DocumentData> = {};
      if (title !== undefined) updates.title = title;
      if (content !== undefined) updates.content = content;
      if (displayOrder !== undefined) updates.displayOrder = displayOrder;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          success: false,
          message: '没有提供更新字段'
        });
      }

      const success = await Document.update(documentId, updates);

      if (!success) {
        return res.status(500).json({
          success: false,
          message: '更新文档失败'
        });
      }

      // 获取更新后的文档
      const updatedDocument = await Document.findById(documentId);

      res.json({
        success: true,
        message: '文档更新成功',
        data: {
          document: updatedDocument
        }
      });

    } catch (error: any) {
      console.error('更新文档错误:', error);
      res.status(500).json({
        success: false,
        message: '更新文档失败，请稍后重试'
      });
    }
  }
};