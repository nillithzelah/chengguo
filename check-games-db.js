const { Sequelize } = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite'
});

async function checkGames() {
  try {
    const results = await sequelize.query('SELECT id, name, appid, app_secret FROM games LIMIT 10', {
      type: Sequelize.QueryTypes.SELECT
    });

    console.log('Games in database:');
    results.forEach(game => {
      console.log(`ID: ${game.id}, Name: ${game.name}, AppID: ${game.appid}, AppSecret: ${game.app_secret ? '存在' : '不存在'}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkGames();