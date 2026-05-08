import { Request, Response } from 'express';
import { User } from '../models/User';

export const userController = {
  
  register: async (req: Request, res: Response) => {
    try {
      const { username, email, password } = req.body;

      console.log('Registration request:', { username, email, password: '***' });

      
      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required: username, email, password'
        });
      }

      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }

      
      const userId = await User.create({ username, email, password });

      
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found after creation');
      }

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user_id: user.user_id,
          username: user.user_name,
          email: user.email,
          created_at: user.creat_at
        }
      });

    } catch (error: any) {
      console.error('User registration error:', error);
      
      
      if (error.message.includes('Already exists') || error.message.includes('Already registered')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('Password length')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      
      res.status(500).json({
        success: false,
        message: 'Internal server error, please try again later'
      });
    }
  },

  
  getProfile: async (req: Request, res: Response) => {
    try {
      
      res.json({
        success: true,
        message: 'User information interface',
        data: {
          user_id: 1,
          username: 'Example user',
          email: 'example@prosepal.com'
        }
      });
    } catch (error) {
      console.error('Error in getting user information:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};