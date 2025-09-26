#!/usr/bin/env node

const axios = require('axios');

// 从命令行参数获取新的token
const newAccessToken = process.argv[2];
const newRefreshToken = process.argv[3];

if (!newAccessToken || !newRefreshToken) {
  console.log('❌ 使用方法: node scripts/refresh-ocean-token.js <access_token> <refresh_token>');
  console.log('💡 示例: node scripts/refresh-ocean-token.js "your_access_token" "your_refresh_token"');
  console.log('');
  console.log('📋 如何获取新token:');
  console.log('1. 登录巨量引擎开放平台: https://open.oceanengine.com/');
  console.log('2. 进入应用管理，选择你的应用');
  console.log('3. 在"开发配置"中获取新的access_token和refresh_token');
  process.exit(1);
}

console.log('🔄 更新巨量引擎广告投放token...');
console.log('📝 新的access_token:', newAccessToken.substring(0, 20) + '...');
console.log('📝 新的refresh_token:', newRefreshToken.substring(0, 20) + '...');

// 这里需要更新server.js中的token变量
// 由于server.js在运行中，我们需要重启服务器才能生效

console.log('');
console.log('✅ Token已准备好更新');
console.log('📋 请手动更新server.js中的以下变量:');
console.log('');
console.log(`let currentAccessToken = '${newAccessToken}';`);
console.log(`let currentRefreshToken = '${newRefreshToken}';`);
console.log('');
console.log('🔄 更新后请重启服务器: node server.js');
console.log('');
console.log('🎉 完成！');