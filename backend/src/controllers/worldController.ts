import { Request, Response } from 'express';
import { WorldEntry } from '../models/WorldEntry';

export const worldController = {
  getAll: async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      const list = await WorldEntry.findAllByProjectId(Number(projectId));
      res.json({ success: true, data: list });
    } catch (e: any) { 
      res.status(500).json({ success: false, message: 'Fetch failed' }); 
    }
  },



  create: async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      const { name, content } = req.body;
      if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
      
      
      const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

      const result = await WorldEntry.create({ 
        project_id: Number(projectId), 
        name, 
        content,
        image_url: imageUrl 
      });
      res.json({ success: true, entryId: result.insertId });
    } catch (e: any) { 
      res.status(500).json({ success: false, message: 'Create failed' }); 
    }
  },


  delete: async (req: Request, res: Response) => {
    try {
      await WorldEntry.delete(Number(req.params.entryId));
      res.json({ success: true });
    } catch (e: any) { 
      res.status(500).json({ success: false, message: 'Delete failed' }); 
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const entryId = Number(req.params.entryId);
      const { name, content } = req.body;
      if (!name) return res.status(400).json({ success: false, message: 'Name is required' });

      
      const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

      await WorldEntry.update(entryId, { name, content, image_url: imageUrl });
      res.json({ success: true, message: 'Updated successfully' });
    } catch (e: any) {
      res.status(500).json({ success: false, message: 'Update failed' });
    }
  },
};