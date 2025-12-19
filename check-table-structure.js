const { Sequelize } = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite'
});

async function checkTableStructure() {
  try {
    const result = await sequelize.query('PRAGMA table_info(games)', {
      type: Sequelize.QueryTypes.SELECT
    });

    console.log('games表字段信息:');
    result.forEach(col => {
      console.log(`  ${col.name}: ${col.type}`);
    });

    // 检查一些游戏记录的app_secret字段
    const games = await sequelize.query('SELECT id, name, appid, app_secret FROM games LIMIT 5', {
      type: Sequelize.QueryTypes.SELECT
    });

    console.log('\n前5个游戏的app_secret字段:');
    games.forEach(game => {
      console.log(`  ID ${game.id}: ${game.name} - app_secret: ${game.app_secret ? game.app_secret.substring(0, 10) + '...' : 'NULL'}`);
    });

  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    await sequelize.close();
  }
}

checkTableStructure();