#!/usr/bin/env node

/**
 * 直接更新Token脚本 - 绕过模型，直接操作数据库
 * 用法: node scripts/update-token-direct.js access_token "新的token值"
 * 或者: node scripts/update-token-direct.js refresh_token "新的token值"
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// 数据库连接
const { testConnection, sequelize } = require('../config/database');

async function updateTokenDirect(tokenType, newTokenValue) {
  try {
    console.log(`🔄 开始直接更新${tokenType}...`);

    if (!newTokenValue || newTokenValue.trim() === '') {
      console.error('❌ 错误: 请提供有效的Token值');
      console.log('用法: node scripts/update-token-direct.js access_token "新的token值"');
      console.log('或者: node scripts/update-token-direct.js refresh_token "新的token值"');
      process.exit(1);
    }

    // 测试数据库连接
    console.log('📡 测试数据库连接...');
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ 数据库连接失败');
      process.exit(1);
    }

    // 直接执行SQL更新
    console.log('📝 执行数据库更新...');

    // 先将其他同类型的token设为非活跃
    await sequelize.query(`
      UPDATE tokens
      SET is_active = false, updated_at = datetime('now')
      WHERE token_type = ? AND is_active = true
    `, {
      replacements: [tokenType],
      type: sequelize.QueryTypes.UPDATE
    });

    // 插入新的活跃token
    await sequelize.query(`
      INSERT INTO tokens (
        token_type, token_value, is_active, last_refresh_at,
        app_id, app_secret, description, created_at, updated_at
      ) VALUES (
        ?, ?, true, datetime('now'),
        '1843500894701081', '7ad00307b2596397ceeee3560ca8bfc9b3622476',
        ?, datetime('now'), datetime('now')
      )
    `, {
      replacements: [
        tokenType,
        newTokenValue,
        `${tokenType} for Douyin API`
      ],
      type: sequelize.QueryTypes.INSERT
    });

    console.log(`✅ ${tokenType}更新成功!`);
    console.log(`🔑 新Token: ${newTokenValue.substring(0, 20)}...`);

    // 验证更新结果
    const [results] = await sequelize.query(`
      SELECT token_value FROM tokens
      WHERE token_type = ? AND is_active = true
      ORDER BY updated_at DESC LIMIT 1
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
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// 获取命令行参数
const [,, tokenType, newToken] = process.argv;

if (!tokenType || !newToken) {
  console.error('❌ 错误: 参数不足');
  console.log('用法: node scripts/update-token-direct.js access_token "新的token值"');
  console.log('或者: node scripts/update-token-direct.js refresh_token "新的token值"');
  console.log('');
  console.log('示例:');
  console.log('  node scripts/update-token-direct.js access_token "abc123def456..."');
  console.log('  node scripts/update-token-direct.js refresh_token "def456ghi789..."');
  process.exit(1);
}

if (!['access_token', 'refresh_token'].includes(tokenType)) {
  console.error('❌ 错误: tokenType必须是 access_token 或 refresh_token');
  process.exit(1);
}

updateTokenDirect(tokenType, newToken);