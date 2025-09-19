#!/usr/bin/env node

// 检查服务器数据库表结构的脚本
const { sequelize } = require('../config/database');

async function checkServerTables() {
  try {
    console.log('🔍 检查服务器数据库表结构...');

    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    // 获取所有表名
    const [tables] = await sequelize.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('📋 数据库中的表:');
    if (tables.length === 0) {
      console.log('   (无表)');
    } else {
      tables.forEach((table, index) => {
        console.log(`   ${index + 1}. ${table.table_name}`);
      });
    }

    // 如果有games表，显示其结构
    const hasGames = tables.some(t => t.table_name === 'games');
    if (hasGames) {
      console.log('\n📊 games表结构:');
      const [columns] = await sequelize.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'games'
        ORDER BY ordinal_position
      `);

      columns.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        console.log(`   - ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`);
      });
    } else {
      console.log('\n⚠️ 没有找到games表');
    }

  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  checkServerTables();
}

module.exports = checkServerTables;