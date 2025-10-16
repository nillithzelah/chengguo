#!/usr/bin/env node

const { sequelize } = require('../config/database');
const User = require('../models/User')(sequelize);

async function updateAdminPassword() {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    // 查找 admin 用户
    const adminUser = await User.findOne({ where: { username: 'admin' } });

    if (!adminUser) {
      console.log('❌ 未找到 admin 用户');
      return;
    }

    // 新密码
    const newPassword = 'PeKbz)i_7!T^cUL|v[0`';

    // 设置新密码
    await adminUser.setPassword(newPassword);

    // 保存更改
    await adminUser.save();

    console.log('✅ admin 用户密码已成功更新');
    console.log(`新密码: ${newPassword}`);

  } catch (error) {
    console.error('❌ 更新密码失败:', error.message);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  updateAdminPassword();
}