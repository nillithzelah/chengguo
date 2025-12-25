const { Sequelize } = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

async function checkEntityRoles() {
  try {
    console.log('开始查询数据库...');

    // 检查entities表是否存在
    const [tables] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table' AND name='entities'");
    if (tables.length === 0) {
      console.log('entities表不存在');
      return;
    }

    // 查询assigned_user_role统计
    const [results] = await sequelize.query('SELECT assigned_user_role, COUNT(*) as count FROM entities GROUP BY assigned_user_role');
    console.log('主体分配用户角色统计:');
    results.forEach(row => {
      console.log('  ' + (row.assigned_user_role || 'NULL') + ': ' + row.count + ' 条');
    });

    console.log('\n检查ID为119的主体记录:');
    const [entity119] = await sequelize.query('SELECT id, name, assigned_user_role, assigned_user_id, programmer, manager, account_name, game_name, development_status FROM entities WHERE id = 119');
    if (entity119.length > 0) {
      const entity = entity119[0];
      console.log('  ID: ' + entity.id + ', 名称: ' + entity.name + ', 角色: ' + (entity.assigned_user_role || 'NULL') + ', 用户ID: ' + (entity.assigned_user_id || 'NULL'));
      console.log('  程序员: ' + (entity.programmer || 'NULL') + ', 管理者: ' + (entity.manager || 'NULL'));
      console.log('  账号名: ' + (entity.account_name || 'NULL') + ', 游戏名: ' + (entity.game_name || 'NULL'));
      console.log('  开发状态: ' + (entity.development_status || 'NULL'));
    } else {
      console.log('  未找到ID为119的主体记录');
    }

    console.log('\n前10条主体记录:');
    const [entities] = await sequelize.query('SELECT id, name, assigned_user_role, assigned_user_id FROM entities LIMIT 10');
    entities.forEach(entity => {
      console.log('  ID: ' + entity.id + ', 名称: ' + entity.name + ', 角色: ' + (entity.assigned_user_role || 'NULL') + ', 用户ID: ' + (entity.assigned_user_id || 'NULL'));
    });

    // 检查是否有NULL值的记录
    const [nullRoles] = await sequelize.query('SELECT COUNT(*) as count FROM entities WHERE assigned_user_role IS NULL OR assigned_user_role = ""');
    console.log('\nNULL或空角色记录数: ' + nullRoles[0].count);

  } catch (error) {
    console.error('查询失败:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkEntityRoles();