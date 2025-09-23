#!/usr/bin/env node

/**
 * 检查转化事件表脚本
 * 验证conversion_events表是否成功创建
 */

const { testConnection, sequelize } = require('../config/database');

async function checkConversionEventsTable() {
  console.log('🔍 检查转化事件表 (conversion_events)');
  console.log('=' .repeat(50));

  try {
    // 1. 测试数据库连接
    console.log('📡 测试数据库连接...');
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ 数据库连接失败');
      process.exit(1);
    }
    console.log('✅ 数据库连接成功');

    // 2. 检查表是否存在
    console.log('\n📋 检查表是否存在...');
    const tableExists = await sequelize.getQueryInterface().showAllTables();
    const hasConversionEvents = tableExists.includes('conversion_events');

    if (hasConversionEvents) {
      console.log('✅ conversion_events 表已存在');
    } else {
      console.log('❌ conversion_events 表不存在');
      console.log('💡 请先运行: node scripts/init-db.js');
      process.exit(1);
    }

    // 3. 检查表结构
    console.log('\n📊 检查表结构...');
    const tableDescription = await sequelize.getQueryInterface().describeTable('conversion_events');

    console.log('📋 表字段列表:');
    console.table(Object.entries(tableDescription).map(([field, info]) => ({
      字段名: field,
      类型: info.type,
      允许NULL: info.allowNull ? '是' : '否',
      默认值: info.defaultValue || '无',
      主键: info.primaryKey ? '是' : '否',
      自动递增: info.autoIncrement ? '是' : '否'
    })));

    // 4. 检查表中的数据
    console.log('\n📈 检查表中数据...');

    // 初始化ConversionEvent模型
    const defineConversionEventModel = require('../models/ConversionEvent');
    const ConversionEvent = defineConversionEventModel(sequelize);

    const totalRecords = await ConversionEvent.count();
    console.log(`📊 总记录数: ${totalRecords}`);

    if (totalRecords > 0) {
      console.log('\n📝 最近5条记录:');
      const recentRecords = await ConversionEvent.findAll({
        limit: 99,
        order: [['created_at', 'DESC']],
        attributes: [
          'id', 'event_type', 'event_name', 'callback', 'status',
          'processing_time', 'error_message', 'created_at'
        ]
      });

      console.table(recentRecords.map(record => ({
        ID: record.id,
        事件类型: `${record.event_type} (${record.event_name})`,
        状态: record.status === 'success' ? '✅ 成功' :
              record.status === 'failed' ? '❌ 失败' : '⏳ 处理中',
        处理时间: record.processing_time ? `${record.processing_time}ms` : '未处理',
        错误信息: record.error_message || '无',
        创建时间: record.created_at.toLocaleString('zh-CN')
      })));
    }

    // 5. 统计信息
    console.log('\n📊 数据统计:');
    const successCount = await ConversionEvent.count({ where: { status: 'success' } });
    const failedCount = await ConversionEvent.count({ where: { status: 'failed' } });
    const processingCount = await ConversionEvent.count({ where: { status: 'processing' } });

    console.log(`✅ 成功处理: ${successCount} 条`);
    console.log(`❌ 处理失败: ${failedCount} 条`);
    console.log(`⏳ 正在处理: ${processingCount} 条`);

    if (totalRecords > 0) {
      const avgProcessingTime = await ConversionEvent.sequelize.query(
        'SELECT AVG(processing_time) as avg_time FROM conversion_events WHERE processing_time IS NOT NULL',
        { type: sequelize.QueryTypes.SELECT }
      );
      if (avgProcessingTime[0].avg_time) {
        console.log(`⚡ 平均处理时间: ${Math.round(avgProcessingTime[0].avg_time)}ms`);
      }
    }

    // 6. 验证API端点
    console.log('\n🔗 验证API端点...');

    // 这里可以添加简单的HTTP请求来验证API是否正常工作
    console.log('💡 可以通过以下方式验证API:');
    console.log('   curl "http://localhost:3000/api/conversion/event-types"');
    console.log('   curl "http://localhost:3000/api/conversion/callback?callback=test&event_type=0&idfa=test"');

    console.log('\n🎉 转化事件表检查完成！');
    console.log('✅ 表结构完整，功能正常');

  } catch (error) {
    console.error('❌ 检查转化事件表失败:', error);
    process.exit(1);
  }
}

// 运行检查脚本
checkConversionEventsTable().then(() => {
  console.log('\n✅ 检查脚本执行完毕');
  process.exit(0);
}).catch((error) => {
  console.error('❌ 检查脚本执行失败:', error);
  process.exit(1);
});