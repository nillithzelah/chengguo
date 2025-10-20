const { sequelize } = require('./config/database');
const Game = require('./models/Game')(sequelize);
const Entity = require('./models/Entity')(sequelize);

async function testAssociations() {
  try {
    console.log('📡 测试关联关系...');

    // 测试 Entity -> Games 关联
    console.log('\n🔍 测试 Entity -> Games 关联:');
    try {
      const entities = await Entity.findAll({
        include: [{ model: Game, as: 'games' }]
      });

      entities.forEach(entity => {
        console.log(`Entity: ${entity.name}, Games: ${entity.games ? entity.games.length : 0}`);
      });
    } catch (error) {
      console.log('❌ 测试失败:', error.message);
    }

    // 测试 Game -> Entity 关联
    console.log('\n🔍 测试 Game -> Entity 关联:');
    try {
      const games = await Game.findAll({
        include: [{ model: Entity, as: 'entity' }]
      });

      games.forEach(game => {
        console.log(`Game: ${game.name}, Entity: ${game.entity ? game.entity.name : '未关联'}`);
      });
    } catch (error) {
      console.log('❌ 测试失败:', error.message);
    }

    // 测试 Entity -> User 关联
    console.log('\n🔍 测试 Entity -> User 关联:');
    try {
      const entitiesWithUsers = await Entity.findAll({
        include: [{ model: require('./models/User')(sequelize), as: 'assignedUser' }]
      });

      entitiesWithUsers.forEach(entity => {
        console.log(`Entity: ${entity.name}, Assigned User: ${entity.assignedUser ? entity.assignedUser.name : '未分配'}`);
      });
    } catch (error) {
      console.log('❌ 测试失败:', error.message);
    }

    console.log('\n✅ 关联关系测试完成');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testAssociations();