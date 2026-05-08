import { Request, Response } from 'express';
import { Document } from '../models/Document';
import { Project } from '../models/Project';
import { AuthRequest } from '../middleware/auth';

export const autoSaveController = {
  
  autoSaveDocument: async (req: AuthRequest, res: Response) => {
    try {
      const documentId = parseInt(req.params.id);
      const { content } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      if (isNaN(documentId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid document ID'
        });
      }

      
      if (content === undefined) {
        return res.status(400).json({
          success: false,
          message: 'The content of the document is essential.'
        });
      }

      
      const document = await Document.findById(documentId);
      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'The document does not exist.'
        });
      }

      const project = await Project.findById(document.project_id);
      if (!project || project.author_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Have no right to save this document'
        });
      }

      
      const success = await Document.autoSave(documentId, content);

      if (!success) {
        return res.status(500).json({
          success: false,
          message: 'Automatic saving failed'
        });
      }

      
      const savedDocument = await Document.findById(documentId);

      res.json({
        success: true,
        message: 'The document has been automatically saved.',
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
      console.error('Error in automatic document saving:', error);
      res.status(500).json({
        success: false,
        message: 'Automatic saving failed. Please try again later.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  
  batchAutoSave: async (req: AuthRequest, res: Response) => {
  try {
    console.log('=== Batch automatic save request initiated. ===');
    console.log('Request Method:', req.method);
    console.log('Request URL:', req.url);
    console.log('Request head:', req.headers);
    console.log('Request body:', req.body);
    console.log('user ID:', req.user?.userId);
    console.log('Batch automatic save request:', {
      body: req.body,
      user: req.user
    });

    const { saves } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
        
    if (!saves) {
      console.log(' The "saves" parameter does not exist.');
      return res.status(400).json({
        success: false,
        message: 'Missing "saves" parameter'
      });
    }


    if (!Array.isArray(saves) || saves.length === 0) {
      console.log('Invalid "saves" parameter:', saves);
      return res.status(400).json({
        success: false,
        message: 'The array of documents to be saved needs to be provided.',
        received: saves
      });
    }

    if (saves.length === 0) {
      console.log('saves array is empty');
      return res.status(400).json({
        success: false,
        message: 'saves array cannot be empty'
      });
    }

    
    for (const [index, save] of saves.entries()) {
      console.log(`Verify the ${index + 1}th document:`, save);
      
      if (!save.documentId || isNaN(parseInt(save.documentId))) {
        return res.status(400).json({
          success: false,
          message: `The ID of the ${index + 1}th document is invalid: ${save.documentId}`,
          index: index,
          documentId: save.documentId
        });
      }

      const documentId = parseInt(save.documentId);
      const document = await Document.findById(documentId);
      
      if (!document) {
        return res.status(404).json({
          success: false,
          message: `The document ${documentId} does not exist`,
          documentId: documentId
        });
      }

      const project = await Project.findById(document.project_id);
      if (!project || project.author_id !== userId) {
        return res.status(403).json({
          success: false,
          message: `No right to save the document ${documentId}`
        });
      }
    }

    
    const success = await Document.batchAutoSave(saves);

    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Batch automatic saving failed'
      });
    }

    res.json({
      success: true,
      message: `${saves.length} documents have been automatically saved`,
      data: {
        saved_count: saves.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Batch automatic saving error:', error);
    res.status(500).json({
      success: false,
      message: 'Batch automatic saving failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
},

  
  getAutoSaveStatus: async (req: AuthRequest, res: Response) => {
    try {
      const documentId = parseInt(req.params.id);
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      if (isNaN(documentId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid document ID'
        });
      }

      
      const document = await Document.findById(documentId);
      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'The document does not exist'
        });
      }

      const project = await Project.findById(document.project_id);
      if (!project || project.author_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'No right to access this document'
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
            is_recent: Date.now() - new Date(status.updated_at).getTime() < 24 * 60 * 60 * 1000 
          } : null
        }
      });

    } catch (error) {
      console.error('Error in getting the automatic save status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get the automatic save status'
      });
    }
  }
};