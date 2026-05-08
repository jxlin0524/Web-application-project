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
  
  static async create(userData: UserData): Promise<number> {
    const { username, email, password } = userData;
    
    
    const existingUserByName = await this.findByUsername(username);
    if (existingUserByName) {
      throw new Error('Username already exists');
    }

    
    const existingUserByEmail = await this.findByEmail(email);
    if (existingUserByEmail) {
      throw new Error('Email already registered');
    }

    
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    
    const hashedPassword = await bcrypt.hash(password, 12);

    
    const sql = `INSERT INTO users (user_name, email, password, creat_at) 
                 VALUES (?, ?, ?, NOW())`;
    const insertId = await db.insert(sql, [username, email, hashedPassword]);
    
    return insertId;
  }

  
  static async findByUsername(username: string): Promise<UserRecord | null> {
    const sql = 'SELECT * FROM users WHERE user_name = ?';
    const users = await db.query(sql, [username]) as UserRecord[];
    return users.length > 0 ? users[0] : null;
  }

  
  static async findByEmail(email: string): Promise<UserRecord | null> {
    const sql = 'SELECT * FROM users WHERE email = ?';
    const users = await db.query(sql, [email]) as UserRecord[];
    return users.length > 0 ? users[0] : null;
  }

  /**
   
   */
  static async findById(userId: number): Promise<UserRecord | null> {
    const sql = 'SELECT user_id, user_name, email, creat_at FROM users WHERE user_id = ?';
    const users = await db.query(sql, [userId]) as UserRecord[];
    return users.length > 0 ? users[0] : null;
  }

  /**
   
   */
  static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}