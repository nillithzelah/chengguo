#!/usr/bin/env node

const { testConnection, sequelize } = require('../config/database');
const defineTokenModel = require('../models/Token');

// 初始化Token模型
const Token = defineTokenModel(sequelize);

async function initializeTokens() {
  console.log('🚀 开始初始化Token表和默认数据...');

  try {
    // 1. 测试数据库连接
    console.log('📡 测试数据库连接...');
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ 数据库连接失败，请检查配置');
      process.exit(1);
    }

    // 2. 同步Token模型到数据库
    console.log('🔄 同步Token模型...');
    await Token.sync({ force: args.includes('--force') });
    console.log('✅ Token表同步完成');

    // 3. 初始化默认token
    console.log('🔑 初始化默认token...');
    await Token.initDefaultTokens();

    // 4. 显示当前token状态
    console.log('📊 当前token状态:');
    const allTokens = await Token.findAll({
      order: [['updated_at', 'DESC']]
    });

    console.table(allTokens.map(token => ({
      ID: token.id,
      类型: token.token_type,
      状态: token.is_active ? '活跃' : '非活跃',
      应用ID: token.app_id || '无',
      最后刷新: token.last_refresh_at ? token.last_refresh_at.toLocaleString('zh-CN') : '从未',
      创建时间: token.created_at.toLocaleString('zh-CN'),
      更新时间: token.updated_at.toLocaleString('zh-CN')
    })));

    // 5. 显示活跃token
    console.log('🎯 当前活跃token:');
    const activeAccessToken = await Token.getActiveToken('access_token');
    const activeRefreshToken = await Token.getActiveToken('refresh_token');

    if (activeAccessToken) {
      console.log(`   Access Token: ${activeAccessToken.token_value}`);
      console.log(`   最后刷新: ${activeAccessToken.last_refresh_at ? activeAccessToken.last_refresh_at.toLocaleString('zh-CN') : '未知'}`);
    }

    if (activeRefreshToken) {
      console.log(`   Refresh Token: ${activeRefreshToken.token_value}`);
      console.log(`   最后刷新: ${activeRefreshToken.last_refresh_at ? activeRefreshToken.last_refresh_at.toLocaleString('zh-CN') : '未知'}`);
    }

    console.log('🎉 Token初始化完成！');
    console.log('');
    console.log('📝 使用说明:');
    console.log('   - Token已存储到数据库，重启服务器不会丢失');
    console.log('   - 自动刷新会更新数据库中的token');
    console.log('   - 可通过API /api/douyin/tokens 查看所有token');
    console.log('');
    console.log('🔧 如需重新初始化，请运行:');
    console.log('   node scripts/init-tokens.js --force');

  } catch (error) {
    console.error('❌ Token初始化失败:', error);
    process.exit(1);
  }
}

// 检查命令行参数
const args = process.argv.slice(2);

// 运行初始化
initializeTokens().then(() => {
  console.log('✅ Token初始化脚本执行完毕');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Token初始化脚本执行失败:', error);
  process.exit(1);
});