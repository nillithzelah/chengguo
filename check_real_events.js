const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite',
  logging: false
});

async function checkRealEvents() {
  try {
    console.log('📊 检查ID 6和7的转化事件记录详情：');
    console.log('===================================');

    const [results] = await sequelize.query(
      'SELECT id, callback, event_type, event_name, status, error_message, request_ip, user_agent, created_at FROM conversion_events WHERE id IN (6, 7) ORDER BY id'
    );

    console.log('ID 6和7的转化事件记录：');
    results.forEach(row => {
      console.log(`\n📋 记录ID: ${row.id}`);
      console.log(`   事件类型: ${row.event_type} (${row.event_name})`);
      console.log(`   状态: ${row.status}`);
      console.log(`   Callback: ${row.callback}`);
      console.log(`   请求IP: ${row.request_ip}`);
      console.log(`   User-Agent: ${row.user_agent}`);
      console.log(`   创建时间: ${row.created_at}`);
      if (row.error_message) {
        console.log(`   错误信息: ${row.error_message}`);
      }
    });

  } catch (error) {
    console.error('查询失败:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkRealEvents();