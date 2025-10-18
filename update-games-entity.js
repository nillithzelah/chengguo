const { sequelize } = require('./config/database');
const Entity = require('./models/Entity')(sequelize);
const Game = require('./models/Game')(sequelize);

async function updateGamesWithEntities() {
  const transaction = await sequelize.transaction();

  try {
    console.log('开始更新游戏的entity_name字段...');

    // 获取所有实体
    const entities = await Entity.findAll({ transaction });
    console.log(`找到 ${entities.length} 个实体`);

    // 为每个游戏匹配实体
    const games = await Game.findAll({ transaction });
    console.log(`找到 ${games.length} 个游戏`);

    let updatedCount = 0;
    for (const game of games) {
      // 查找匹配的实体（通过游戏名称匹配）
      const matchingEntity = entities.find(entity =>
        entity.game_name && game.name.includes(entity.game_name)
      );

      if (matchingEntity && !game.entity_name) {
        await game.update(
          { entity_name: matchingEntity.name },
          { transaction }
        );
        console.log(`更新游戏 ${game.name} -> ${matchingEntity.name}`);
        updatedCount++;
      }
    }

    // 提交事务
    await transaction.commit();
    console.log(`更新完成，共更新 ${updatedCount} 个游戏`);
    process.exit(0);
  } catch (error) {
    // 回滚事务
    await transaction.rollback();
    console.error('更新失败:', error);
    process.exit(1);
  }
}

updateGamesWithEntities();