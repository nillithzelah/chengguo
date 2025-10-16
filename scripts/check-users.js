#!/usr/bin/env node

const { sequelize } = require('../config/database');

async function checkUsers() {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    // 查询用户表
    const [users] = await sequelize.query('SELECT id, username, name, role, is_active, password_plain FROM users');

    console.log('\n👥 用户列表:');
    console.log('='.repeat(60));
    console.log('ID | 用户名 | 姓名 | 角色 | 状态 | 密码');
    console.log('-'.repeat(60));

    users.forEach(user => {
      const passwordDisplay = user.username === 'admin' ? 'PeKbz)i_7!T^cUL|v[0`' : user.password_plain;
      console.log(`  ID: ${user.id}, 用户名: ${user.username}, 姓名: ${user.name}, 角色: ${user.role}, 状态: ${user.is_active ? '激活' : '禁用'}, 密码: ${passwordDisplay}`);
    });

    console.log(`\n📊 总用户数: ${users.length}`);

  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  checkUsers();
}