import { Router } from 'express';
import { documentController } from '../controllers/documentController';
import { autoSaveController } from '../controllers/autoSaveController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 所有文档路由都需要认证
router.use(authMiddleware);

/**
 * @route   POST /api/projects/:projectId/documents
 * @desc    在项目中创建新文档
 * @access  Private
 */
router.post('/projects/:projectId/documents', documentController.createDocument);

/**
 * @route   GET /api/projects/:projectId/documents
 * @desc    获取项目的所有文档
 * @access  Private
 */
router.get('/projects/:projectId/documents', documentController.getProjectDocuments);

/**
 * @route   PUT /api/documents/batch-autosave
 * @desc    批量自动保存多个文档
 * @access  Private
 */
router.put('/batch-autosave', autoSaveController.batchAutoSave);

/**
 * @route   GET /api/documents/:documentId
 * @desc    获取特定文档详情
 * @access  Private
 */
router.get('/:documentId', documentController.getDocument);

/**
 * @route   PUT /api/documents/:documentId
 * @desc    更新文档
 * @access  Private
 */
router.put('/:documentId', documentController.updateDocument);

/**
 * @route   PUT /api/documents/:id/autosave
 * @desc    自动保存文档内容
 * @access  Private
 */
router.put('/:id/autosave', autoSaveController.autoSaveDocument);


/**
 * @route   GET /api/documents/:id/autosave-status
 * @desc    获取文档自动保存状态
 * @access  Private
 */
router.get('/:id/autosave-status', autoSaveController.getAutoSaveStatus);

export default router;