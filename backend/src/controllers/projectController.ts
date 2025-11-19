import { Request, Response } from 'express';
import { Project, ProjectData } from '../models/Project';
import { AuthRequest } from '../middleware/auth';

export const projectController = {
  /**
   * 创建新项目
   * POST /api/projects
   */
  createProject: async (req: AuthRequest, res: Response) => {
    try {
      const { title, description, genre } = req.body;
      const authorId = req.user?.userId;

      if (!authorId) {
        return res.status(401).json({
          success: false,
          message: '用户未认证'
        });
      }

      // 验证输入
      if (!title || title.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: '项目标题是必填的'
        });
      }

      if (title.length > 255) {
        return res.status(400).json({
          success: false,
          message: '项目标题不能超过255个字符'
        });
      }

      // 创建项目
      const projectId = await Project.create({
        title: title.trim(),
        description: description?.trim(),
        authorId,
        genre
      });

      // 获取创建的项目信息
      const project = await Project.findById(projectId);

      res.status(201).json({
        success: true,
        message: '项目创建成功',
        data: {
          project: {
            project_id: project?.project_id,
            title: project?.title,
            description: project?.description,
            author_id: project?.author_id,
            created_at: project?.created_at
          }
        }
      });

    } catch (error: any) {
      console.error('创建项目错误:', error);
      res.status(500).json({
        success: false,
        message: '创建项目失败，请稍后重试'
      });
    }
  },

  /**
   * 获取用户的所有项目
   * GET /api/projects
   */
  getUserProjects: async (req: AuthRequest, res: Response) => {
    try {
      const authorId = req.user?.userId;

      if (!authorId) {
        return res.status(401).json({
          success: false,
          message: '用户未认证'
        });
      }

      const projects = await Project.findByAuthor(authorId);

      res.json({
        success: true,
        data: {
          projects: projects.map(project => ({
            project_id: project.project_id,
            title: project.title,
            description: project.description,
            author_id: project.author_id,
            created_at: project.created_at
          }))
        }
      });

    } catch (error) {
      console.error('获取用户项目错误:', error);
      res.status(500).json({
        success: false,
        message: '获取项目列表失败'
      });
    }
  },

  /**
   * 获取特定项目详情
   * GET /api/projects/:id
   */
  getProject: async (req: AuthRequest, res: Response) => {
    try {
      const projectId = parseInt(req.params.id);
      const authorId = req.user?.userId;

      if (!authorId) {
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

      const project = await Project.findById(projectId);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: '项目不存在'
        });
      }

      // 检查用户是否有权限访问该项目
      if (project.author_id !== authorId) {
        return res.status(403).json({
          success: false,
          message: '无权访问此项目'
        });
      }

      res.json({
        success: true,
        data: {
          project: {
            project_id: project.project_id,
            title: project.title,
            description: project.description,
            author_id: project.author_id,
            created_at: project.created_at
          }
        }
      });

    } catch (error) {
      console.error('获取项目详情错误:', error);
      res.status(500).json({
        success: false,
        message: '获取项目详情失败'
      });
    }
  }
};