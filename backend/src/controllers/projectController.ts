import { Request, Response } from 'express';
import { Project, ProjectData } from '../models/Project';
import { Document } from '../models/Document';
import { DocumentComment } from '../models/DocumentComment'; 
import { AuthRequest } from '../middleware/auth';

export const projectController = {
  
  createProject: async (req: AuthRequest, res: Response) => {
    try {
      const { title, description, genre } = req.body;
      const authorId = req.user?.userId;

      if (!authorId) return res.status(401).json({ success: false, message: 'User not authenticated' });
      if (!title || title.trim().length === 0) return res.status(400).json({ success: false, message: 'The title of the project is required' });
      if (title.length > 255) return res.status(400).json({ success: false, message: 'The title of the project cannot exceed 255 characters' });

      const projectId = await Project.create({
        title: title.trim(),
        description: description?.trim(),
        authorId,
        genre
      });

      const project = await Project.findById(projectId);

      res.status(201).json({
        success: true,
        message: 'Project created successfully',
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
      res.status(500).json({ success: false, message: 'Failed to create the project, please try again later' });
    }
  },

  getUserProjects: async (req: AuthRequest, res: Response) => {
    try {
      const authorId = req.user?.userId;
      if (!authorId) return res.status(401).json({ success: false, message: 'User not authenticated' });

      const projects = await Project.findByAuthor(authorId);
      const projectIds = projects.map(project => project.project_id);
      const wordCounts = await Document.getWordCountsForProjects(projectIds);

      res.json({
        success: true,
        data: {
          projects: projects.map(project => ({
            project_id: project.project_id,
            title: project.title,
            description: project.description,
            author_id: project.author_id,
            created_at: project.created_at,
            word_count: wordCounts[project.project_id] || 0
          }))
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to get the project list' });
    }
  },

  
  getPendingRevisions: async (req: AuthRequest, res: Response) => {
    try {
      const authorId = req.user?.userId;
      if (!authorId) return res.status(401).json({ success: false, message: 'User not authenticated' });

      const revisions = await DocumentComment.findAllPendingByAuthorId(authorId);
      res.json({ success: true, data: revisions });
    } catch (error) {
      console.error('Error in getting the pending revisions:', error);
      res.status(500).json({ success: false, message: 'Failed to get the pending revisions' });
    }
  },

  getProject: async (req: AuthRequest, res: Response) => {
    try {
      const projectId = parseInt(req.params.id || req.params.projectId);
      const authorId = req.user?.userId;

      if (!authorId) return res.status(401).json({ success: false, message: 'User not authenticated' });
      if (isNaN(projectId)) return res.status(400).json({ success: false, message: 'Invalid project ID' });

      const project = await Project.findById(projectId);
      if (!project) return res.status(404).json({ success: false, message: 'The project does not exist' });

      if (project.author_id !== authorId) {
        return res.status(403).json({ success: false, message: 'No right to access this project' });
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
      res.status(500).json({ success: false, message: 'Failed to get the details of the project' });
    }
  }
};