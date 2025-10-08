const { testConnection, sequelize } = require('../config/database');
const defineUserModel = require('../models/User');

const User = defineUserModel(sequelize);

async function createTestUsers() {
  try {
    console.log('🔗 测试数据库连接...');
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ 数据库连接失败');
      process.exit(1);
    }

    console.log('✅ 数据库连接成功');

    // 定义测试用户数据
    const testUsers = [
      { username: 'admin', password: 'admin123', name: '系统管理员', role: 'admin' },
      { username: 'internal_boss', password: 'boss123', name: '内老板', role: 'internal_boss' },
      { username: 'external_boss', password: 'boss123', name: '外老板', role: 'external_boss' },
      { username: 'internal_service', password: 'service123', name: '内客服', role: 'internal_service' },
      { username: 'external_service', password: 'service123', name: '外客服', role: 'external_service' },
      { username: 'internal_user', password: 'user123', name: '内用户', role: 'internal_user' },
      { username: 'external_user', password: 'user123', name: '外用户', role: 'external_user' },
    ];

    console.log('👥 开始创建测试用户...');

    for (const userData of testUsers) {
      try {
        // 检查用户是否已存在
        const existingUser = await User.findByUsername(userData.username);
        if (existingUser) {
          console.log(`⚠️ 用户 ${userData.username} 已存在，跳过创建`);
          continue;
        }

        // 创建新用户
        const newUser = await User.createUser({
          username: userData.username,
          password: userData.password,
          name: userData.name,
          role: userData.role,
          created_by: 1 // 假设admin用户ID为1
        });

        console.log(`✅ 创建用户成功: ${userData.username} (${userData.name}) - 角色: ${userData.role}`);

      } catch (error) {
        console.error(`❌ 创建用户失败 ${userData.username}:`, error.message);
      }
    }

    console.log('🎉 测试用户创建完成！');
    console.log('');
    console.log('📋 测试用户列表:');
    testUsers.forEach(user => {
      console.log(`   ${user.username} / ${user.password} - ${user.name} (${user.role})`);
    });

  } catch (error) {
    console.error('❌ 创建测试用户时出错:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// 运行脚本
createTestUsers();