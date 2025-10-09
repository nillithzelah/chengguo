const { testConnection, sequelize } = require('./config/database');
const Game = require('./models/Game')(sequelize);

async function checkGames() {
  try {
    console.log('🔍 检查数据库中的游戏配置...');

    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ 数据库连接失败');
      return;
    }

    const games = await Game.findAll({
      attributes: ['id', 'name', 'appid', 'advertiser_id', 'promotion_id', 'created_at'],
      order: [['created_at', 'DESC']]
    });

    console.log('📋 数据库中的游戏配置:');
    console.log('='.repeat(80));

    games.forEach((game, index) => {
      console.log(`${index + 1}. ${game.name}`);
      console.log(`   App ID: ${game.appid}`);
      console.log(`   Advertiser ID: ${game.advertiser_id}`);
      console.log(`   Promotion ID: ${game.promotion_id}`);
      console.log(`   Promotion ID 类型: ${typeof game.promotion_id}`);
      console.log(`   Promotion ID 长度: ${String(game.promotion_id).length}`);
      console.log(`   创建时间: ${game.created_at}`);
      console.log('-'.repeat(40));
    });

    // 检查是否有包含字母的promotion_id
    const invalidGames = games.filter(game =>
      game.promotion_id && /[^0-9]/.test(String(game.promotion_id))
    );

    if (invalidGames.length > 0) {
      console.log('⚠️ 发现包含非数字字符的promotion_id:');
      invalidGames.forEach(game => {
        console.log(`   ${game.name}: ${game.promotion_id}`);
      });
    } else {
      console.log('✅ 所有promotion_id都是纯数字');
    }

  } catch (error) {
    console.error('❌ 检查失败:', error);
  } finally {
    process.exit(0);
  }
}

checkGames();