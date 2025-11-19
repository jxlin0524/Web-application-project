import { db } from '../config/database';
import bcrypt from 'bcryptjs';

export interface UserData {
  username: string;
  email: string;
  password: string;
}

export interface UserRecord {
  user_id: number;
  user_name: string;
  email: string;
  password: string;
  creat_at: Date;
}

export class User {
  /**
   * 创建新用户
   */
  static async create(userData: UserData): Promise<number> {
    const { username, email, password } = userData;
    
    // 检查用户名是否已存在
    const existingUserByName = await this.findByUsername(username);
    if (existingUserByName) {
      throw new Error('用户名已存在');
    }

    // 检查邮箱是否已存在
    const existingUserByEmail = await this.findByEmail(email);
    if (existingUserByEmail) {
      throw new Error('邮箱已被注册');
    }

    // 验证密码强度
    if (password.length < 6) {
      throw new Error('密码长度至少6位');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 12);

    // 插入用户到数据库
    const sql = `INSERT INTO users (user_name, email, password, creat_at) 
                 VALUES (?, ?, ?, NOW())`;
    const insertId = await db.insert(sql, [username, email, hashedPassword]);
    
    return insertId;
  }

  /**
   * 根据用户名查找用户
   */
  static async findByUsername(username: string): Promise<UserRecord | null> {
    const sql = 'SELECT * FROM users WHERE user_name = ?';
    const users = await db.query(sql, [username]) as UserRecord[];
    return users.length > 0 ? users[0] : null;
  }

  /**
   * 根据邮箱查找用户
   */
  static async findByEmail(email: string): Promise<UserRecord | null> {
    const sql = 'SELECT * FROM users WHERE email = ?';
    const users = await db.query(sql, [email]) as UserRecord[];
    return users.length > 0 ? users[0] : null;
  }

  /**
   * 根据用户ID查找用户
   */
  static async findById(userId: number): Promise<UserRecord | null> {
    const sql = 'SELECT user_id, user_name, email, creat_at FROM users WHERE user_id = ?';
    const users = await db.query(sql, [userId]) as UserRecord[];
    return users.length > 0 ? users[0] : null;
  }

  /**
   * 验证密码
   */
  static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}