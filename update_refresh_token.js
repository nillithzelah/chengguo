const { testConnection, sequelize } = require('./config/database');
const Token = require('./models/Token');

async function updateRefreshToken() {
  try {
    console.log('🔄 更新refresh_token脚本');
    console.log('==============================');

    // 测试数据库连接
    console.log('📡 测试数据库连接...');
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ 数据库连接失败');
      process.exit(1);
    }
    console.log('✅ 数据库连接成功');

    // 获取命令行参数
    const newRefreshToken = process.argv[2];

    if (!newRefreshToken) {
      console.error('❌ 请提供新的refresh_token参数');
      console.log('使用方法: node update_refresh_token.js <new_refresh_token>');
      console.log('例如: node update_refresh_token.js abc123def456...');
      process.exit(1);
    }

    console.log('🔑 正在更新refresh_token...');

    // 更新数据库中的refresh_token
    await Token.updateToken('refresh_token', newRefreshToken, {
      appId: process.env.VITE_DOUYIN_APP_ID,
      appSecret: process.env.VITE_DOUYIN_APP_SECRET
    });

    console.log('✅ refresh_token更新成功');
    console.log(`📝 新refresh_token: ${newRefreshToken.substring(0, 10)}...`);

    // 验证更新结果
    const updatedToken = await Token.getActiveToken('refresh_token');
    if (updatedToken && updatedToken.token_value === newRefreshToken) {
      console.log('✅ 数据库验证通过');
    } else {
      console.log('⚠️ 数据库验证失败');
    }

    console.log('🎉 refresh_token更新完成');

  } catch (error) {
    console.error('❌ 更新refresh_token失败:', error.message);
    process.exit(1);
  }
}

// 运行脚本
updateRefreshToken();