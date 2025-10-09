const { testConnection, sequelize } = require('./config/database');
const defineGameModel = require('./models/Game');

async function checkGames() {
  try {
    // 测试数据库连接
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ 数据库连接失败');
      return;
    }

    // 初始化Game模型
    const Game = defineGameModel(sequelize);

    // 查询所有游戏
    const games = await Game.findAll({
      attributes: ['id', 'name', 'advertiser_id', 'promotion_id']
    });

    console.log('📋 数据库中的游戏数据:');
    games.forEach(game => {
      console.log(`ID: ${game.id}`);
      console.log(`名称: ${game.name}`);
      console.log(`广告主ID: ${game.advertiser_id}`);
      console.log(`推广计划ID: ${game.promotion_id}`);
      console.log('---');
    });

  } catch (error) {
    console.error('❌ 查询失败:', error);
  } finally {
    process.exit(0);
  }
}

checkGames();