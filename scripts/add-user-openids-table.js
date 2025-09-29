#!/usr/bin/env node

// 用户OpenID绑定表创建脚本（支持 SQLite 和 PostgreSQL）
const { sequelize, dbConfig } = require('../config/database');

async function createUserOpenIdsTable() {
  try {
    console.log(`🏗️ 创建user_openids表 (${dbConfig.dialect} 数据库)...`);

    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    // 检查表是否已存在
    const tableExists = await sequelize.getQueryInterface().showAllTables();
    const tableName = 'user_openids';

    if (tableExists.includes(tableName)) {
      console.log('ℹ️ user_openids表已存在，检查表结构...');

      // 检查表结构
      const tableDescription = await sequelize.getQueryInterface().describeTable(tableName);
      const requiredColumns = ['id', 'user_id', 'open_id', 'bound_at', 'created_at', 'updated_at'];

      const missingColumns = requiredColumns.filter(col => !tableDescription[col]);

      if (missingColumns.length > 0) {
        console.log('⚠️ 表结构不完整，缺少字段:', missingColumns.join(', '));
        console.log('🔄 重新创建表...');

        // 删除现有表
        await sequelize.getQueryInterface().dropTable(tableName);
        console.log('✅ 已删除旧表');
      } else {
        console.log('✅ 表结构完整，无需修改');
        return;
      }
    }

    // 创建表
    console.log('🔄 创建user_openids表...');

    if (dbConfig.dialect === 'sqlite') {
      // SQLite 创建表语句
      await sequelize.query(`
        CREATE TABLE user_openids (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          open_id VARCHAR(100) NOT NULL,
          bound_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE(user_id, open_id)
        )
      `);

      // 创建索引
      await sequelize.query(`CREATE INDEX idx_open_id ON user_openids(open_id)`);
      await sequelize.query(`CREATE INDEX idx_user_id ON user_openids(user_id)`);

    } else if (dbConfig.dialect === 'postgres') {
      // PostgreSQL 创建表语句
      await sequelize.query(`
        CREATE TABLE user_openids (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          open_id VARCHAR(100) NOT NULL,
          bound_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, open_id)
        )
      `);

      // 创建索引
      await sequelize.query(`CREATE INDEX idx_open_id ON user_openids(open_id)`);
      await sequelize.query(`CREATE INDEX idx_user_id ON user_openids(user_id)`);

    } else {
      throw new Error(`不支持的数据库类型: ${dbConfig.dialect}`);
    }

    console.log('✅ user_openids表创建成功');

    // 验证表创建
    const verifyTable = await sequelize.getQueryInterface().showAllTables();
    if (verifyTable.includes(tableName)) {
      console.log('🎉 user_openids表创建完成！');

      // 显示表结构
      const tableInfo = await sequelize.getQueryInterface().describeTable(tableName);
      console.log('📊 表结构:');
      Object.keys(tableInfo).forEach(col => {
        console.log(`  ${col}: ${tableInfo[col].type}`);
      });
    } else {
      throw new Error('表创建失败');
    }

  } catch (error) {
    console.error('❌ 创建user_openids表失败:', error.message);

    if (error.name === 'SequelizeDatabaseError') {
      console.log('💡 可能需要数据库管理员权限');
      console.log('💡 或者表已存在但结构不同，请手动检查');
    }

    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  createUserOpenIdsTable();
}

module.exports = createUserOpenIdsTable;