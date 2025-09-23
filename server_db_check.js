const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite',
  logging: false
});

async function checkServerDB() {
  try {
    console.log('📊 服务器数据库状态检查：');
    console.log('===========================');

    // 检查表是否存在
    const [tables] = await sequelize.query(
      "SELECT name FROM sqlite_master WHERE type='table'"
    );

    console.log('📋 数据库表列表:');
    tables.forEach(table => {
      console.log(`  - ${table.name}`);
    });

    // 检查转化事件表
    if (tables.some(t => t.name === 'conversion_events')) {
      console.log('\n✅ conversion_events表存在');

      // 统计数据
      const [totalResult] = await sequelize.query(
        'SELECT COUNT(*) as total FROM conversion_events'
      );
      console.log(`📊 总转化事件数: ${totalResult[0].total}`);

      // 最新记录
      const [latest] = await sequelize.query(
        'SELECT id, event_type, status, created_at FROM conversion_events ORDER BY id DESC LIMIT 3'
      );

      console.log('\n📝 最新3条记录:');
      latest.forEach(record => {
        console.log(`  ID ${record.id}: ${record.event_type} - ${record.status} (${record.created_at})`);
      });

    } else {
      console.log('\n❌ conversion_events表不存在');
    }

  } catch (error) {
    console.error('❌ 数据库检查失败:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkServerDB();