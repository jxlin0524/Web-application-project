import { Router } from 'express';
import { projectController } from '../controllers/projectController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 所有项目路由都需要认证
router.use(authMiddleware);

/**
 * @route   POST /api/projects
 * @desc    创建新项目
 * @access  Private
 */
router.post('/', projectController.createProject);

/**
 * @route   GET /api/projects
 * @desc    获取用户的所有项目
 * @access  Private
 */
router.get('/', projectController.getUserProjects);

/**
 * @route   GET /api/projects/:id
 * @desc    获取特定项目详情
 * @access  Private
 */
router.get('/:id', projectController.getProject);

export default router;