const { Sequelize } = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

async function checkEntities() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');

    // 查询entity表中的所有记录
    const [entities] = await sequelize.query('SELECT * FROM entities ORDER BY game_name');
    console.log('entity表记录数量:', entities.length);

    // 按game_name分组统计
    const gameStats = {};
    entities.forEach(entity => {
      const gameName = entity.game_name;
      if (!gameStats[gameName]) {
        gameStats[gameName] = [];
      }
      gameStats[gameName].push(entity.name);
    });

    console.log('按游戏分组的主体统计:');
    Object.entries(gameStats).forEach(([gameName, entityNames]) => {
      console.log(`  ${gameName}: [${entityNames.join(', ')}]`);
    });

    // 查询games表中的所有记录
    const [games] = await sequelize.query('SELECT id, name, appid FROM games WHERE status = "active" ORDER BY name');
    console.log('\ngames表记录数量:', games.length);

    // 检查哪些游戏没有在entity表中
    const gamesWithoutEntities = games.filter(game => !gameStats[game.name]);
    console.log('\n没有在entity表中找到的游戏:');
    gamesWithoutEntities.forEach(game => {
      console.log(`  ID: ${game.id}, 名称: ${game.name}, AppID: ${game.appid}`);
    });

  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    await sequelize.close();
  }
}

checkEntities();