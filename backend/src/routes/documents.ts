import { Router } from 'express';
import { documentController } from '../controllers/documentController';
import { autoSaveController } from '../controllers/autoSaveController';
import { authMiddleware } from '../middleware/auth';

const router = Router();


router.use(authMiddleware);

/**
 * @route   
 * @desc    
 * @access  Private
 */
router.post('/projects/:projectId/documents', documentController.createDocument);

/**
 * @route   GET /api/projects/:projectId/documents
 * @desc    
 * @access  Private
 */
router.get('/projects/:projectId/documents', documentController.getProjectDocuments);

/**
 * @route   PUT /api/documents/batch-autosave
 * @desc    
 * @access  Private
 */
router.put('/batch-autosave', autoSaveController.batchAutoSave);

/**
 * @route   GET /api/documents/:documentId
 * @desc    
 * @access  Private
 */
router.get('/:documentId', documentController.getDocument);

/**
 * @route   PUT /api/documents/:documentId
 * @desc    
 * @access  Private
 */
router.put('/:documentId', documentController.updateDocument);

/**
 * @route   PUT /api/documents/:id/autosave
 * @desc    
 * @access  Private
 */
router.put('/:id/autosave', autoSaveController.autoSaveDocument);


/**
 * @route   GET /api/documents/:id/autosave-status
 * @desc    
 * @access  Private
 */
router.get('/:id/autosave-status', autoSaveController.getAutoSaveStatus);

router.post('/:docId/comments', authMiddleware, documentController.addAuthorComment);

export default router;