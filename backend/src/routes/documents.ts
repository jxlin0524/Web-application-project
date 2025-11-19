import { Router } from 'express';
import { documentController } from '../controllers/documentController';
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

export default router;