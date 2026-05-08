import { Router } from 'express';
import { shareController } from '../controllers/shareController';

import { authMiddleware } from '../middleware/auth'; 

const router = Router();


router.post('/create', authMiddleware, shareController.createShareLink);

router.get('/comments-global', shareController.getProjectComments);

router.get('/view/:shareId', shareController.getSharedProject);




router.get('/:shareId/comments', shareController.getProjectComments);

router.post('/:shareId/comment', shareController.addShareComment);
router.delete('/comments/:commentId', shareController.deleteShareComment);

export default router;