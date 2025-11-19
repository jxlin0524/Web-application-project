// src/routes/users.ts - 确保这是完整内容
import { Router } from 'express';
import { userController } from '../controllers/userController';

const router = Router();

/**
 * @route   POST /api/users/register
 * @desc    用户注册
 * @access  Public
 */
router.post('/register', userController.register);

/**
 * @route   GET /api/users/profile
 * @desc    获取用户信息
 * @access  Private (后续添加认证中间件)
 */
router.get('/profile', userController.getProfile);

/**
 * @route   GET /api/users
 * @desc    获取用户列表（后续用于管理）
 * @access  Private
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: '用户列表接口',
    data: []
  });
});

// 确保这行存在且正确
export default router;