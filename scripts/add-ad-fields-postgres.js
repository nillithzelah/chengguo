#!/usr/bin/env node

// 广告字段添加脚本（支持 SQLite 和 PostgreSQL）
const { sequelize, dbConfig } = require('../config/database');

async function addAdFields() {
  try {
    console.log(`🏗️ 添加广告字段到games表 (${dbConfig.dialect} 数据库)...`);

    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    // 使用 Sequelize 的模型方式检查和添加字段（跨数据库兼容）
    const { Game } = require('../config/database');
    
    // 检查是否需要添加字段
    const needsAdvertiserId = !Game.rawAttributes.advertiser_id;
    const needsPromotionId = !Game.rawAttributes.promotion_id;

    if (needsAdvertiserId || needsPromotionId) {
      console.log('🔄 同步数据库模型以添加新字段...');
      await sequelize.sync({ alter: true });
      console.log('✅ 数据库结构已更新');
    } else {
      console.log('ℹ️ 广告字段已存在，无需修改');
    }

    // 验证字段已添加
    const updatedGameModel = require('../models/Game')(sequelize);
    const hasAdvertiserId = !!updatedGameModel.rawAttributes.advertiser_id;
    const hasPromotionId = !!updatedGameModel.rawAttributes.promotion_id;

    console.log('📊 字段检查结果:');
    console.log(`  advertiser_id: ${hasAdvertiserId ? '✅ 存在' : '❌ 缺失'}`);
    console.log(`  promotion_id: ${hasPromotionId ? '✅ 存在' : '❌ 缺失'}`);

    if (hasAdvertiserId && hasPromotionId) {
      console.log('🎉 广告字段添加完成！');
    } else {
      console.log('⚠️  部分字段添加失败，请检查数据库权限');
    }

  } catch (error) {
    console.error('❌ 添加字段失败:', error.message);
    
    if (error.name === 'SequelizeDatabaseError') {
      console.log('💡 可能需要数据库管理员权限或手动执行 ALTER TABLE 语句');
    }
    
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  addAdFields();
}

module.exports = addAdFields;