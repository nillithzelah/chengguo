#!/usr/bin/env node

/**
 * 用户角色迁移脚本
 * 将旧的角色系统迁移到新的角色系统
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// 数据库连接
const { testConnection, sequelize } = require('../config/database');
const defineUserModel = require('../models/User');

// 初始化模型
const User = defineUserModel(sequelize);

// 角色映射
const roleMapping = {
  'user': 'external_user',
  'moderator': 'internal_service',
  'viewer': 'internal_user',
  'super_viewer': 'internal_boss'
};

async function migrateUserRoles() {
  try {
    console.log('🔄 开始迁移用户角色...');

    // 测试数据库连接
    console.log('📡 测试数据库连接...');
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ 数据库连接失败');
      process.exit(1);
    }

    // 获取所有用户
    console.log('👥 获取所有用户...');
    const users = await User.findAll({
      attributes: ['id', 'username', 'name', 'role']
    });

    console.log(`📊 找到 ${users.length} 个用户`);

    // 统计角色分布
    const roleStats = {};
    users.forEach(user => {
      roleStats[user.role] = (roleStats[user.role] || 0) + 1;
    });

    console.log('📈 当前角色分布:');
    Object.entries(roleStats).forEach(([role, count]) => {
      console.log(`   ${role}: ${count} 个用户`);
    });

    // 迁移用户角色
    let migratedCount = 0;
    for (const user of users) {
      const newRole = roleMapping[user.role];
      if (newRole && newRole !== user.role) {
        console.log(`🔄 迁移用户 ${user.username} (${user.role} -> ${newRole})`);
        await user.update({ role: newRole });
        migratedCount++;
      }
    }

    console.log(`✅ 成功迁移 ${migratedCount} 个用户`);

    // 显示迁移后的角色分布
    const updatedUsers = await User.findAll({
      attributes: ['id', 'username', 'name', 'role']
    });

    const newRoleStats = {};
    updatedUsers.forEach(user => {
      newRoleStats[user.role] = (newRoleStats[user.role] || 0) + 1;
    });

    console.log('📈 迁移后角色分布:');
    Object.entries(newRoleStats).forEach(([role, count]) => {
      console.log(`   ${role}: ${count} 个用户`);
    });

    console.log('🎉 用户角色迁移完成！');

  } catch (error) {
    console.error('❌ 角色迁移失败:', error.message);
    console.error('完整错误:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// 执行迁移
migrateUserRoles();