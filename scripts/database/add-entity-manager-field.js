#!/usr/bin/env node

const { sequelize } = require('../../config/database');

async function addEntityManagerField() {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    // 检查 entities 表是否已经存在 manager 字段
    const [columns] = await sequelize.query("PRAGMA table_info(entities)");
    const hasManager = columns.some(col => col.name === 'manager');

    if (hasManager) {
      console.log('ℹ️ manager 字段已存在，跳过添加');
      return;
    }

    console.log('📝 添加 manager 字段到 entities 表...');

    // 为 SQLite 添加新字段
    await sequelize.query(`
      ALTER TABLE entities
      ADD COLUMN manager VARCHAR(100)
    `);

    console.log('✅ 成功添加 manager 字段');

    // 验证字段是否添加成功
    const [newColumns] = await sequelize.query("PRAGMA table_info(entities)");
    const managerColumn = newColumns.find(col => col.name === 'manager');

    if (managerColumn) {
      console.log('✅ 字段验证成功:', {
        name: managerColumn.name,
        type: managerColumn.type,
        notnull: managerColumn.notnull,
        dflt_value: managerColumn.dflt_value
      });
    } else {
      console.log('❌ 字段验证失败');
    }

  } catch (error) {
    console.error('❌ 添加字段失败:', error.message);
    console.error('详细错误:', error);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  addEntityManagerField();
}