// src/utils/seedUsers.ts
import { User } from '../models/User';

/**
 * 创建测试用户数据
 */
export const seedTestUsers = async (): Promise<void> => {
  try {
    const testUsers = [
      { username: 'testauthor', email: 'author@prosepal.com', password: '123456' },
      { username: 'writermaster', email: 'writer@prosepal.com', password: '123456' },
      { username: 'novelcreator', email: 'creator@prosepal.com', password: '123456' }
    ];

    console.log('🌱 开始创建测试用户...');

    for (const userData of testUsers) {
      try {
        const existingUser = await User.findByUsername(userData.username);
        if (!existingUser) {
          await User.create(userData);
          console.log(`✅ 创建测试用户: ${userData.username}`);
        } else {
          console.log(`⏭️  用户已存在: ${userData.username}`);
        }
      } catch (error) {
        console.log(`⚠️  创建用户 ${userData.username} 失败:`, (error as Error).message);
      }
    }

    console.log('🎉 测试用户创建完成');
  } catch (error) {
    console.error('❌ 创建测试用户失败:', error);
  }
};

// 确保文件有导出
export default { seedTestUsers };