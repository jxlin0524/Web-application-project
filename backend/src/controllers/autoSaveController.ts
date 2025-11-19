import { Request, Response } from 'express';
import { Document } from '../models/Document';
import { Project } from '../models/Project';
import { AuthRequest } from '../middleware/auth';

export const autoSaveController = {
  /**
   * 自动保存文档内容
   * PUT /api/documents/:id/autosave
   */
  autoSaveDocument: async (req: AuthRequest, res: Response) => {
    try {
      const documentId = parseInt(req.params.id);
      const { content } = req.body;
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

      // 验证内容
      if (content === undefined) {
        return res.status(400).json({
          success: false,
          message: '文档内容是必需的'
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
          message: '无权保存此文档'
        });
      }

      // 执行自动保存
      const success = await Document.autoSave(documentId, content);

      if (!success) {
        return res.status(500).json({
          success: false,
          message: '自动保存失败'
        });
      }

      // 获取保存后的状态
      const savedDocument = await Document.findById(documentId);

      res.json({
        success: true,
        message: '文档已自动保存',
        data: {
          document: {
            document_id: savedDocument?.document_id,
            updated_at: savedDocument?.updated_at,
            content_length: content.length
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('自动保存文档错误:', error);
      res.status(500).json({
        success: false,
        message: '自动保存失败，请稍后重试',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * 批量自动保存多个文档
   * PUT /api/documents/batch-autosave
   */
  batchAutoSave: async (req: AuthRequest, res: Response) => {
  try {
    console.log('=== 批量自动保存请求开始 ===');
    console.log('请求方法:', req.method);
    console.log('请求URL:', req.url);
    console.log('请求头:', req.headers);
    console.log('请求体:', req.body);
    console.log('用户ID:', req.user?.userId);
    console.log('批量自动保存请求:', {
      body: req.body,
      user: req.user
    });

    const { saves } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未认证'
      });
    }
        // 检查 saves 是否存在且是数组
    if (!saves) {
      console.log('❌ saves 参数不存在');
      return res.status(400).json({
        success: false,
        message: '缺少 saves 参数'
      });
    }


    if (!Array.isArray(saves) || saves.length === 0) {
      console.log('无效的 saves 参数:', saves);
      return res.status(400).json({
        success: false,
        message: '需要提供保存的文档数组',
        received: saves
      });
    }

    if (saves.length === 0) {
      console.log('❌ saves 数组为空');
      return res.status(400).json({
        success: false,
        message: 'saves 数组不能为空'
      });
    }

    // 验证每个保存项
    for (const [index, save] of saves.entries()) {
      console.log(`验证第 ${index + 1} 个文档:`, save);
      
      if (!save.documentId || isNaN(parseInt(save.documentId))) {
        return res.status(400).json({
          success: false,
          message: `第 ${index + 1} 个文档的ID无效: ${save.documentId}`,
          index: index,
          documentId: save.documentId
        });
      }

      const documentId = parseInt(save.documentId);
      const document = await Document.findById(documentId);
      
      if (!document) {
        return res.status(404).json({
          success: false,
          message: `文档 ${documentId} 不存在`,
          documentId: documentId
        });
      }

      const project = await Project.findById(document.project_id);
      if (!project || project.author_id !== userId) {
        return res.status(403).json({
          success: false,
          message: `无权保存文档 ${documentId}`
        });
      }
    }

    // 执行批量保存
    const success = await Document.batchAutoSave(saves);

    if (!success) {
      return res.status(500).json({
        success: false,
        message: '批量自动保存失败'
      });
    }

    res.json({
      success: true,
      message: `${saves.length} 个文档已自动保存`,
      data: {
        saved_count: saves.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('批量自动保存错误:', error);
    res.status(500).json({
      success: false,
      message: '批量自动保存失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
},

  /**
   * 获取文档自动保存状态
   * GET /api/documents/:id/autosave-status
   */
  getAutoSaveStatus: async (req: AuthRequest, res: Response) => {
    try {
      const documentId = parseInt(req.params.id);
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

      // 检查文档权限
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
          message: '无权访问此文档'
        });
      }

      const status = await Document.getAutoSaveStatus(documentId);

      res.json({
        success: true,
        data: {
          document_id: documentId,
          status: status ? {
            last_updated: status.updated_at,
            has_content: status.has_content,
            is_recent: Date.now() - new Date(status.updated_at).getTime() < 24 * 60 * 60 * 1000 // 24小时内
          } : null
        }
      });

    } catch (error) {
      console.error('获取自动保存状态错误:', error);
      res.status(500).json({
        success: false,
        message: '获取保存状态失败'
      });
    }
  }
};