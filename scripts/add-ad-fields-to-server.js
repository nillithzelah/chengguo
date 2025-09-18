// 服务器数据库迁移脚本 - 为games表添加广告字段
const { sequelize } = require('../config/database');

async function addAdFieldsToServer() {
  try {
    console.log('🔄 开始服务器数据库迁移...');
    console.log('📡 连接数据库...');

    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    // 检查games表是否存在
    const [tables] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table' AND name='games'");
    if (tables.length === 0) {
      console.log('❌ games表不存在，请先运行数据库初始化');
      process.exit(1);
    }

    console.log('🔍 检查games表现有字段...');

    // 获取当前表结构
    const [columns] = await sequelize.query("PRAGMA table_info(games)");
    console.log('📋 当前games表字段:');
    columns.forEach(col => {
      console.log(`   - ${col.name}: ${col.type}`);
    });

    // 检查是否已有广告字段
    const hasAdvertiserId = columns.some(col => col.name === 'advertiser_id');
    const hasPromotionId = columns.some(col => col.name === 'promotion_id');

    if (hasAdvertiserId && hasPromotionId) {
      console.log('✅ 广告字段已存在，无需迁移');
      return;
    }

    console.log('🏗️ 开始添加广告字段...');

    // 添加advertiser_id字段
    if (!hasAdvertiserId) {
      console.log('📝 添加advertiser_id字段...');
      try {
        await sequelize.query(`
          ALTER TABLE games
          ADD COLUMN advertiser_id VARCHAR(50) NULL
        `);
        console.log('✅ advertiser_id字段添加成功');
      } catch (error) {
        console.error('❌ 添加advertiser_id字段失败:', error.message);
        // 尝试其他方法
        console.log('🔄 尝试使用不同的SQL语法...');
        await sequelize.query(`
          ALTER TABLE games ADD advertiser_id VARCHAR(50) NULL
        `);
        console.log('✅ advertiser_id字段添加成功 (方法2)');
      }
    }

    // 添加promotion_id字段
    if (!hasPromotionId) {
      console.log('📝 添加promotion_id字段...');
      try {
        await sequelize.query(`
          ALTER TABLE games
          ADD COLUMN promotion_id VARCHAR(50) NULL
        `);
        console.log('✅ promotion_id字段添加成功');
      } catch (error) {
        console.error('❌ 添加promotion_id字段失败:', error.message);
        // 尝试其他方法
        console.log('🔄 尝试使用不同的SQL语法...');
        await sequelize.query(`
          ALTER TABLE games ADD promotion_id VARCHAR(50) NULL
        `);
        console.log('✅ promotion_id字段添加成功 (方法2)');
      }
    }

    // 验证迁移结果
    console.log('🔍 验证迁移结果...');
    const [finalColumns] = await sequelize.query("PRAGMA table_info(games)");
    const finalAdvertiserId = finalColumns.some(col => col.name === 'advertiser_id');
    const finalPromotionId = finalColumns.some(col => col.name === 'promotion_id');

    console.log('📋 迁移后的games表字段:');
    finalColumns.forEach(col => {
      const isNew = (col.name === 'advertiser_id' || col.name === 'promotion_id') ? ' 🆕' : '';
      console.log(`   - ${col.name}: ${col.type}${isNew}`);
    });

    if (finalAdvertiserId && finalPromotionId) {
      console.log('🎉 迁移成功！');
      console.log('✅ 已添加字段:');
      console.log('   - advertiser_id: VARCHAR(50) NULL');
      console.log('   - promotion_id: VARCHAR(50) NULL');
    } else {
      console.log('⚠️ 迁移可能不完整，请手动检查');
    }

    // 显示当前games表数据
    console.log('📊 当前games表数据:');
    const [games] = await sequelize.query("SELECT id, appid, name, advertiser_id, promotion_id FROM games");
    if (games.length > 0) {
      console.table(games);
    } else {
      console.log('   (暂无游戏数据)');
    }

  } catch (error) {
    console.error('❌ 迁移失败:', error);
    console.log('💡 可能的解决方案:');
    console.log('   1. 检查数据库文件权限');
    console.log('   2. 确认SQLite版本支持ALTER TABLE');
    console.log('   3. 手动执行SQL命令');
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('📡 数据库连接已关闭');
  }
}

// 运行迁移脚本
if (require.main === module) {
  console.log('🚀 服务器数据库迁移脚本');
  console.log('================================');
  console.log('此脚本将在服务器的games表中添加广告字段:');
  console.log('  - advertiser_id: 广告主ID');
  console.log('  - promotion_id: 广告ID');
  console.log('================================');

  addAdFieldsToServer()
    .then(() => {
      console.log('🎉 服务器迁移脚本执行完成');
      console.log('✅ 现在可以部署新版本了');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 服务器迁移脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = addAdFieldsToServer;