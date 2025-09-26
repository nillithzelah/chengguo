#!/usr/bin/env node

/**
 * 更新广告投放Token脚本
 * 用于手动更新广告投放的access_token和refresh_token
 */

const { testConnection, sequelize } = require('../config/database');
const defineTokenModel = require('../models/Token');

// 初始化Token模型
const Token = defineTokenModel(sequelize);

// 读取命令行参数
const args = process.argv.slice(2);
const newAccessToken = args[0];
const newRefreshToken = args[1];

async function updateAdTokens() {
  console.log('🔄 开始更新广告投放Token...\n');

  try {
    // 1. 验证输入参数
    if (!newAccessToken || !newRefreshToken) {
      console.log('❌ 使用方法:');
      console.log('   node scripts/update-ad-tokens.js <access_token> <refresh_token>');
      console.log('');
      console.log('📝 示例:');
      console.log('   node scripts/update-ad-tokens.js "your_access_token_here" "your_refresh_token_here"');
      console.log('');
      console.log('🔍 如何获取Token:');
      console.log('   1. 登录巨量引擎开放平台: https://open.oceanengine.com/');
      console.log('   2. 进入应用管理，选择你的应用');
      console.log('   3. 在"开发配置"中获取新的access_token和refresh_token');
      console.log('   4. 复制这两个值作为命令行参数');
      process.exit(1);
    }

    // 2. 测试数据库连接
    console.log('📡 测试数据库连接...');
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ 数据库连接失败，请检查配置');
      process.exit(1);
    }
    console.log('✅ 数据库连接成功');

    // 3. 显示当前Token状态
    console.log('\n📊 当前Token状态:');
    const currentAccessToken = await Token.getActiveToken('access_token');
    const currentRefreshToken = await Token.getActiveToken('refresh_token');

    if (currentAccessToken) {
      console.log(`   当前Access Token: ${currentAccessToken.token_value.substring(0, 20)}...`);
      console.log(`   最后刷新: ${currentAccessToken.last_refresh_at ? currentAccessToken.last_refresh_at.toLocaleString('zh-CN') : '未知'}`);
    } else {
      console.log('   当前Access Token: 未设置');
    }

    if (currentRefreshToken) {
      console.log(`   当前Refresh Token: ${currentRefreshToken.token_value.substring(0, 20)}...`);
      console.log(`   最后刷新: ${currentRefreshToken.last_refresh_at ? currentRefreshToken.last_refresh_at.toLocaleString('zh-CN') : '未知'}`);
    } else {
      console.log('   当前Refresh Token: 未设置');
    }

    // 4. 更新Access Token
    console.log('\n🔄 更新Access Token...');
    await Token.updateToken('access_token', newAccessToken, {
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2小时后过期
      appId: '1843500894701081',
      appSecret: '7ad00307b2596397ceeee3560ca8bfc9b3622476'
    });
    console.log('✅ Access Token更新成功');

    // 5. 更新Refresh Token
    console.log('🔄 更新Refresh Token...');
    await Token.updateToken('refresh_token', newRefreshToken, {
      expiresAt: null, // refresh_token通常没有明确的过期时间
      appId: '1843500894701081',
      appSecret: '7ad00307b2596397ceeee3560ca8bfc9b3622476'
    });
    console.log('✅ Refresh Token更新成功');

    // 6. 验证更新结果
    console.log('\n🔍 验证更新结果:');
    const updatedAccessToken = await Token.getActiveToken('access_token');
    const updatedRefreshToken = await Token.getActiveToken('refresh_token');

    if (updatedAccessToken && updatedAccessToken.token_value === newAccessToken) {
      console.log('✅ Access Token验证通过');
    } else {
      console.log('❌ Access Token验证失败');
    }

    if (updatedRefreshToken && updatedRefreshToken.token_value === newRefreshToken) {
      console.log('✅ Refresh Token验证通过');
    } else {
      console.log('❌ Refresh Token验证失败');
    }

    // 7. 显示更新后的完整信息
    console.log('\n📋 更新后的Token信息:');
    console.log(`   Access Token: ${newAccessToken.substring(0, 20)}...`);
    console.log(`   Refresh Token: ${newRefreshToken.substring(0, 20)}...`);
    console.log(`   更新时间: ${new Date().toLocaleString('zh-CN')}`);
    console.log(`   Access Token过期时间: ${new Date(Date.now() + 2 * 60 * 60 * 1000).toLocaleString('zh-CN')}`);

    console.log('\n🎉 Token更新完成！');
    console.log('\n💡 下一步:');
    console.log('   1. 重启服务器以使用新的Token: node server.js');
    console.log('   2. 测试广告预览二维码功能是否正常');
    console.log('   3. 如果Token过期，可以再次运行此脚本更新');

  } catch (error) {
    console.error('❌ Token更新失败:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// 运行脚本
if (require.main === module) {
  console.log('🚀 广告投放Token更新脚本');
  console.log('================================');
  console.log('用于手动更新广告投放的access_token和refresh_token');
  console.log('================================\n');

  updateAdTokens()
    .then(() => {
      console.log('\n✅ 脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ 脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = updateAdTokens;