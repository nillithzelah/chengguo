const { Sequelize } = require('sequelize');
const path = require('path');

// 数据库配置
const dbPath = path.join(__dirname, 'database.sqlite');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false
});

async function checkUsers() {
  try {
    console.log('🔍 检查用户数据...');

    // 查询用户表
    const [users] = await sequelize.query('SELECT id, username, name, role, is_active, password_plain FROM users');

    console.log('📋 用户列表:');
    users.forEach(user => {
      console.log(`  ID: ${user.id}, 用户名: ${user.username}, 姓名: ${user.name}, 角色: ${user.role}, 状态: ${user.is_active ? '激活' : '禁用'}, 密码: ${user.password_plain}`);
    });

    // 查询tokens表
    const [tokens] = await sequelize.query('SELECT token_type, token_value, expires_at FROM tokens WHERE is_active = 1');

    console.log('\n🔑 Token信息:');
    tokens.forEach(token => {
      console.log(`  类型: ${token.token_type}, 值: ${token.token_value.substring(0, 20)}..., 过期: ${token.expires_at}`);
    });

  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkUsers();