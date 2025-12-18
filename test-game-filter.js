const { Sequelize } = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite',
  logging: false
});

// 模拟前端的游戏筛选逻辑
function filterGamesByEntity(games, selectedEntityName) {
  if (!selectedEntityName) {
    return games; // 不筛选时返回所有游戏
  }

  return games.filter(game => {
    if (game.entity_name) {
      const entityNames = game.entity_name.split('、');
      return entityNames.includes(selectedEntityName);
    }
    return false;
  });
}

async function testGameFilter() {
  try {
    console.log('🧪 测试外部老板选择主体后的游戏筛选...');

    // 获取一个外部老板
    const [externalBosses] = await sequelize.query(
      'SELECT id, username, name FROM users WHERE role = "external_boss" AND id IN (SELECT DISTINCT user_id FROM user_games) LIMIT 1'
    );

    if (externalBosses.length === 0) {
      console.log('⚠️  没有找到有游戏的外部老板');
      return;
    }

    const boss = externalBosses[0];
    console.log(`👔 测试外部老板: ${boss.name || boss.username} (ID: ${boss.id})`);

    // 获取外部老板的游戏列表（模拟前端缓存的游戏数据）
    const [userGames] = await sequelize.query(`
      SELECT g.id, g.name, g.appid
      FROM user_games ug
      JOIN games g ON ug.game_id = g.id
      WHERE ug.user_id = ? AND g.status = 'active'
      ORDER BY ug.assigned_at DESC
    `, { replacements: [boss.id] });

    console.log(`🎮 外部老板的游戏数量: ${userGames.length}`);
    userGames.forEach(g => console.log(`   - ${g.name} (${g.appid})`));

    // 为每个游戏添加 entity_name 字段（模拟后端逻辑）
    const gamesWithEntities = [];
    for (const game of userGames) {
      const [entities] = await sequelize.query(`
        SELECT name
        FROM entities
        WHERE game_name = ?
        ORDER BY created_at DESC
      `, { replacements: [game.name] });

      const gameData = { ...game };
      if (entities && entities.length > 0) {
        gameData.entity_name = entities.map(e => e.name).join('、');
      } else {
        gameData.entity_name = null;
      }

      gamesWithEntities.push(gameData);
    }

    console.log(`📋 游戏的主体信息:`);
    gamesWithEntities.forEach(g => {
      console.log(`   - ${g.name}: ${g.entity_name || '无主体'}`);
    });

    // 获取外部老板可见的主体列表（修复后的逻辑）
    const [bossGames] = await sequelize.query(`
      SELECT DISTINCT g.name
      FROM user_games ug
      JOIN games g ON ug.game_id = g.id
      WHERE ug.user_id = ?
    `, { replacements: [boss.id] });

    const gameNames = bossGames.map(g => g.name);
    const placeholders = gameNames.map(() => '?').join(',');
    const [visibleEntities] = await sequelize.query(`
      SELECT DISTINCT e.name
      FROM entities e
      WHERE e.game_name IN (${placeholders})
    `, { replacements: gameNames });

    console.log(`📋 外部老板可见的主体数量: ${visibleEntities.length}`);
    visibleEntities.forEach(e => console.log(`   - ${e.name}`));

    // 测试筛选逻辑
    console.log(`\\n🔍 测试游戏筛选:`);

    // 1. 不选择主体时
    const noFilterGames = filterGamesByEntity(gamesWithEntities, '');
    console.log(`📊 不选择主体: ${noFilterGames.length} 个游戏`);
    noFilterGames.forEach(g => console.log(`   - ${g.name}`));

    // 2. 选择每个可见主体时
    for (const entity of visibleEntities) {
      const filteredGames = filterGamesByEntity(gamesWithEntities, entity.name);
      console.log(`📊 选择主体 "${entity.name}": ${filteredGames.length} 个游戏`);
      if (filteredGames.length > 0) {
        filteredGames.forEach(g => console.log(`   - ${g.name}`));
      } else {
        console.log(`   ❌ 无游戏 - 这就是问题所在！`);
        console.log(`   检查: 游戏的 entity_name 是否包含 "${entity.name}"`);

        gamesWithEntities.forEach(g => {
          const hasEntity = g.entity_name && g.entity_name.split('、').includes(entity.name);
          console.log(`     ${g.name}: entity_name="${g.entity_name}" 包含"${entity.name}"=${hasEntity}`);
        });
      }
    }

  } catch (error) {
    console.error('测试失败:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

testGameFilter();