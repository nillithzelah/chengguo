const { Sequelize } = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite'
});

async function checkTableStructure() {
  try {
    // 检查entities表结构
    const entitiesResult = await sequelize.query('PRAGMA table_info(entities)', {
      type: Sequelize.QueryTypes.SELECT
    });

    console.log('entities表字段信息:');
    entitiesResult.forEach(col => {
      console.log(`  ${col.name}: ${col.type}`);
    });

    // 检查ID为119的entity记录
    const entity119 = await sequelize.query('SELECT * FROM entities WHERE id = 119', {
      type: Sequelize.QueryTypes.SELECT
    });

    console.log('\nID为119的entity记录:');
    if (entity119.length > 0) {
      console.log(JSON.stringify(entity119[0], null, 2));
    } else {
      console.log('未找到ID为119的记录');
    }

    const result = await sequelize.query('PRAGMA table_info(games)', {
      type: Sequelize.QueryTypes.SELECT
    });

    console.log('\ngames表字段信息:');
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