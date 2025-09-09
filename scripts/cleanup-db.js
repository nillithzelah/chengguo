#!/usr/bin/env node

const { testConnection, syncDatabase } = require('../config/database');

// 注意：此脚本用于清理不再需要的数据库表
// 主要用于删除eCPM数据表，因为我们采用实时查询策略

async function cleanupDatabase() {
  console.log('🧹 开始清理数据库...');

  try {
    // 1. 测试数据库连接
    console.log('📡 测试数据库连接...');
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ 数据库连接失败，请检查配置');
      process.exit(1);
    }

    // 2. 检查并删除eCPM数据表（如果存在）
    console.log('🔍 检查eCPM数据表...');

    const { sequelize } = require('../config/database');

    try {
      // 检查表是否存在
      const tableExists = await sequelize.getQueryInterface().showAllTables();
      const hasEcpmTable = tableExists.includes('ecpm_data');

      if (hasEcpmTable) {
        console.log('⚠️ 发现eCPM数据表，正在删除...');

        // 删除表
        await sequelize.getQueryInterface().dropTable('ecpm_data');
        console.log('✅ eCPM数据表已删除');
      } else {
        console.log('✅ eCPM数据表不存在，无需清理');
      }
    } catch (error) {
      console.log('ℹ️ eCPM数据表检查跳过:', error.message);
    }

    // 3. 验证当前数据库结构
    console.log('📊 当前数据库表结构:');
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('存在的表:', tables);

    // 4. 显示推荐的表结构
    console.log('📋 推荐的表结构:');
    console.log('  ✅ users - 用户表');
    console.log('  ✅ games - 游戏表');
    console.log('  ✅ user_games - 用户游戏关联表');
    console.log('  ❌ ecpm_data - eCPM数据表（已移除）');

    console.log('🎉 数据库清理完成！');
    console.log('');
    console.log('💡 数据存储策略说明:');
    console.log('  - 用户和游戏数据存储在PostgreSQL');
    console.log('  - eCPM数据采用实时查询，不存储在本地');
    console.log('  - 这样可以减少存储成本，提高数据实时性');

  } catch (error) {
    console.error('❌ 数据库清理失败:', error);
    process.exit(1);
  }
}

// 运行清理脚本
cleanupDatabase().then(() => {
  console.log('✅ 清理脚本执行完毕');
  process.exit(0);
}).catch((error) => {
  console.error('❌ 清理脚本执行失败:', error);
  process.exit(1);
});