const { sequelize } = require('../../config/database');
const User = require('../../models/User')(sequelize);

async function createSalesUsersForOldServer() {
  try {
    console.log('🔄 开始在老服务器上创建销售用户...');

    // 检查并创建袁用户
    let yuanUser = await User.findOne({ where: { username: '袁' } });
    if (yuanUser) {
      console.log('✅ 袁用户已存在，ID:', yuanUser.id);
    } else {
      console.log('📝 创建袁用户...');
      yuanUser = await User.createUser({
        username: '袁',
        password: 'yuan123',
        name: '袁',
        role: 'sales'
      });
      console.log('✅ 创建销售用户袁成功，ID:', yuanUser.id);
    }

    // 检查并创建赵用户
    let zhaoUser = await User.findOne({ where: { username: '赵' } });
    if (zhaoUser) {
      console.log('✅ 赵用户已存在，ID:', zhaoUser.id);
    } else {
      console.log('📝 创建赵用户...');
      zhaoUser = await User.createUser({
        username: '赵',
        password: 'zhao123',
        name: '赵',
        role: 'sales'
      });
      console.log('✅ 创建销售用户赵成功，ID:', zhaoUser.id);
    }

    console.log('🎉 销售用户创建完成！');
    console.log('📋 用户信息:');
    console.log('   袁 - ID:', yuanUser.id, '用户名: 袁, 密码: yuan123');
    console.log('   赵 - ID:', zhaoUser.id, '用户名: 赵, 密码: zhao123');

    // 显示所有销售用户
    const allSalesUsers = await User.findAll({
      where: { role: 'sales' },
      attributes: ['id', 'username', 'name', 'role', 'is_active', 'created_at']
    });

    console.log('📊 当前所有销售用户:');
    allSalesUsers.forEach(user => {
      console.log(`   ID: ${user.id}, 用户名: ${user.username}, 姓名: ${user.name}, 状态: ${user.is_active ? '激活' : '禁用'}`);
    });

  } catch (error) {
    console.error('❌ 创建销售用户失败:', error.message);
    console.error('错误详情:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// 运行脚本
createSalesUsersForOldServer();