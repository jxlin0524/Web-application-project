import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JwtPayload {
  userId: number;
  username: string;
}

export const jwtUtils = {
  /**
   * 生成 JWT token
   */
  generateToken(payload: JwtPayload): string {
    return jwt.sign(
      payload, 
      JWT_SECRET, 
      { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions // [!code focus] // 添加类型断言
    );
  },

  /**
   * 验证 JWT token
   */
  verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch (error) {
      throw new Error('无效的 token');
    }
  },

  /**
   * 从请求头中提取 token
   */
  extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7); // 移除 "Bearer " 前缀
  }
};