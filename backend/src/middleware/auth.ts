import { Request, Response, NextFunction } from 'express';
import { jwtUtils } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    username: string;
  };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = jwtUtils.extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '访问被拒绝，请提供有效的 token'
      });
    }

    const decoded = jwtUtils.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: '无效的 token'
    });
  }
};