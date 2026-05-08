
import { Router } from 'express';
import { userController } from '../controllers/userController';
import { authController } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * @route   POST /api/users/register
 * @desc    
 * @access  Public
 */
router.post('/register', userController.register);
router.post('/login', authController.login);

/**
 * @route   GET /api/users/profile
 * @desc    
 * @access  
 */
router.get('/profile', userController.getProfile);
router.get('/me', authMiddleware, authController.getCurrentUser);
router.get('/profile', authMiddleware, userController.getProfile);

/**
 * @route   GET /api/users
 * @desc    
 * @access  Private
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'User list interface',
    data: []
  });
});


export default router;