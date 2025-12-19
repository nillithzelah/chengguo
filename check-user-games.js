const { Sequelize } = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite'
});

async function checkUserGames() {
  try {
    const results = await sequelize.query(`
      SELECT u.username, u.role, COUNT(ug.id) as game_count
      FROM users u
      LEFT JOIN user_games ug ON u.id = ug.user_id
      GROUP BY u.id, u.username, u.role
      ORDER BY game_count DESC
      LIMIT 10
    `, { type: Sequelize.QueryTypes.SELECT });

    console.log('用户游戏分配统计:');
    results.forEach(r => {
      console.log(`  ${r.username} (${r.role}): ${r.game_count} 个游戏`);
    });

    // 检查管理员用户
    const adminUsers = await sequelize.query(`
      SELECT u.id, u.username, u.role
      FROM users u
      WHERE u.role IN ('admin', 'steward')
    `, { type: Sequelize.QueryTypes.SELECT });

    console.log('\n管理员用户:');
    adminUsers.forEach(u => {
      console.log(`  ${u.username} (${u.role}) - ID: ${u.id}`);
    });

  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    await sequelize.close();
  }
}

checkUserGames();