import { Request, Response } from 'express';
import { User } from '../models/User';
import { jwtUtils } from '../utils/jwt';
import { AuthRequest } from '../middleware/auth';

export const authController = {
  /**
   * 用户登录
   * POST /api/users/login
   */
  login: async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      // 验证输入
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: '用户名和密码是必填的'
        });
      }

      // 查找用户（通过用户名或邮箱）
      let user = await User.findByUsername(username);
      if (!user) {
        // 如果不是用户名，尝试作为邮箱查找
        user = await User.findByEmail(username);
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: '用户名或密码错误'
        });
      }

      // 验证密码
      const isPasswordValid = await User.verifyPassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: '用户名或密码错误'
        });
      }

      // 生成 JWT token
      const token = jwtUtils.generateToken({
        userId: user.user_id,
        username: user.user_name
      });

      res.json({
        success: true,
        message: '登录成功',
        data: {
          user: {
            user_id: user.user_id,
            username: user.user_name,
            email: user.email
          },
          token,
          expires_in: process.env.JWT_EXPIRES_IN || '7d'
        }
      });

    } catch (error: any) {
      console.error('登录错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  },

  /**
   * 获取当前用户信息
   * GET /api/users/me
   */
  getCurrentUser: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: '未授权访问'
        });
      }

      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      res.json({
        success: true,
        data: {
          user_id: user.user_id,
          username: user.user_name,
          email: user.email,
          created_at: user.creat_at
        }
      });

    } catch (error) {
      console.error('获取用户信息错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
};