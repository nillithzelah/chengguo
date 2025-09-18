// 为games表添加广告相关字段的迁移脚本
const { sequelize } = require('../config/database');

async function migrateGamesTable() {
  try {
    console.log('📡 连接数据库...');
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    // 检查games表是否已存在
    const [tables] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table' AND name='games'");
    if (tables.length === 0) {
      console.log('❌ games表不存在，请先运行数据库初始化脚本');
      process.exit(1);
    }

    console.log('🔄 检查games表结构...');

    // 检查advertiser_id字段是否已存在
    const [advertiserColumns] = await sequelize.query("PRAGMA table_info(games)");
    const hasAdvertiserId = advertiserColumns.some(col => col.name === 'advertiser_id');
    const hasPromotionId = advertiserColumns.some(col => col.name === 'promotion_id');

    if (hasAdvertiserId && hasPromotionId) {
      console.log('✅ games表已包含广告字段，无需迁移');
      return;
    }

    console.log('🏗️ 开始迁移games表...');

    // 为games表添加新字段
    if (!hasAdvertiserId) {
      console.log('📝 添加advertiser_id字段...');
      await sequelize.query(`
        ALTER TABLE games
        ADD COLUMN advertiser_id VARCHAR(50) NULL COMMENT '广告主ID，用于广告预览二维码'
      `);
      console.log('✅ advertiser_id字段添加成功');
    }

    if (!hasPromotionId) {
      console.log('📝 添加promotion_id字段...');
      await sequelize.query(`
        ALTER TABLE games
        ADD COLUMN promotion_id VARCHAR(50) NULL COMMENT '广告ID，用于广告预览二维码'
      `);
      console.log('✅ promotion_id字段添加成功');
    }

    // 验证迁移结果
    console.log('🔍 验证迁移结果...');
    const [finalColumns] = await sequelize.query("PRAGMA table_info(games)");
    const finalAdvertiserId = finalColumns.some(col => col.name === 'advertiser_id');
    const finalPromotionId = finalColumns.some(col => col.name === 'promotion_id');

    if (finalAdvertiserId && finalPromotionId) {
      console.log('✅ 迁移成功！games表现在包含：');
      console.log('   - advertiser_id: 广告主ID');
      console.log('   - promotion_id: 广告ID');
    } else {
      console.log('⚠️ 迁移可能不完整，请检查数据库');
    }

    // 显示当前games表的数据
    console.log('📊 当前games表数据：');
    const [games] = await sequelize.query("SELECT id, appid, name, advertiser_id, promotion_id FROM games");
    if (games.length > 0) {
      console.table(games);
    } else {
      console.log('   (暂无游戏数据)');
    }

  } catch (error) {
    console.error('❌ 迁移失败:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('📡 数据库连接已关闭');
  }
}

// 运行迁移脚本
if (require.main === module) {
  migrateGamesTable()
    .then(() => {
      console.log('🎉 迁移脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 迁移脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = migrateGamesTable;