import { Request, Response } from 'express';
import { Document, DocumentData } from '../models/Document';
import { Project } from '../models/Project';
import { AuthRequest } from '../middleware/auth';
import { DocumentComment } from '../models/DocumentComment';

export const documentController = {
  
  createDocument: async (req: AuthRequest, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { title, content, displayOrder } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      if (isNaN(projectId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid project ID'
        });
      }

      
      if (!title || title.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'The title of the document is required'
        });
      }

      
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'The project does not exist'
        });
      }

      if (project.author_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'No right to create a document in this project'
        });
      }

      
      const documentId = await Document.create({
        projectId,
        title: title.trim(),
        content: content?.trim(),
        displayOrder
      });

      
      const document = await Document.findById(documentId);

      res.status(201).json({
        success: true,
        message: 'Document created successfully',
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
      console.error('Error in creating the document:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create the document, please try again later'
      });
    }
  },

  
  getProjectDocuments: async (req: AuthRequest, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      if (isNaN(projectId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid project ID'
        });
      }

      
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'The project does not exist'
        });
      }

      if (project.author_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'No right to access the documents of this project'
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
            updated_at: doc.updated_at,
            ai_summary: doc.ai_summary
          }))
        }
      });

    } catch (error) {
      console.error('Error in getting the documents of the project:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get the documents of the project'
      });
    }
  },

  
  getDocument: async (req: AuthRequest, res: Response) => {
    try {
      const documentId = parseInt(req.params.documentId);
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
            updated_at: document.updated_at,
            ai_summary: document.ai_summary
          }
        }
      });

    } catch (error) {
      console.error('Error in getting the details of the document:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get the details of the document'
      });
    }
  },

  
  updateDocument: async (req: AuthRequest, res: Response) => {
    try {
      const documentId = parseInt(req.params.documentId);
      const { title, content, displayOrder } = req.body;
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
          message: 'No right to update this document'
        });
      }

      
      const updates: Partial<DocumentData> = {};
      if (title !== undefined) updates.title = title;
      if (content !== undefined) updates.content = content;
      if (displayOrder !== undefined) updates.displayOrder = displayOrder;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No update fields provided'
        });
      }

      const success = await Document.update(documentId, updates);

      if (!success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to update the document'
        });
      }

      
      const updatedDocument = await Document.findById(documentId);

      res.json({
        success: true,
        message: 'Document updated successfully',
        data: {
          document: updatedDocument
        }
      });

    } catch (error: any) {
      console.error('Error in updating the document:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update the document, please try again later'
      });
    }
  },

  addAuthorComment: async (req: Request, res: Response) => {
    try {
      const { docId } = req.params;
      const { selectedText, content, quoteMatchIndex } = req.body;
    
      const authorName = (req as any).user?.username || 'Author'; 

      const result = await DocumentComment.create({
        document_id: Number(docId),
        selected_text: selectedText,
        quote_match_index: quoteMatchIndex ?? 0,
        content: content,
        author_name: authorName 
      });

      res.json({ 
          success: true, 
          commentId: result.insertId,
          authorName: authorName 
      });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Failed to add author comment' });
    }
  }
};