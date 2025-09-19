#!/usr/bin/env node

// 简化的广告字段添加脚本
const { sequelize } = require('../config/database');

async function addAdFields() {
  try {
    console.log('🏗️ 添加广告字段到games表...');

    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    // 检查games表是否存在
    const [tables] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table' AND name='games'");
    if (tables.length === 0) {
      console.log('❌ games表不存在');
      process.exit(1);
    }

    // 获取当前表结构
    const [columns] = await sequelize.query("PRAGMA table_info(games)");
    const hasAdvertiserId = columns.some(col => col.name === 'advertiser_id');
    const hasPromotionId = columns.some(col => col.name === 'promotion_id');

    // 添加advertiser_id字段
    if (!hasAdvertiserId) {
      console.log('📝 添加advertiser_id字段...');
      await sequelize.query(`ALTER TABLE games ADD COLUMN advertiser_id VARCHAR(50) NULL`);
      console.log('✅ advertiser_id字段添加成功');
    } else {
      console.log('ℹ️ advertiser_id字段已存在');
    }

    // 添加promotion_id字段
    if (!hasPromotionId) {
      console.log('📝 添加promotion_id字段...');
      await sequelize.query(`ALTER TABLE games ADD COLUMN promotion_id VARCHAR(50) NULL`);
      console.log('✅ promotion_id字段添加成功');
    } else {
      console.log('ℹ️ promotion_id字段已存在');
    }

    console.log('🎉 广告字段添加完成！');

  } catch (error) {
    console.error('❌ 添加字段失败:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  addAdFields();
}

module.exports = addAdFields;