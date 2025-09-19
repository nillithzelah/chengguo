#!/usr/bin/env node

const { sequelize } = require('../config/database');

async function checkTableStructure() {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    const [columns] = await sequelize.query("PRAGMA table_info(games)");
    console.log('Games table columns:');
    columns.forEach(col => {
      console.log(`  ${col.name}: ${col.type}`);
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