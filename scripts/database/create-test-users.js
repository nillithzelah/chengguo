const { sequelize } = require('../../config/database');
const User = require('../../models/User')(sequelize);

async function createTestUsers() {
  try {
    console.log('开始创建测试用户...');

    // 检查并创建yuan用户
    let yuanUser = await User.findOne({ where: { username: 'yuan' } });
    if (yuanUser) {
      console.log('✅ yuan用户已存在，ID:', yuanUser.id);
    } else {
      console.log('📝 创建yuan用户...');
      yuanUser = await User.createUser({
        username: 'yuan',
        password: 'yuan123',
        name: 'yuan',
        role: 'internal_user_1'
      });
      console.log('✅ 创建用户yuan成功，ID:', yuanUser.id);
    }

    // 检查并创建Ayla6026用户
    let aylaUser = await User.findOne({ where: { username: 'Ayla6026' } });
    if (aylaUser) {
      console.log('✅ Ayla6026用户已存在，ID:', aylaUser.id);
    } else {
      console.log('📝 创建Ayla6026用户...');
      aylaUser = await User.createUser({
        username: 'Ayla6026',
        password: 'ayla123',
        name: 'Ayla6026',
        role: 'internal_user_1'
      });
      console.log('✅ 创建用户Ayla6026成功，ID:', aylaUser.id);
    }

    console.log('🎉 用户创建完成！');
    console.log('📋 用户信息:');
    console.log('   yuan - ID:', yuanUser.id, '用户名: yuan, 密码: yuan123');
    console.log('   Ayla6026 - ID:', aylaUser.id, '用户名: Ayla6026, 密码: ayla123');
    console.log('');
    console.log('⚠️  请在server.js中更新用户ID判断条件为:', yuanUser.id, '和', aylaUser.id);

  } catch (error) {
    console.error('❌ 创建用户失败:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// 运行脚本
createTestUsers();