const { sequelize } = require('./config/database');
const User = require('./models/User')(sequelize);

async function checkUsers() {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    const users = await User.findAll({
      attributes: ['id', 'username', 'name', 'role', 'is_active', 'created_at'],
      order: [['created_at', 'DESC']]
    });

    console.log('\n📋 数据库中的所有用户:');
    console.log('='.repeat(80));
    users.forEach(user => {
      console.log(`ID: ${user.id}, 用户名: ${user.username}, 姓名: ${user.name}, 角色: ${user.role}, 状态: ${user.is_active ? '激活' : '禁用'}`);
    });

    // 统计各角色数量
    const roleStats = {};
    users.forEach(user => {
      roleStats[user.role] = (roleStats[user.role] || 0) + 1;
    });

    console.log('\n📊 角色统计:');
    Object.entries(roleStats).forEach(([role, count]) => {
      console.log(`${role}: ${count}个用户`);
    });

    // 检查是否有sales角色
    const hasSales = users.some(user => user.role === 'sales');
    console.log(`\n🔍 Sales角色检查: ${hasSales ? '✅ 已存在' : '❌ 不存在'}`);

  } catch (error) {
    console.error('❌ 查询失败:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkUsers();