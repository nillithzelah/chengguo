#!/usr/bin/env node

const { testConnection } = require('../config/database');

async function testDatabaseConnection() {
  const { dbConfig } = require('../config/database');
  
  console.log('🔍 测试数据库连接...');
  console.log('环境变量配置:');
  console.log('  DB_TYPE:', process.env.DB_TYPE || 'sqlite (默认)');
  console.log('  DB_HOST:', process.env.DB_HOST || 'N/A (SQLite不使用)');
  console.log('  DB_PORT:', process.env.DB_PORT || 'N/A (SQLite不使用)');
  console.log('  DB_NAME:', process.env.DB_NAME || 'N/A (SQLite使用文件)');
  console.log('  DB_USER:', process.env.DB_USER || 'N/A (SQLite不使用)');
  console.log('  DB_PASSWORD:', process.env.DB_PASSWORD ? '已设置' : 'N/A (SQLite不使用)');
  
  // 显示实际使用的数据库类型
  console.log('\n📊 实际数据库配置:');
  console.log('  类型:', dbConfig.dialect);
  if (dbConfig.dialect === 'sqlite') {
    console.log('  文件:', dbConfig.storage);
  } else {
    console.log('  主机:', dbConfig.host);
    console.log('  端口:', dbConfig.port);
    console.log('  数据库:', dbConfig.database);
  }

  console.log('\n📡 尝试连接数据库...');

  try {
    const isConnected = await testConnection();
    if (isConnected) {
      console.log('✅ 数据库连接成功！');
      console.log(`🎉 ${dbConfig.dialect.toUpperCase()} 数据库正常工作`);
      console.log('   现在可以运行其他数据库命令了');
    } else {
      console.log('❌ 数据库连接失败');
      console.log('\n🔧 故障排除建议:');
      
      if (dbConfig.dialect === 'sqlite') {
        console.log('1. 检查 SQLite 文件是否存在:', dbConfig.storage);
        console.log('2. 检查文件权限 (需要读写权限)');
        console.log('3. 确保 sequelize 和 sqlite3 依赖已安装: npm install');
        console.log('4. 检查项目目录是否有 database.sqlite 文件');
      } else {
        console.log('1. 确保 PostgreSQL 服务正在运行: systemctl status postgresql');
        console.log('2. 检查数据库是否存在: CREATE DATABASE chengguo_db;');
        console.log('3. 检查用户权限: GRANT ALL PRIVILEGES ON DATABASE chengguo_db TO postgres;');
        console.log('4. 验证连接参数 (.env 文件): DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD');
        console.log('5. 测试 PostgreSQL 连接: psql -h localhost -U postgres -d chengguo_db');
      }
    }
  } catch (error) {
    console.error('❌ 连接测试出错:', error.message);
    console.log('\n💡 可能的原因:');
    
    if (dbConfig.dialect === 'sqlite') {
      console.log('- SQLite 文件不存在或无法访问');
      console.log('- 文件权限问题');
      console.log('- sequelize 或 sqlite3 模块未安装');
      console.log('- 磁盘空间不足');
    } else {
      console.log('- PostgreSQL 服务未启动');
      console.log('- 数据库不存在');
      console.log('- 用户名/密码错误');
      console.log('- 网络连接问题 (防火墙端口 5432)');
      console.log('- pg 模块未安装: npm install pg');
    }
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