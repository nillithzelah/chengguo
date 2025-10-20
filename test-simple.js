const { sequelize } = require('./config/database');
const Entity = sequelize.models.Entity;
const Game = sequelize.models.Game;
const User = sequelize.models.User;

async function testSimple() {
  try {
    console.log('Testing Entity -> Games association...');
    const entities = await Entity.findAll({
      include: [{ model: Game, as: 'games' }]
    });

    console.log('Entities with games:');
    entities.forEach(e => {
      console.log(`Entity: ${e.name}, Games: ${e.games ? e.games.length : 0}`);
    });

    console.log('\nTesting Game -> Entity association...');
    const games = await Game.findAll({
      include: [{ model: Entity, as: 'entity' }]
    });

    console.log('Games with entities:');
    games.forEach(g => {
      console.log(`Game: ${g.name}, Entity: ${g.entity ? g.entity.name : 'null'}`);
    });

    console.log('\nTesting Entity -> User association...');
    const entitiesWithUsers = await Entity.findAll({
      include: [{ model: User, as: 'assignedUser' }]
    });

    console.log('Entities with users:');
    entitiesWithUsers.forEach(e => {
      console.log(`Entity: ${e.name}, User: ${e.assignedUser ? e.assignedUser.name : 'null'}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testSimple();