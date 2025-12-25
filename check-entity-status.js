const { Sequelize } = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

async function checkEntityStatus() {
  try {
    console.log('开始检查主体开发状态...');

    // 检查entities表是否存在
    const [tables] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table' AND name='entities'");
    if (tables.length === 0) {
      console.log('entities表不存在');
      return;
    }

    // 查询所有有游戏的主体
    const [entities] = await sequelize.query(`
      SELECT id, name, game_name, development_status, is_limited_status, assigned_user_id
      FROM entities
      WHERE game_name IS NOT NULL AND game_name != ''
      ORDER BY id
    `);

    console.log('='.repeat(100));
    console.log('主体开发状态检查结果:');
    console.log('='.repeat(100));

    let limitedCount = 0;
    let canUpgradeCount = 0;
    let cannotUpgradeCount = 0;

    entities.forEach(entity => {
      const status = entity.development_status || '游戏创建';
      const limited = entity.is_limited_status ? '是' : '否';
      const canUpgrade = status === '游戏备案进行中' && entity.is_limited_status ? '❌ 受限' : '✅ 可升级';

      if (entity.is_limited_status) limitedCount++;
      if (canUpgrade === '✅ 可升级') canUpgradeCount++;
      else cannotUpgradeCount++;

      console.log(`ID: ${entity.id.toString().padEnd(3)} | 名称: ${entity.name.padEnd(20)} | 游戏: ${entity.game_name.padEnd(15)} | 状态: ${status.padEnd(12)} | 限制: ${limited} | 可升级到上线: ${canUpgrade}`);
    });

    console.log('='.repeat(100));
    console.log(`统计结果:`);
    console.log(`总计有游戏的主体: ${entities.length} 个`);
    console.log(`有限制状态的主体: ${limitedCount} 个`);
    console.log(`可以升级到上线的主体: ${canUpgradeCount} 个`);
    console.log(`无法升级到上线的主体: ${cannotUpgradeCount} 个`);

    // 检查具体的限制状态主体
    if (limitedCount > 0) {
      console.log('\n有限制状态的主体详情:');
      entities.filter(e => e.is_limited_status).forEach(entity => {
        console.log(`  ID: ${entity.id}, 名称: ${entity.name}, 当前状态: ${entity.development_status}`);
      });
    }

  } catch (error) {
    console.error('查询失败:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkEntityStatus();