
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';


import { ProjectShare } from '../models/ProjectShare';
import { DocumentComment } from '../models/DocumentComment';
import { Project } from '../models/Project';
import { Document } from '../models/Document';

export const shareController = {
  
  
  createShareLink: async (req: Request, res: Response) => {
    try {
      const { projectId } = req.body;

      if (!projectId) {
        return res.status(400).json({ success: false, message: 'Missing projectId' });
      }

      console.log(`🔗 Creating share link for Project ID: ${projectId}...`);

      
      const shareId = uuidv4();
      
      const accessCode = Math.floor(1000 + Math.random() * 9000).toString();

      
      await ProjectShare.create({
          share_id: shareId,
          project_id: projectId,
          access_code: accessCode, 
          expires_at: null
      });

      console.log(` Share link created: ${shareId}, Code: ${accessCode}`);
      
      
      res.json({ 
          success: true, 
          shareId,
          accessCode 
      });

    } catch (error: any) {
      console.error(' Create Share Link Error:', error.message);
      res.status(500).json({ success: false, message: 'Failed to create share link' });
    }
  },

  
  getSharedProject: async (req: Request, res: Response) => {
    try {
      const { shareId } = req.params;
      const { password } = req.query; 

      if (!shareId) {
        return res.status(400).json({ success: false, message: 'Share link is missing' });
      }

      console.log(`📖 Accessing shared project: ${shareId}`);

      
      const shareData = await ProjectShare.findByShareId(shareId);

      if (!shareData) {
        console.warn(`⚠️ Invalid share link attempt: ${shareId}`);
        return res.status(404).json({ success: false, message: 'Invalid or expired share link' });
      }

      
      if (shareData.access_code && shareData.access_code !== password) {
          console.warn(`🔒 Access denied. Password required for share ${shareId}`);
          return res.status(403).json({ 
              success: false, 
              code: 'PASSWORD_REQUIRED', 
              message: 'Access code required' 
          });
      }

      const projectId = shareData.project_id;

      
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      
      const documents = await Document.findByProject(projectId);

      console.log(` Loaded project "${project.title}" with ${documents.length} chapters.`);

      res.json({
        success: true,
        data: {
          project,
          documents
        }
      });

    } catch (error: any) {
      console.error(' Get Shared Project Error:', error.message);
      res.status(500).json({ success: false, message: 'Failed to retrieve shared project' });
    }
  },

  
  addShareComment: async (req: Request, res: Response) => {
    try {
      const { shareId } = req.params;
      const { docId, selectedText, content, authorName, quoteMatchIndex } = req.body;

      if (!docId || !content) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      console.log(`💬 New comment on Doc ${docId} from ${authorName || 'Guest'}`);

      
      const shareData = await ProjectShare.findByShareId(shareId);

      if (!shareData) {
        return res.status(403).json({ success: false, message: 'Invalid share link permission' });
      }
      
      const projectId = shareData.project_id;

      
      const isValidDoc = await Document.checkExistsInProject(docId, projectId);
      
      if (!isValidDoc) {
        return res.status(400).json({ success: false, message: 'Document does not belong to this shared project' });
      }

      
      const result = await DocumentComment.create({
        document_id: docId,
        selected_text: selectedText,
        quote_match_index: quoteMatchIndex ?? 0, 
        content: content,
        author_name: authorName
      });

      console.log(` Comment saved successfully. ID: ${result.insertId}`);
      
      
      res.json({ 
          success: true, 
          message: 'Comment added successfully',
          commentId: result.insertId 
      });

    } catch (error: any) {
      console.error(' Add Comment Error:', error.message);
      res.status(500).json({ success: false, message: 'Failed to add comment' });
    }
  },

  
  getProjectComments: async (req: Request, res: Response) => {
    try {
        const { shareId } = req.params; 
        const { password } = req.query; 
        
        let targetProjectId: number | undefined;

        
        if (req.query.projectId) {
            targetProjectId = Number(req.query.projectId);
        }
        
        
        if (shareId && shareId !== 'comments-global' && !targetProjectId) {
            const shareData = await ProjectShare.findByShareId(shareId);
            
            if (shareData) {
                
                if (shareData.access_code && shareData.access_code !== password) {
                     return res.status(403).json({ success: false, message: 'Password required' });
                }
                targetProjectId = shareData.project_id;
            }
        }

        if (!targetProjectId) {
            return res.status(400).json({ success: false, message: 'Invalid Project or Share ID' });
        }

        
        const comments = await DocumentComment.findAllByProjectId(targetProjectId);

        console.log(` Fetched ${comments.length} comments for Project ${targetProjectId}`);
        res.json({ success: true, data: comments });

    } catch (error: any) {
        console.error(' Get All Comments Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to load comments' });
    }
  },

  
  deleteShareComment: async (req: Request, res: Response) => {
    try {
      const { commentId } = req.params;
      const { authorName } = req.body; 

      if (!commentId || !authorName) {
        return res.status(400).json({ success: false, message: 'Missing parameters' });
      }

      const success = await DocumentComment.delete(Number(commentId), authorName);

      if (success) {
        res.json({ success: true, message: 'Comment deleted' });
      } else {
        res.status(403).json({ success: false, message: 'Permission denied or comment not found' });
      }

    } catch (error: any) {
      console.error(' Delete Comment Error:', error.message);
      res.status(500).json({ success: false, message: 'Failed to delete comment' });
    }
  },

  
  
  getDocumentComments: async (req: Request, res: Response) => {
    try {
        const { docId } = req.params;

        if (!docId) return res.status(400).json({ success: false, message: 'Missing docId' });

        const comments = await DocumentComment.findAllByDocumentId(Number(docId));

        console.log(` Fetched ${comments.length} comments for Doc ${docId}`);
        res.json({ success: true, data: comments });

    } catch (error: any) {
        console.error(' Get Comments Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to load comments' });
    }
  }

};