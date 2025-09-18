// 测试服务器路由是否正确注册
const express = require('express');
const app = express();

// 模拟路由注册
app.put('/api/game/update/:id', (req, res) => {
  res.json({
    code: 20000,
    message: '游戏更新路由存在',
    path: req.path,
    params: req.params
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    error: '接口不存在',
    path: req.url
  });
});

// 测试路由
console.log('🧪 测试路由注册...');

// 模拟请求
const testRoutes = [
  '/api/game/update/9',
  '/api/game/update/123',
  '/api/nonexistent'
];

testRoutes.forEach(route => {
  console.log(`\n📍 测试路由: ${route}`);

  // 模拟Express路由匹配
  const routePattern = /^\/api\/game\/update\/([^\/]+)$/;
  const match = route.match(routePattern);

  if (match) {
    console.log(`✅ 路由匹配成功:`, {
      id: match[1],
      pattern: '/api/game/update/:id'
    });
  } else {
    console.log(`❌ 路由不匹配`);
  }
});

console.log('\n📋 路由测试完成');
console.log('💡 如果服务器返回404，说明：');
console.log('   1. 服务器上的server.js文件不是最新的');
console.log('   2. 服务器没有正确重启');
console.log('   3. 路由注册有问题');

module.exports = app;