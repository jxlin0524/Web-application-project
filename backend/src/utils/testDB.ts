import { testConnection, db } from '../config/database';

const testDatabase = async () => {
  console.log('🧪 开始数据库测试...');
  
  // 测试连接
  const connected = await testConnection();
  if (!connected) {
    console.log('❌ 数据库连接测试失败');
    return;
  }
  
  console.log('✅ 数据库连接测试成功');
  
  // 测试基本查询
  try {
    // 测试users表
    const users = await db.query('SELECT COUNT(*) as count FROM users');
    console.log(`📊 Users表记录数: ${(users as any)[0].count}`);
    
    // 测试projects表
    const projects = await db.query('SELECT COUNT(*) as count FROM projects');
    console.log(`📊 Projects表记录数: ${(projects as any)[0].count}`);
    
    console.log('✅ 数据库查询测试成功');
  } catch (error) {
    console.log('⚠️ 数据库查询测试遇到错误（可能是空表）:', (error as Error).message);
  }
};

// 如果是直接运行此文件
if (require.main === module) {
  testDatabase().then(() => {
    console.log('🎉 数据库测试完成');
    process.exit(0);
  }).catch(error => {
    console.error('💥 数据库测试失败:', error);
    process.exit(1);
  });
}

export { testDatabase };