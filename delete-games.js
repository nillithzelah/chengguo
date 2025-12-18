const { sequelize } = require('./config/database');
const defineGameModel = require('./models/Game');
const Game = defineGameModel(sequelize);

async function deleteAllGames() {
  try {
    console.log('连接数据库...');
    await sequelize.authenticate();
    console.log('数据库连接成功');

    console.log('查询游戏数量...');
    const countBefore = await Game.count();
    console.log(`删除前有 ${countBefore} 个游戏`);

    console.log('删除所有游戏...');
    const deletedCount = await Game.destroy({ where: {} });
    console.log(`已删除 ${deletedCount} 个游戏记录`);

    const countAfter = await Game.count();
    console.log(`删除后还有 ${countAfter} 个游戏`);

    await sequelize.close();
    console.log('数据库连接已关闭');
  } catch (error) {
    console.error('删除失败:', error);
    await sequelize.close();
  }
}

deleteAllGames();