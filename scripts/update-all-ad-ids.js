#!/usr/bin/env node

// 更新所有游戏的广告ID脚本
const { sequelize } = require('../config/database');

async function updateAllAdIds() {
  try {
    console.log('📡 连接数据库...');
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    console.log('🔄 更新所有游戏的广告ID...');

    // 获取所有游戏
    const [games] = await sequelize.query('SELECT id, appid, name FROM games ORDER BY id');

    console.log(`📊 找到 ${games.length} 个游戏`);

    // 为每个游戏设置默认广告ID（如果没有的话）
    for (const game of games) {
      console.log(`\n🎮 处理游戏: ${game.name} (${game.appid})`);

      // 检查当前广告ID
      const [currentGame] = await sequelize.query(
        'SELECT advertiser_id, promotion_id FROM games WHERE id = ?',
        { replacements: [game.id] }
      );

      const hasAdvertiserId = currentGame[0].advertiser_id && currentGame[0].advertiser_id.trim() !== '';
      const hasPromotionId = currentGame[0].promotion_id && currentGame[0].promotion_id.trim() !== '';

      if (hasAdvertiserId && hasPromotionId) {
        console.log(`   ✅ 已设置广告ID: ${currentGame[0].advertiser_id}, ${currentGame[0].promotion_id}`);
        continue;
      }

      // 根据游戏AppID设置不同的广告ID
      let advertiserId = null;
      let promotionId = null;

      if (game.appid === 'tt8513f3ae1a1ce1af02') {
        // 神仙游
        advertiserId = '1843320456982026';
        promotionId = '7550558554752532523';
      } else if (game.appid === 'tt8c62fadf136c334702') {
        // 橙果宜牛小游戏
        advertiserId = '1';
        promotionId = '1';
      } else if (game.appid === 'tt3e344889a13a823402') {
        // 小侠客勇士模拟器
        advertiserId = '2';
        promotionId = '2';
      } else {
        // 其他游戏使用默认值
        advertiserId = 'default_' + game.id;
        promotionId = 'default_' + game.id;
      }

      // 更新数据库
      await sequelize.query(
        'UPDATE games SET advertiser_id = ?, promotion_id = ? WHERE id = ?',
        { replacements: [advertiserId, promotionId, game.id] }
      );

      console.log(`   ✅ 设置广告ID: ${advertiserId}, ${promotionId}`);
    }

    console.log('\n🔍 验证更新结果...');

    // 显示更新后的所有游戏
    const [updatedGames] = await sequelize.query(`
      SELECT id, appid, name, advertiser_id, promotion_id, status
      FROM games
      ORDER BY id
    `);

    console.log('\n📋 更新后的游戏列表:');
    updatedGames.forEach((game, index) => {
      const hasAdvertiserId = game.advertiser_id && game.advertiser_id.trim() !== '';
      const hasPromotionId = game.promotion_id && game.promotion_id.trim() !== '';
      const status = hasAdvertiserId && hasPromotionId ? '✅ 成功' : '❌ 失败';

      console.log(`${index + 1}. ${game.name} (${game.appid})`);
      console.log(`   状态: ${game.status}`);
      console.log(`   广告主ID: ${game.advertiser_id || '未设置'}`);
      console.log(`   广告ID: ${game.promotion_id || '未设置'}`);
      console.log(`   测试结果: ${status}`);
      console.log('');
    });

    // 统计结果
    const successCount = updatedGames.filter(game =>
      game.advertiser_id && game.advertiser_id.trim() !== '' &&
      game.promotion_id && game.promotion_id.trim() !== ''
    ).length;

    console.log('='.repeat(50));
    console.log('📈 更新统计:');
    console.log(`   总游戏数: ${updatedGames.length}`);
    console.log(`   广告ID设置成功: ${successCount}`);
    console.log(`   广告ID设置失败: ${updatedGames.length - successCount}`);
    console.log(`   成功率: ${updatedGames.length > 0 ? ((successCount / updatedGames.length) * 100).toFixed(1) : 0}%`);

    if (successCount === updatedGames.length) {
      console.log('\n🎉 所有游戏的广告ID设置成功！');
    } else {
      console.log(`\n⚠️ 部分游戏的广告ID设置失败，还有 ${updatedGames.length - successCount} 个游戏需要手动处理`);
    }

  } catch (error) {
    console.error('❌ 更新失败:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('\n📡 数据库连接已关闭');
  }
}

// 运行脚本
if (require.main === module) {
  console.log('🚀 更新所有游戏广告ID脚本');
  console.log('================================');
  console.log('此脚本将为所有游戏设置广告主ID和广告ID');
  console.log('================================');

  updateAllAdIds()
    .then(() => {
      console.log('\n🎉 脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ 脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = updateAllAdIds;