const { Sequelize } = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

async function checkExternalBoss() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');

    // 查找所有用户角色分布
    const [users] = await sequelize.query('SELECT role, COUNT(*) as count FROM users GROUP BY role');
    console.log('用户角色分布:', users);

    // 查找外部老板用户
    const [externalBosses] = await sequelize.query('SELECT id, username, name, role FROM users WHERE role = "external_boss"');
    console.log('外部老板用户数量:', externalBosses.length);
    externalBosses.forEach(boss => {
      console.log('  ID:', boss.id, '用户名:', boss.username, '姓名:', boss.name);
    });

    if (externalBosses.length > 0) {
      const bossId = externalBosses[0].id;
      console.log('\n检查外部老板ID:', bossId, '的游戏');

      // 查找外部老板的游戏
      const [userGames] = await sequelize.query(`
        SELECT ug.*, g.name as game_name, g.appid
        FROM user_games ug
        JOIN games g ON ug.game_id = g.id
        WHERE ug.user_id = ?
        ORDER BY ug.assigned_at DESC
      `, {
        replacements: [bossId]
      });

      console.log('外部老板的游戏数量:', userGames.length);
      userGames.forEach(game => {
        console.log('  游戏ID:', game.game_id, '名称:', game.game_name, 'AppID:', game.appid);
      });

      // 检查这些游戏是否在entity表中有对应记录
      if (userGames.length > 0) {
        const gameNames = userGames.map(g => g.game_name);
        console.log('\n游戏名称列表:', gameNames);

        const placeholders = gameNames.map(() => '?').join(',');
        const [entities] = await sequelize.query(
          `SELECT * FROM entities WHERE game_name IN (${placeholders})`,
          { replacements: gameNames }
        );

        console.log('对应的主体记录数量:', entities.length);
        entities.forEach(entity => {
          console.log('  主体:', entity.name, '游戏:', entity.game_name);
        });
      }
    }

  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    await sequelize.close();
  }
}

checkExternalBoss();