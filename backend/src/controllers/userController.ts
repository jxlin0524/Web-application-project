import { Request, Response } from 'express';
import { User } from '../models/User';

export const userController = {
  /**
   * 用户注册
   * POST /api/users/register
   */
  register: async (req: Request, res: Response) => {
    try {
      const { username, email, password } = req.body;

      console.log('注册请求:', { username, email, password: '***' });

      // 验证输入
      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          message: '所有字段都是必填的：用户名、邮箱、密码'
        });
      }

      // 验证邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: '邮箱格式不正确'
        });
      }

      // 创建用户
      const userId = await User.create({ username, email, password });

      // 获取用户信息（不包含密码）
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('用户创建后无法检索');
      }

      res.status(201).json({
        success: true,
        message: '用户注册成功',
        data: {
          user_id: user.user_id,
          username: user.user_name,
          email: user.email,
          created_at: user.creat_at
        }
      });

    } catch (error: any) {
      console.error('用户注册错误:', error);
      
      // 处理已知错误类型
      if (error.message.includes('已存在') || error.message.includes('已被注册')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('密码长度')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      // 未知错误
      res.status(500).json({
        success: false,
        message: '服务器内部错误，请稍后重试'
      });
    }
  },

  /**
   * 获取用户信息（为后续功能准备）
   * GET /api/users/profile
   */
  getProfile: async (req: Request, res: Response) => {
    try {
      // 这里暂时返回示例数据，后续会添加认证中间件
      res.json({
        success: true,
        message: '用户信息接口',
        data: {
          user_id: 1,
          username: '示例用户',
          email: 'example@prosepal.com'
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