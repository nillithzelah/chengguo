#!/usr/bin/env node

const { sequelize } = require('../config/database');

async function checkTableStructure() {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    // 检查 users 表结构
    const [userColumns] = await sequelize.query("PRAGMA table_info(users)");
    console.log('\nUsers table columns:');
    userColumns.forEach(col => {
      console.log(`  ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
    });

    // 检查 games 表结构
    const [gameColumns] = await sequelize.query("PRAGMA table_info(games)");
    console.log('\nGames table columns:');
    gameColumns.forEach(col => {
      console.log(`  ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
    });

  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  checkTableStructure();
}