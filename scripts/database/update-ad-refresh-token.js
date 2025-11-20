#!/usr/bin/env node

/**
 * 更新广告投放Refresh Token脚本
 * 用法: node scripts/update-ad-refresh-token.js "新的refresh_token"
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// 数据库和模型导入
const { testConnection } = require('../../config/database');
const defineTokenModel = require('../../models/Token');

async function updateAdRefreshToken(newRefreshToken) {
  try {
    console.log('🔄 开始更新广告投放Refresh Token...');

    if (!newRefreshToken || newRefreshToken.trim() === '') {
      console.error('❌ 错误: 请提供有效的Refresh Token');
      console.log('用法: node scripts/update-ad-refresh-token.js "新的refresh_token"');
      process.exit(1);
    }

    // 测试数据库连接
    console.log('📡 测试数据库连接...');
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ 数据库连接失败');
      process.exit(1);
    }

    // 初始化Token模型
    const sequelize = require('../../config/database').sequelize;
    const Token = defineTokenModel(sequelize);

    // 更新Refresh Token
    console.log('📝 更新Refresh Token...');
    await Token.updateToken('refresh_token', newRefreshToken, {
      expiresAt: null, // refresh_token通常没有明确的过期时间
      appId: '1843500894701081',
      appSecret: '7ad00307b2596397ceeee3560ca8bfc9b3622476'
    });

    console.log('✅ 广告投放Refresh Token更新成功!');
    console.log(`🔑 新Token: ${newRefreshToken}`);

    // 验证更新结果
    const updatedToken = await Token.getActiveToken('refresh_token');
    if (updatedToken && updatedToken.token_value === newRefreshToken) {
      console.log('✅ Token验证成功，数据库已更新');
    } else {
      console.error('❌ Token验证失败，请检查数据库');
      process.exit(1);
    }

    console.log('🎉 Refresh Token更新完成！');
    console.log('💡 提示: 服务器会自动重新加载新的Token，无需重启');

  } catch (error) {
    console.error('❌ 更新Refresh Token失败:', error.message);
    process.exit(1);
  }
}

// 获取命令行参数
const newToken = process.argv[2];

if (!newToken) {
  console.error('❌ 错误: 缺少Refresh Token参数');
  console.log('用法: node scripts/update-ad-refresh-token.js "新的refresh_token"');
  console.log('示例: node scripts/update-ad-refresh-token.js "def456ghi789..."');
  process.exit(1);
}

updateAdRefreshToken(newToken);