#!/usr/bin/env node

const { sequelize } = require('../../config/database');

async function addEntityLimitedStatus() {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    // 检查 entities 表是否已经存在 is_limited_status 字段
    const [columns] = await sequelize.query("PRAGMA table_info(entities)");
    const hasLimitedStatus = columns.some(col => col.name === 'is_limited_status');

    if (hasLimitedStatus) {
      console.log('ℹ️ is_limited_status 字段已存在，跳过添加');
      return;
    }

    console.log('📝 添加 is_limited_status 字段到 entities 表...');

    // 为 SQLite 添加新字段
    await sequelize.query(`
      ALTER TABLE entities
      ADD COLUMN is_limited_status BOOLEAN NOT NULL DEFAULT 0
    `);

    console.log('✅ 成功添加 is_limited_status 字段');

    // 验证字段是否添加成功
    const [newColumns] = await sequelize.query("PRAGMA table_info(entities)");
    const limitedStatusColumn = newColumns.find(col => col.name === 'is_limited_status');

    if (limitedStatusColumn) {
      console.log('✅ 字段验证成功:', {
        name: limitedStatusColumn.name,
        type: limitedStatusColumn.type,
        notnull: limitedStatusColumn.notnull,
        dflt_value: limitedStatusColumn.dflt_value
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
  addEntityLimitedStatus();
}