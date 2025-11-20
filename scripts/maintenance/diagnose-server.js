// 服务器诊断脚本
const express = require('express');
const { testConnection, sequelize } = require('../config/database');

async function diagnoseServer() {
  console.log('🔍 服务器诊断工具');
  console.log('================================');

  try {
    // 1. 检查数据库连接
    console.log('\n📡 检查数据库连接...');
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ 数据库连接失败');
      console.log('💡 请检查:');
      console.log('   - 数据库服务是否启动');
      console.log('   - 环境变量配置是否正确');
      console.log('   - 数据库文件是否存在');
      return;
    }
    console.log('✅ 数据库连接正常');

    // 2. 检查模型加载
    console.log('\n📋 检查模型加载...');
    try {
      const defineUserModel = require('../models/User');
      const defineGameModel = require('../models/Game');
      const defineUserGameModel = require('../models/UserGame');
      const defineUserDeviceModel = require('../models/UserDevice');

      const User = defineUserModel(sequelize);
      const Game = defineGameModel(sequelize);
      const UserGame = defineUserGameModel(sequelize);
      const UserDevice = defineUserDeviceModel(sequelize);

      console.log('✅ 所有模型加载成功');

      // 检查模型字段
      console.log('\n📊 检查Game模型字段...');
      const gameAttributes = Object.keys(Game.rawAttributes);
      console.log('Game模型字段:', gameAttributes.join(', '));

      const hasAdvertiserId = gameAttributes.includes('advertiser_id');
      const hasPromotionId = gameAttributes.includes('promotion_id');
      console.log(`📋 广告字段:`);
      console.log(`   - advertiser_id: ${hasAdvertiserId ? '✅' : '❌'}`);
      console.log(`   - promotion_id: ${hasPromotionId ? '✅' : '❌'}`);

    } catch (modelError) {
      console.error('❌ 模型加载失败:', modelError.message);
      console.log('💡 请检查:');
      console.log('   - models目录是否存在');
      console.log('   - 模型文件语法是否正确');
      return;
    }

    // 3. 检查表结构
    console.log('\n🗄️ 检查数据库表结构...');
    try {
      const [tables] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table'");
      const tableNames = tables.map(t => t.name);
      console.log('数据库中的表:', tableNames.join(', '));

      if (!tableNames.includes('games')) {
        console.error('❌ games表不存在');
        console.log('💡 请运行: node scripts/init-db.js');
        return;
      }

      // 检查games表结构
      const [columns] = await sequelize.query("PRAGMA table_info(games)");
      console.log('Games表字段:');
      columns.forEach(col => {
        console.log(`   - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''}`);
      });

      const dbHasAdvertiserId = columns.some(col => col.name === 'advertiser_id');
      const dbHasPromotionId = columns.some(col => col.name === 'promotion_id');
      console.log(`📊 数据库广告字段:`);
      console.log(`   - advertiser_id: ${dbHasAdvertiserId ? '✅' : '❌'}`);
      console.log(`   - promotion_id: ${dbHasPromotionId ? '✅' : '❌'}`);

    } catch (dbError) {
      console.error('❌ 数据库查询失败:', dbError.message);
      return;
    }

    // 4. 检查路由定义
    console.log('\n🔗 检查路由定义...');
    try {
      const serverContent = require('fs').readFileSync('./server.js', 'utf8');

      const routes = [
        "app.post('/api/user/login'",
        "app.put('/api/game/update/:id'",
        "app.get('/api/game/list'"
      ];

      routes.forEach(route => {
        if (serverContent.includes(route)) {
          console.log(`✅ ${route}`);
        } else {
          console.log(`❌ ${route} - 未找到`);
        }
      });

    } catch (fileError) {
      console.error('❌ 读取server.js失败:', fileError.message);
    }

    // 5. 模拟登录测试
    console.log('\n🔐 模拟登录测试...');
    try {
      const adminUser = await sequelize.models.User.findOne({ where: { username: 'admin' } });
      if (adminUser) {
        console.log('✅ 管理员用户存在');
        console.log(`   用户名: ${adminUser.username}`);
        console.log(`   角色: ${adminUser.role}`);
        console.log(`   状态: ${adminUser.is_active ? '活跃' : '禁用'}`);
      } else {
        console.log('❌ 管理员用户不存在');
        console.log('💡 请运行: node scripts/init-db.js');
      }
    } catch (loginError) {
      console.error('❌ 登录测试失败:', loginError.message);
    }

  } catch (error) {
    console.error('❌ 诊断过程出错:', error.message);
  } finally {
    await sequelize.close();
  }

  console.log('\n📋 诊断完成');
  console.log('\n💡 如果仍有问题，请检查:');
  console.log('   1. 服务器日志: pm2 logs');
  console.log('   2. 数据库文件权限');
  console.log('   3. Node.js版本兼容性');
  console.log('   4. 环境变量配置');
}

// 如果直接运行此脚本
if (require.main === module) {
  diagnoseServer().catch(console.error);
}

module.exports = diagnoseServer;