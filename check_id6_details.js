const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite',
  logging: false
});

async function checkId6Details() {
  try {
    console.log('📋 ID 6的完整转化事件记录详情：');
    console.log('=====================================');

    const [results] = await sequelize.query(
      'SELECT * FROM conversion_events WHERE id = 6'
    );

    if (results.length > 0) {
      const record = results[0];
      console.log('基本信息:');
      console.log(`  ID: ${record.id}`);
      console.log(`  事件类型: ${record.event_type} (${record.event_name})`);
      console.log(`  状态: ${record.status}`);
      console.log(`  Callback: ${record.callback}`);
      console.log(`  处理时间: ${record.processing_time}ms`);
      console.log(`  请求IP: ${record.request_ip}`);
      console.log(`  User-Agent: ${record.user_agent}`);
      console.log(`  创建时间: ${record.created_at}`);
      console.log(`  处理完成时间: ${record.processed_at}`);

      console.log('\n设备信息:');
      console.log(`  IDFA: ${record.idfa || '无'}`);
      console.log(`  IMEI: ${record.imei || '无'}`);
      console.log(`  OAID: ${record.oaid || '无'}`);
      console.log(`  Android ID: ${record.android_id || '无'}`);
      console.log(`  OS: ${record.os}`);
      console.log(`  MUID: ${record.muid || '无'}`);

      console.log('\nAPI响应信息:');
      console.log(`  回调响应: ${record.callback_response ? '有' : '无'}`);
      console.log(`  回调状态码: ${record.callback_status || '无'}`);
      console.log(`  错误信息: ${record.error_message || '无'}`);

      if (record.callback_response) {
        try {
          const response = JSON.parse(record.callback_response);
          console.log('  解析后的响应:', JSON.stringify(response, null, 2));
        } catch (e) {
          console.log('  原始响应:', record.callback_response);
        }
      }
    } else {
      console.log('未找到ID为6的记录');
    }

  } catch (error) {
    console.error('查询失败:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkId6Details();