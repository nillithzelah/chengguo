#!/usr/bin/env node

const { sequelize } = require('../config/database');
const User = require('../models/User')(sequelize);

async function updateAdminUsername() {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    // 查找 admin 用户
    const adminUser = await User.findOne({ where: { username: 'admin' } });

    if (!adminUser) {
      console.log('❌ 未找到 admin 用户');
      return;
    }

    // 新用户名
    const newUsername = 'nillithzelah';

    // 检查新用户名是否已被使用
    const existingUser = await User.findOne({ where: { username: newUsername } });
    if (existingUser) {
      console.log(`❌ 用户名 "${newUsername}" 已被使用`);
      return;
    }

    // 更新用户名
    await adminUser.update({ username: newUsername });

    console.log('✅ admin 用户名已成功更新');
    console.log(`新用户名: ${newUsername}`);
    console.log(`原用户名: admin`);

  } catch (error) {
    console.error('❌ 更新用户名失败:', error.message);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  updateAdminUsername();
}