import { Request, Response } from 'express';
import { TimelineEvent } from '../models/TimelineEvent';

export const timelineController = {
  getTimeline: async (req: Request, res: Response) => {
    try {
      const projectId = Number(req.params.projectId);
      
      const rows = await TimelineEvent.findAllByProjectId(projectId);

      
      const events = rows.map(row => ({
        id: row.id,
        year: row.year,
        title: row.title,
        description: row.description,
        chapterId: row.chapter_id,
        color: row.color
      }));

      res.json({ success: true, data: events });
    } catch (error: any) {
      console.error('Get Timeline Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  
  saveTimeline: async (req: Request, res: Response) => {
    try {
      const projectId = Number(req.params.projectId);
      const { events } = req.body;

      if (!Array.isArray(events)) {
        return res.status(400).json({ success: false, message: 'Invalid data format' });
      }

      await TimelineEvent.replaceAll(projectId, events);

      res.json({ success: true, message: 'Timeline saved successfully' });
    } catch (error: any) {
      console.error('Save Timeline Error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
};