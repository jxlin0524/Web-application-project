import { testConnection, db } from '../config/database';

const testDatabase = async () => {
  console.log(' Start database test...');
  
  
  const connected = await testConnection();
  if (!connected) {
    console.log(' Database connection test failed');
    return;
  }
  
  console.log(' Database connection test successful');
  
  
  try {
    const users = await db.query('SELECT COUNT(*) as count FROM users');
    console.log(` Users table record count: ${(users as any)[0].count}`);
    
    const projects = await db.query('SELECT COUNT(*) as count FROM projects');
    console.log(` Projects table record count: ${(projects as any)[0].count}`);
    
    console.log(' Database query test successful');
  } catch (error) {
    console.log(' Database query test encountered error (possibly empty table):', (error as Error).message);
  }
};

if (require.main === module) {
  testDatabase().then(() => {
    console.log(' Database test completed');
    process.exit(0);
  }).catch(error => {
    console.error(' Database test failed:', error);
    process.exit(1);
  });
}

export { testDatabase };