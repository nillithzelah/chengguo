// 服务器部署检查脚本
const fs = require('fs');
const path = require('path');

console.log('🔍 服务器部署检查工具');
console.log('================================');

// 检查关键文件是否存在
const criticalFiles = [
  'server.js',
  'package.json',
  'config/database.js',
  'models/Game.js',
  'models/User.js',
  'scripts/add-ad-fields-to-server.js'
];

console.log('\n📁 检查关键文件:');
criticalFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  const exists = fs.existsSync(filePath);

  if (exists) {
    const stats = fs.statSync(filePath);
    const size = (stats.size / 1024).toFixed(1) + 'KB';
    const mtime = stats.mtime.toLocaleString('zh-CN');

    console.log(`✅ ${file} (${size}, 修改时间: ${mtime})`);
  } else {
    console.log(`❌ ${file} - 文件不存在`);
  }
});

// 检查server.js中的关键路由
console.log('\n🔗 检查API路由:');
const serverPath = path.join(__dirname, '..', 'server.js');
if (fs.existsSync(serverPath)) {
  const serverContent = fs.readFileSync(serverPath, 'utf8');

  const routesToCheck = [
    "app.put('/api/game/update/:id'",
    "app.get('/api/game/list'",
    "app.post('/api/game/create'",
    "app.delete('/api/game/delete/:id'"
  ];

  routesToCheck.forEach(route => {
    if (serverContent.includes(route)) {
      console.log(`✅ ${route}`);
    } else {
      console.log(`❌ ${route} - 路由未找到`);
    }
  });

  // 检查游戏更新路由的完整实现
  const updateRoutePattern = /app\.put\('\/api\/game\/update\/:id'/;
  const hasUpdateRoute = updateRoutePattern.test(serverContent);

  if (hasUpdateRoute) {
    console.log('✅ 游戏更新路由存在');

    // 检查是否包含advertiser_id和promotion_id字段
    const hasAdvertiserId = serverContent.includes('advertiser_id');
    const hasPromotionId = serverContent.includes('promotion_id');

    console.log(`📊 广告字段支持:`);
    console.log(`   - advertiser_id: ${hasAdvertiserId ? '✅' : '❌'}`);
    console.log(`   - promotion_id: ${hasPromotionId ? '✅' : '❌'}`);
  } else {
    console.log('❌ 游戏更新路由不存在');
  }

} else {
  console.log('❌ server.js文件不存在');
}

// 检查数据库迁移脚本
console.log('\n🗄️ 检查数据库迁移脚本:');
const migrationPath = path.join(__dirname, 'add-ad-fields-to-server.js');
if (fs.existsSync(migrationPath)) {
  console.log('✅ add-ad-fields-to-server.js 存在');

  const migrationContent = fs.readFileSync(migrationPath, 'utf8');
  const hasAdvertiserId = migrationContent.includes('advertiser_id');
  const hasPromotionId = migrationContent.includes('promotion_id');

  console.log(`📊 迁移脚本支持:`);
  console.log(`   - advertiser_id: ${hasAdvertiserId ? '✅' : '❌'}`);
  console.log(`   - promotion_id: ${hasPromotionId ? '✅' : '❌'}`);
} else {
  console.log('❌ add-ad-fields-to-server.js 不存在');
}

console.log('\n📋 部署检查完成');
console.log('\n💡 如果服务器返回404，请确保：');
console.log('   1. 服务器上的文件已更新');
console.log('   2. 服务器已正确重启');
console.log('   3. 数据库迁移脚本已运行');
console.log('   4. 检查服务器日志确认无错误');

console.log('\n🚀 部署命令:');
console.log('   # 1. 上传文件到服务器');
console.log('   scp -r dist/* user@server:/var/www/html/');
console.log('   scp scripts/add-ad-fields-to-server.js user@server:/app/scripts/');
console.log('');
console.log('   # 2. 在服务器上运行数据库迁移');
console.log('   cd /app');
console.log('   node scripts/add-ad-fields-to-server.js');
console.log('');
console.log('   # 3. 重启服务');
console.log('   pm2 restart all');
console.log('   sudo systemctl restart nginx');