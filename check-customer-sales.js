#!/usr/bin/env node

const { sequelize } = require('./config/database');
const defineUserModel = require('./models/User');

async function checkSalesUsers() {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    // 初始化模型
    const User = defineUserModel(sequelize);

    console.log('\n🔍 检查销售用户数据...');
    const salesUsers = await User.findAll({
      where: {
        role: 'sales'
      },
      attributes: ['id', 'username', 'name', 'role']
    });

    console.log(`📊 找到 ${salesUsers.length} 个销售用户:`);
    salesUsers.forEach(user => {
      console.log(`  - ID: ${user.id}, 用户名: ${user.username}, 姓名: ${user.name}`);
    });

    console.log('\n🔍 检查所有用户数据...');
    const allUsers = await User.findAll({
      attributes: ['id', 'username', 'name', 'role']
    });

    console.log(`📊 总共 ${allUsers.length} 个用户:`);
    allUsers.forEach(user => {
      console.log(`  - ID: ${user.id}, 用户名: ${user.username}, 姓名: ${user.name}, 角色: ${user.role}`);
    });

  } catch (error) {
    console.error('❌ 检查失败:', error.message);
    console.error('错误详情:', error);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  checkSalesUsers();
}

module.exports = checkSalesUsers;