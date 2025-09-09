#!/usr/bin/env node

const { testConnection } = require('../config/database');

async function testDatabaseConnection() {
  console.log('🔍 测试数据库连接...');
  console.log('环境变量配置:');
  console.log('  DB_TYPE:', process.env.DB_TYPE);
  console.log('  DB_HOST:', process.env.DB_HOST);
  console.log('  DB_PORT:', process.env.DB_PORT);
  console.log('  DB_NAME:', process.env.DB_NAME);
  console.log('  DB_USER:', process.env.DB_USER);
  console.log('  DB_PASSWORD:', process.env.DB_PASSWORD ? '已设置' : '未设置');

  console.log('\n📡 尝试连接数据库...');

  try {
    const isConnected = await testConnection();
    if (isConnected) {
      console.log('✅ 数据库连接成功！');
      console.log('🎉 现在可以运行其他数据库命令了');
    } else {
      console.log('❌ 数据库连接失败');
      console.log('\n🔧 故障排除建议:');
      console.log('1. 确保PostgreSQL服务正在运行');
      console.log('2. 检查数据库是否存在: CREATE DATABASE chengguo_db;');
      console.log('3. 检查用户权限: GRANT ALL PRIVILEGES ON DATABASE chengguo_db TO postgres;');
      console.log('4. 或者使用SQLite作为替代方案（移除.env中的DB_TYPE=postgres）');
    }
  } catch (error) {
    console.error('❌ 连接测试出错:', error.message);
    console.log('\n💡 可能的原因:');
    console.log('- PostgreSQL未安装或未启动');
    console.log('- 数据库不存在');
    console.log('- 用户名/密码错误');
    console.log('- 网络连接问题');
  }
}

// 运行测试
testDatabaseConnection().then(() => {
  console.log('\n✅ 测试完成');
  process.exit(0);
}).catch((error) => {
  console.error('❌ 测试失败:', error);
  process.exit(1);
});