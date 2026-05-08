// src/utils/seedUsers.ts
import { User } from '../models/User';


export const seedTestUsers = async (): Promise<void> => {
  try {
    const testUsers = [
      { username: 'testauthor', email: 'author@prosepal.com', password: '123456' },
      { username: 'writermaster', email: 'writer@prosepal.com', password: '123456' },
      { username: 'novelcreator', email: 'creator@prosepal.com', password: '123456' }
    ];

    console.log(' Start creating test users...');

    for (const userData of testUsers) {
      try {
        const existingUser = await User.findByUsername(userData.username);
        if (!existingUser) {
          await User.create(userData);
          console.log(` Create test user: ${userData.username}`);
        } else {
          console.log(`⏭  User already exists: ${userData.username}`);
        }
      } catch (error) {
        console.log(` Create user ${userData.username} failed:`, (error as Error).message);
      }
    }

    console.log(' Test users created successfully');
  } catch (error) {
    console.error(' Create test users failed:', error);
  }
};

export default { seedTestUsers };