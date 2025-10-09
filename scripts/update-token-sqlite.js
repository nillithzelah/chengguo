#!/usr/bin/env node

/**
 * SQLite专用Token更新脚本 - 兼容服务器环境
 * 用法: node scripts/update-token-sqlite.js access_token "新的token值"
 * 或者: node scripts/update-token-sqlite.js refresh_token "新的token值"
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// 数据库连接
const { testConnection, sequelize } = require('../config/database');

async function updateTokenSQLite(tokenType, newTokenValue) {
  try {
    console.log(`🔄 开始更新${tokenType} (SQLite模式)...`);

    if (!newTokenValue || newTokenValue.trim() === '') {
      console.error('❌ 错误: 请提供有效的Token值');
      console.log('用法: node scripts/update-token-sqlite.js access_token "新的token值"');
      console.log('或者: node scripts/update-token-sqlite.js refresh_token "新的token值"');
      process.exit(1);
    }

    // 测试数据库连接
    console.log('📡 测试数据库连接...');
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ 数据库连接失败');
      process.exit(1);
    }

    // 检查表结构
    console.log('🔍 检查数据库表结构...');
    const tableInfo = await sequelize.query(`
      PRAGMA table_info(tokens)
    `, { type: sequelize.QueryTypes.SELECT });

    const columns = Array.isArray(tableInfo) ? tableInfo.map(col => col.name) : [];
    console.log('表结构列:', columns);
    console.log('原始表信息:', tableInfo);

    // 构建兼容的SQL
    console.log('📝 执行数据库更新...');

    // 先将其他同类型的token设为非活跃
    await sequelize.query(`
      UPDATE tokens
      SET is_active = 0
      WHERE token_type = ? AND is_active = 1
    `, {
      replacements: [tokenType],
      type: sequelize.QueryTypes.UPDATE
    });

    // 检查是否有updated_at列
    const hasUpdatedAt = columns.includes('updated_at');

    // 构建插入语句
    let insertSQL;
    let replacements;

    if (hasUpdatedAt) {
      // 有updated_at列的完整版本
      insertSQL = `
        INSERT INTO tokens (
          token_type, token_value, is_active, last_refresh_at,
          app_id, app_secret, description, created_at, updated_at
        ) VALUES (
          ?, ?, 1, datetime('now'),
          '1843500894701081', '7ad00307b2596397ceeee3560ca8bfc9b3622476',
          ?, datetime('now'), datetime('now')
        )
      `;
      replacements = [
        tokenType,
        newTokenValue,
        `${tokenType} for Douyin API`
      ];
    } else {
      // 兼容版本，缺少某些列
      console.log('⚠️ 检测到表结构不完整，使用兼容模式');

      // 检查其他可能缺失的列
      const hasLastRefreshAt = columns.includes('last_refresh_at');
      const hasAppId = columns.includes('app_id');
      const hasAppSecret = columns.includes('app_secret');
      const hasDescription = columns.includes('description');
      const hasCreatedAt = columns.includes('created_at');

      // 构建基本的插入语句
      let columnsList = ['token_type', 'token_value', 'is_active'];
      let valuesList = ['?', '?', '1'];
      replacements = [tokenType, newTokenValue];

      if (hasLastRefreshAt) {
        columnsList.push('last_refresh_at');
        valuesList.push('datetime(\'now\')');
      }

      if (hasAppId) {
        columnsList.push('app_id');
        valuesList.push('?');
        replacements.push('1843500894701081');
      }

      if (hasAppSecret) {
        columnsList.push('app_secret');
        valuesList.push('?');
        replacements.push('7ad00307b2596397ceeee3560ca8bfc9b3622476');
      }

      if (hasDescription) {
        columnsList.push('description');
        valuesList.push('?');
        replacements.push(`${tokenType} for Douyin API`);
      }

      if (hasCreatedAt) {
        columnsList.push('created_at');
        valuesList.push('datetime(\'now\')');
      }

      insertSQL = `
        INSERT INTO tokens (${columnsList.join(', ')})
        VALUES (${valuesList.join(', ')})
      `;
    }

    console.log('执行SQL:', insertSQL);
    console.log('参数:', replacements);

    await sequelize.query(insertSQL, {
      replacements: replacements,
      type: sequelize.QueryTypes.INSERT
    });

    console.log(`✅ ${tokenType}更新成功!`);
    console.log(`🔑 新Token: ${newTokenValue}`);

    // 验证更新结果
    const [results] = await sequelize.query(`
      SELECT token_value FROM tokens
      WHERE token_type = ? AND is_active = 1
      ORDER BY id DESC LIMIT 1
    `, {
      replacements: [tokenType],
      type: sequelize.QueryTypes.SELECT
    });

    if (results && results.token_value === newTokenValue) {
      console.log('✅ Token验证成功，数据库已更新');
    } else {
      console.error('❌ Token验证失败，请检查数据库');
      process.exit(1);
    }

    console.log('🎉 Token更新完成！');

  } catch (error) {
    console.error(`❌ 更新${tokenType}失败:`, error.message);
    console.error('完整错误:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// 获取命令行参数
const [,, tokenType, newToken] = process.argv;

if (!tokenType || !newToken) {
  console.error('❌ 错误: 参数不足');
  console.log('用法: node scripts/update-token-sqlite.js access_token "新的token值"');
  console.log('或者: node scripts/update-token-sqlite.js refresh_token "新的token值"');
  console.log('');
  console.log('示例:');
  console.log('  node scripts/update-token-sqlite.js access_token "abc123def456..."');
  console.log('  node scripts/update-token-sqlite.js refresh_token "def456ghi789..."');
  process.exit(1);
}

if (!['access_token', 'refresh_token'].includes(tokenType)) {
  console.error('❌ 错误: tokenType必须是 access_token 或 refresh_token');
  process.exit(1);
}

updateTokenSQLite(tokenType, newToken);