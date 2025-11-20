#!/usr/bin/env node

/**
 * 查询数据库中的Token信息 - 显示完整值
 * 用法: node scripts/query-db.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// 数据库连接
const { testConnection, sequelize } = require('../../config/database');

async function queryTokens() {
  try {
    console.log('🔍 查询数据库中的Token信息...\n');

    // 测试数据库连接
    console.log('📡 测试数据库连接...');
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ 数据库连接失败');
      process.exit(1);
    }
    console.log('✅ 数据库连接成功\n');

    // 查询所有活跃的tokens
    const tokens = await sequelize.query(`
      SELECT
        id,
        token_type,
        token_value,
        expires_at,
        last_refresh_at,
        is_active,
        app_id,
        app_secret,
        description,
        created_at,
        updated_at,
        app_type
      FROM tokens
      WHERE is_active = 1
      ORDER BY token_type, updated_at DESC
    `, { type: sequelize.QueryTypes.SELECT });

    if (tokens.length === 0) {
      console.log('⚠️ 未找到任何活跃的Token');
      return;
    }

    console.log('📋 活跃Token列表:\n');

    tokens.forEach((token, index) => {
      console.log(`🔑 Token ${index + 1}:`);
      console.log(`   类型: ${token.token_type}`);
      console.log(`   应用类型: ${token.app_type || '未指定'}`);
      console.log(`   完整Token值: ${token.token_value}`);
      console.log(`   过期时间: ${token.expires_at || '无过期时间'}`);
      console.log(`   最后刷新: ${token.last_refresh_at || '未刷新'}`);
      console.log(`   应用ID: ${token.app_id || '未设置'}`);
      console.log(`   应用密钥: ${token.app_secret || '未设置'}`);
      console.log(`   描述: ${token.description || '无描述'}`);
      console.log(`   创建时间: ${token.created_at}`);
      console.log(`   更新时间: ${token.updated_at}`);
      console.log('');
    });

    // 特别显示Refresh Token的完整值
    const refreshToken = tokens.find(t => t.token_type === 'refresh_token');
    if (refreshToken) {
      console.log('🎯 Refresh Token 完整信息:');
      console.log('='.repeat(50));
      console.log(`完整值: ${refreshToken.token_value}`);
      console.log(`长度: ${refreshToken.token_value.length} 字符`);
      console.log('='.repeat(50));
      console.log('');
    }

    // 统计信息
    const accessTokens = tokens.filter(t => t.token_type === 'access_token');
    const refreshTokens = tokens.filter(t => t.token_type === 'refresh_token');

    console.log('📊 统计信息:');
    console.log(`   Access Token数量: ${accessTokens.length}`);
    console.log(`   Refresh Token数量: ${refreshTokens.length}`);
    console.log(`   总活跃Token数: ${tokens.length}`);

  } catch (error) {
    console.error(`❌ 查询Token失败:`, error.message);
    console.error('完整错误:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// 执行查询
queryTokens();