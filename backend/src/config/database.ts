import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { seedTestUsers } from '../utils/seedUsers';

dotenv.config();

// 数据库连接配置
export const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'project_db',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '+08:00'
};

// 创建连接池
export const pool = mysql.createPool(dbConfig);

// 测试数据库连接
export const testConnection = async (): Promise<boolean> => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ 数据库连接成功');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    return false;
  }
};

// 数据库初始化函数
export const initDatabase = async (): Promise<void> => {
  try {
    // 检查表是否存在
    const [tables] = await pool.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ?
    `, [process.env.DB_NAME || 'project_db']);

    console.log(`✅ 数据库 ${process.env.DB_NAME} 连接成功`);

    // 测试每个表的访问
    const testTables = ['users', 'projects', 'documents', 'versions', 'collaborators', 'comments'];
    
    for (const table of testTables) {
      try {
        await pool.query(`SELECT 1 FROM ${table} LIMIT 1`);
        console.log(`✅ ${table} 表可正常访问`);
      } catch (error) {
        console.warn(`⚠️ ${table} 表访问测试失败:`, (error as Error).message);
      }
    }

    console.log('✅ 数据库表结构验证完成');

    // 创建测试用户（仅在开发环境）
    if (process.env.NODE_ENV === 'development') {
      await seedTestUsers();
    }

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    throw error;
  }
};

// 导出数据库查询辅助函数
export const db = {
  async query(sql: string, params: any[] = []) {
    try {
      const [rows] = await pool.execute(sql, params);
      return rows;
    } catch (error) {
      console.error('数据库查询错误:', error);
      throw error;
    }
  },

  async insert(sql: string, params: any[] = []) {
    try {
      const [result] = await pool.execute(sql, params) as any;
      return result.insertId;
    } catch (error) {
      console.error('数据库插入错误:', error);
      throw error;
    }
  },

  async getConnection() {
    return await pool.getConnection();
  }
};

export default pool;