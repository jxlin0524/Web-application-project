import { Router } from 'express';
import { projectController } from '../controllers/projectController';
import { authMiddleware } from '../middleware/auth';
import { documentController } from '../controllers/documentController';
import { timelineController } from '../controllers/timelineController';
import { worldController } from '../controllers/worldController';
import { upload } from '../middleware/upload';

const router = Router();


router.use(authMiddleware);


/**
 * @route   PUT /api/projects/world-entries/:entryId
 * @desc        
 */
router.put('/world-entries/:entryId', upload.single('image'), worldController.update);

/**
 * @route   DELETE /api/projects/world-entries/:entryId
 * @desc    
 */
router.delete('/world-entries/:entryId', worldController.delete);




/**
 * @route   POST /api/projects
 * @desc    
 */
router.post('/', projectController.createProject);

/**
 * @route   GET /api/projects
 * @desc    
 */
router.get('/', projectController.getUserProjects);

router.get('/revisions/pending', projectController.getPendingRevisions);



// ==========================================

/**
 * @route   GET /api/projects/:id
 * @desc    
 */
router.get('/:projectId', projectController.getProject);

router.post('/:projectId/documents', documentController.createDocument);
router.get('/:projectId/documents', documentController.getProjectDocuments);

router.get('/:projectId/timeline', timelineController.getTimeline);
router.put('/:projectId/timeline', timelineController.saveTimeline);

router.get('/:projectId/world-entries', worldController.getAll); 
router.post('/:projectId/world-entries', upload.single('image'), worldController.create); 

export default router;