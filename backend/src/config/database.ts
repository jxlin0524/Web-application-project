import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { seedTestUsers } from '../utils/seedUsers';

dotenv.config();


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


export const pool = mysql.createPool(dbConfig);


export const testConnection = async (): Promise<boolean> => {
  try {
    const connection = await pool.getConnection();
    console.log('Database connection successful');
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};


export const initDatabase = async (): Promise<void> => {
  try {
    
    const [tables] = await pool.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ?
    `, [process.env.DB_NAME || 'project_db']);

    console.log(` Database ${process.env.DB_NAME} connected successfully`);

   
    const testTables = ['users', 'projects', 'documents', 'versions', 'collaborators', 'comments'];
    
    for (const table of testTables) {
      try {
        await pool.query(`SELECT 1 FROM ${table} LIMIT 1`);
        console.log(` ${table} table can be accessed normally`);
      } catch (error) {
        console.warn(` ${table} table access test failed:`, (error as Error).message);
      }
    }

    console.log('Database table structure verification completed');

    
    if (process.env.NODE_ENV === 'development') {
      await seedTestUsers();
    }

  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
};


export const db = {
  async query(sql: string, params: any[] = []) {
    try {
      const [rows] = await pool.execute(sql, params);
      return rows;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  },

  async insert(sql: string, params: any[] = []) {
    try {
      const [result] = await pool.execute(sql, params) as any;
      return result.insertId;
    } catch (error) {
      console.error('Database insertion error:', error);
      throw error;
    }
  },

  async getConnection() {
    return await pool.getConnection();
  }
};

export default pool;