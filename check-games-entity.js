const { sequelize } = require('./config/database');
const Game = require('./models/Game')(sequelize);

async function checkGames() {
  try {
    const games = await Game.findAll();
    console.log('Games with entity_name:');
    games.forEach(game => {
      console.log(`ID: ${game.id}, Name: ${game.name}, Entity: ${game.entity_name || 'NULL'}`);
    });
    console.log(`\nTotal games: ${games.length}`);
    console.log(`Games with entity: ${games.filter(g => g.entity_name).length}`);
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

checkGames();