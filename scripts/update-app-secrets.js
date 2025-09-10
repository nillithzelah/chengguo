const { testConnection, sequelize } = require('../config/database');
const defineGameModel = require('../models/Game');
const Game = defineGameModel(sequelize);

async function updateAppSecrets() {
  try {
    console.log('📡 连接数据库...');
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ 数据库连接失败');
      return;
    }

    console.log('🔄 更新游戏的app_secret...');

    // 使用原生SQL查询更新所有游戏的app_secret
    const [affectedRows] = await sequelize.query(
      "UPDATE games SET app_secret = '56808246ee49c052ecc7be8be79551859837409e' WHERE app_secret IS NULL OR app_secret = '' OR app_secret = 'undefined'",
      { type: sequelize.QueryTypes.UPDATE }
    );

    console.log(`✅ 成功更新了 ${affectedRows} 个游戏的app_secret`);

    // 显示更新后的游戏列表
    const games = await Game.findAll({
      attributes: ['id', 'appid', 'name', 'app_secret'],
      where: { status: 'active' }
    });

    console.log('📋 更新后的游戏列表:');
    games.forEach(game => {
      console.log(`  - ${game.appid}: ${game.app_secret ? '✅ 已设置' : '❌ 未设置'}`);
    });

  } catch (error) {
    console.error('❌ 更新失败:', error);
  } finally {
    await sequelize.close();
  }
}

updateAppSecrets();