import { Request, Response } from 'express';
import { User } from '../models/User';
import { jwtUtils } from '../utils/jwt';
import { AuthRequest } from '../middleware/auth';

export const authController = {
  
  login: async (req: Request, res: Response) => {
    try {
      console.log('Login request:', req.body);
      const { username, email, identifier, password } = req.body;
      const loginIdentifier = identifier || username || email;

      
      if (!loginIdentifier || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username/email and password are required'
        });
      }

      
      let user = await User.findByUsername(loginIdentifier);
      if (!user) {
        
        user = await User.findByEmail(loginIdentifier);
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid username or password'
        });
      }

      
      const isPasswordValid = await User.verifyPassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid username or password'
        });
      }

      
      const token = jwtUtils.generateToken({
        userId: user.user_id,
        username: user.user_name
      });

      res.json({
        success: true,
        message: 'Login successful',
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
      console.error('login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  
  getCurrentUser: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized access'
        });
      }

      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'The user does not exist.'
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
      console.error('Error in obtaining user information:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};