const { Sequelize, Op } = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite',
  logging: false
});

// 模拟后端API逻辑
async function simulateEntityListAPI(userId, userRole) {
  console.log(`🔧 模拟 /api/entity/list API调用，用户ID: ${userId}, 角色: ${userRole}`);

  try {
    // 检查权限：管理员、老板和程序员可以查看主体列表
    const allowedRoles = ['admin', 'internal_boss', 'external_boss', 'programmer', 'steward'];
    if (!allowedRoles.includes(userRole)) {
      return { error: '权限不足', code: 403 };
    }

    let whereClause = '';
    let replacements = [];

    // 如果是外部老板角色，只看到包含他游戏的主体（不包括分配给他的主体，以避免权限泄露）
    if (userRole === 'external_boss') {
      // 获取外部老板的所有游戏
      const [userGames] = await sequelize.query(`
        SELECT DISTINCT g.name
        FROM user_games ug
        JOIN games g ON ug.game_id = g.id
        WHERE ug.user_id = ? AND g.status = 'active'
      `, { replacements: [userId] });

      // 提取游戏名称
      const gameNames = userGames.map(ug => ug.name).filter(name => name);

      // 只显示包含自己游戏的主体
      if (gameNames.length > 0) {
        const placeholders = gameNames.map(() => '?').join(',');
        whereClause = `WHERE e.game_name IN (${placeholders})`;
        replacements = gameNames;
      } else {
        // 如果没有游戏，返回空列表
        return { entities: [], total: 0 };
      }

      console.log(`👔 [外部老板筛选] 外部老板 (ID: ${userId}) 只查看包含其游戏的主体，共 ${gameNames.length} 个游戏: ${gameNames.join(', ')}`);
    }

    // 查询主体 - 使用正确的字段名
    const query = `
      SELECT
        e.id,
        e.name,
        e.game_name,
        e.programmer,
        e.manager,
        e.account_name,
        e.development_status,
        e.assigned_user_id,
        e.is_limited_status,
        e.created_at,
        u.username as assigned_user_username,
        u.name as assigned_user_name,
        u.role as assigned_user_role
      FROM entities e
      LEFT JOIN users u ON e.assigned_user_id = u.id
      ${whereClause}
      ORDER BY e.created_at DESC
    `;

    const [entities] = await sequelize.query(query, { replacements });

    console.log(`📋 返回主体数量: ${entities.length}`);
    entities.forEach(entity => {
      console.log(`   - ${entity.name} (游戏: ${entity.game_name}, 分配用户: ${entity.assigned_user_name || '未分配'}, 角色: ${entity.assigned_user_role || '无'})`);
    });

    return { entities, total: entities.length };

  } catch (error) {
    console.error('模拟API调用失败:', error);
    return { error: error.message, code: 500 };
  }
}

async function testExternalBossEntityAPI() {
  try {
    console.log('🧪 测试外部老板的主体列表API逻辑...');

    // 获取一个外部老板用户
    const [externalBosses] = await sequelize.query(
      'SELECT id, username, name, role FROM users WHERE role = "external_boss" AND id IN (SELECT DISTINCT user_id FROM user_games) LIMIT 1'
    );

    if (externalBosses.length === 0) {
      console.log('⚠️ 没有找到有游戏的外部老板');
      return;
    }

    const boss = externalBosses[0];
    console.log(`👔 测试外部老板: ${boss.name || boss.username} (ID: ${boss.id})`);

    // 模拟API调用
    const result = await simulateEntityListAPI(boss.id, boss.role);

    if (result.error) {
      console.log(`❌ API调用失败: ${result.error}`);
      return;
    }

    console.log(`✅ 外部老板可见的主体数量: ${result.total}`);

    // 检查这些主体是否对应外部老板的游戏
    const [bossGames] = await sequelize.query(`
      SELECT DISTINCT g.name
      FROM user_games ug
      JOIN games g ON ug.game_id = g.id
      WHERE ug.user_id = ? AND g.status = 'active'
    `, { replacements: [boss.id] });

    console.log(`🎮 外部老板的游戏: ${bossGames.map(g => g.name).join(', ')}`);

    // 验证每个返回的主体是否包含外部老板的游戏
    const gameNames = bossGames.map(g => g.name);
    const entityGameNames = [...new Set(result.entities.map(e => e.game_name))];

    console.log(`📋 主体对应的游戏: ${entityGameNames.join(', ')}`);

    const allMatch = entityGameNames.every(gameName => gameNames.includes(gameName));
    if (allMatch) {
      console.log(`✅ 所有返回的主体都对应外部老板的游戏`);
    } else {
      console.log(`⚠️  存在不匹配的主体`);
      const unmatched = entityGameNames.filter(name => !gameNames.includes(name));
      console.log(`   不匹配的游戏: ${unmatched.join(', ')}`);
    }

    // 测试前端筛选逻辑
    console.log(`\\n🔍 测试前端筛选逻辑:`);

    // 模拟前端的游戏数据（外部老板只能看到自己的游戏）
    const bossGameData = bossGames.map(g => ({
      id: Math.random(), // 模拟ID
      name: g.name,
      entity_name: result.entities.find(e => e.game_name === g.name)?.name || null
    }));

    console.log(`📋 外部老板的游戏数据:`);
    bossGameData.forEach(g => {
      console.log(`   - ${g.name}: entity_name="${g.entity_name}"`);
    });

    // 测试选择不同主体的筛选
    const visibleEntityNames = [...new Set(result.entities.map(e => e.name))];
    console.log(`📋 可选择的主体: ${visibleEntityNames.join(', ')}`);

    for (const entityName of visibleEntityNames) {
      const filteredGames = bossGameData.filter(game => {
        if (game.entity_name) {
          const entityNames = game.entity_name.split('、');
          return entityNames.includes(entityName);
        }
        return false;
      });

      console.log(`📊 选择主体 "${entityName}": ${filteredGames.length} 个游戏`);
      if (filteredGames.length > 0) {
        filteredGames.forEach(g => console.log(`   - ${g.name}`));
      } else {
        console.log(`   ❌ 无游戏 - 筛选逻辑有问题！`);
      }
    }

  } catch (error) {
    console.error('测试失败:', error.message);
  } finally {
    await sequelize.close();
  }
}

testExternalBossEntityAPI();