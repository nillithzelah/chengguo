const { sequelize } = require('./config/database');
const Game = require('./models/Game')(sequelize);

async function checkGames() {
  try {
    console.log('检查目标游戏...');

    const targetEntityNames = ['001.寒煜钟表', '002.克起包', '003.江岔子'];
    const games = await Game.findAll({
      where: {
        entity_name: targetEntityNames
      },
      attributes: ['id', 'appid', 'name', 'entity_name']
    });

    console.log('目标游戏列表:');
    games.forEach(game => {
      console.log(`  ${game.entity_name}: ${game.appid} (${game.name})`);
    });

    // 检查查询的游戏是否在列表中
    const queriedAppId = 'tt8513f3ae1a1ce1af02';
    const queriedGame = await Game.findOne({
      where: { appid: queriedAppId },
      attributes: ['id', 'appid', 'name', 'entity_name']
    });

    if (queriedGame) {
      console.log(`查询的游戏 ${queriedAppId}: ${queriedGame.name} (${queriedGame.entity_name})`);
      console.log(`是否在目标列表中: ${targetEntityNames.includes(queriedGame.entity_name) ? '是' : '否'}`);
    } else {
      console.log(`查询的游戏 ${queriedAppId} 不存在于数据库中`);
    }

    // 显示前10个游戏
    console.log('\n前10个游戏:');
    const allGames = await Game.findAll({
      attributes: ['appid', 'name', 'entity_name'],
      limit: 10
    });
    allGames.forEach(game => {
      console.log(`${game.appid}: ${game.name} (${game.entity_name || 'null'})`);
    });

  } catch (error) {
    console.error('查询错误:', error.message);
  } finally {
    sequelize.close();
  }
}

checkGames();