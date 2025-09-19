#!/usr/bin/env node

// 测试广告主ID获取成功的脚本
const { sequelize } = require('../config/database');

async function testAdvertiserId() {
  try {
    console.log('🔍 测试广告主ID获取状态...');

    // 连接数据库
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    // 检查games表是否存在
    const [tables] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table' AND name='games'");
    if (tables.length === 0) {
      console.log('❌ games表不存在，请先运行数据库初始化脚本');
      process.exit(1);
    }

    // 查询所有游戏的广告字段
    const [games] = await sequelize.query(`
      SELECT id, appid, name, advertiser_id, promotion_id, status
      FROM games
      ORDER BY id
    `);

    console.log(`\n📊 找到 ${games.length} 个游戏记录`);
    console.log('='.repeat(80));

    let successCount = 0;
    let totalGames = games.length;

    games.forEach((game, index) => {
      const hasAdvertiserId = game.advertiser_id && game.advertiser_id.trim() !== '';
      const hasPromotionId = game.promotion_id && game.promotion_id.trim() !== '';

      const status = hasAdvertiserId && hasPromotionId ? '✅ 成功' : '❌ 失败';

      if (hasAdvertiserId && hasPromotionId) {
        successCount++;
      }

      console.log(`${index + 1}. ${game.name} (${game.appid})`);
      console.log(`   状态: ${game.status}`);
      console.log(`   广告主ID: ${game.advertiser_id || '未设置'}`);
      console.log(`   广告ID: ${game.promotion_id || '未设置'}`);
      console.log(`   测试结果: ${status}`);
      console.log('');
    });

    // 统计结果
    console.log('='.repeat(80));
    console.log(`📈 测试统计:`);
    console.log(`   总游戏数: ${totalGames}`);
    console.log(`   广告ID获取成功: ${successCount}`);
    console.log(`   广告ID获取失败: ${totalGames - successCount}`);
    console.log(`   成功率: ${totalGames > 0 ? ((successCount / totalGames) * 100).toFixed(1) : 0}%`);

    if (successCount === totalGames) {
      console.log('\n🎉 所有游戏的广告主ID获取成功！');
      console.log('✅ 测试通过');
    } else if (successCount > 0) {
      console.log(`\n⚠️ 部分游戏的广告主ID获取成功，还有 ${totalGames - successCount} 个游戏需要处理`);
      console.log('💡 建议运行以下脚本更新广告ID:');
      console.log('   node scripts/update-ad-ids.js');
    } else {
      console.log('\n❌ 所有游戏的广告主ID都未获取成功');
      console.log('💡 请检查:');
      console.log('   1. 抖音API配置是否正确');
      console.log('   2. 游戏验证状态');
      console.log('   3. 网络连接');
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('\n📡 数据库连接已关闭');
  }
}

// 运行测试脚本
if (require.main === module) {
  console.log('🚀 广告主ID获取测试脚本');
  console.log('================================');
  console.log('此脚本将检查数据库中所有游戏的广告主ID和广告ID是否已正确设置');
  console.log('================================');

  testAdvertiserId()
    .then(() => {
      console.log('\n🎉 测试脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ 测试脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = testAdvertiserId;