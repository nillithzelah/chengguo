const { testConnection, sequelize } = require('./config/database');
const defineGameModel = require('./models/Game');
const defineEntityModel = require('./models/Entity');

// 初始化模型
const Game = defineGameModel(sequelize);
const Entity = defineEntityModel(sequelize);

async function debugEntityNames() {
  try {
    console.log('🔍 开始调试entity_names问题...');

    // 连接数据库
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ 数据库连接失败');
      return;
    }

    // 获取一些游戏数据
    const games = await Game.findAll({
      attributes: ['id', 'appid', 'name', 'description', 'status', 'validated', 'created_at', 'app_secret', 'advertiser_id', 'promotion_id'],
      limit: 5
    });

    console.log('🎮 游戏数据:');
    games.forEach(game => {
      console.log(`  - ID: ${game.id}, Name: ${game.name}, AppID: ${game.appid}`);
    });

    // 为每个游戏查询主体信息
    for (const game of games) {
      try {
        console.log(`\n🏢 查询游戏 "${game.name}" 的主体信息...`);

        const entities = await Entity.findAll({
          where: { game_name: game.name },
          attributes: ['name'],
          order: [['created_at', 'DESC']]
        });

        console.log(`  📊 找到 ${entities.length} 个主体:`);
        entities.forEach(entity => {
          console.log(`    - 主体名称: ${entity.name}`);
        });

        const gameData = game.toJSON();
        if (entities && entities.length > 0) {
          gameData.entity_names = entities.map(entity => entity.name).join('、');
          console.log(`  ✅ 设置entity_names: ${gameData.entity_names}`);
        } else {
          gameData.entity_names = null;
          console.log(`  ⚠️ 无主体信息，设置entity_names为null`);
        }

        console.log(`  📋 最终gameData.entity_names: ${gameData.entity_names}`);

      } catch (error) {
        console.error(`  ❌ 查询游戏 "${game.name}" 主体信息失败:`, error.message);
        const gameData = game.toJSON();
        gameData.entity_names = null;
        console.log(`  📋 出错时设置entity_names为null: ${gameData.entity_names}`);
      }
    }

  } catch (error) {
    console.error('❌ 调试过程出错:', error);
  } finally {
    await sequelize.close();
  }
}

debugEntityNames();