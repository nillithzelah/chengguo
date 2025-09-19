#!/usr/bin/env node

const { testConnection } = require('../config/database');

// 先初始化数据库连接，然后再导入模型
async function initializeDatabase() {
  const isConnected = await testConnection();
  if (!isConnected) {
    console.error('❌ 数据库连接失败，请检查配置');
    process.exit(1);
  }

  // 连接成功后导入模型定义函数
  const defineUserModel = require('../models/User');
  const defineGameModel = require('../models/Game');
  const defineUserGameModel = require('../models/UserGame');
  const defineUserDeviceModel = require('../models/UserDevice');

  // 获取sequelize实例
  const { sequelize } = require('../config/database');

  // 初始化模型
  const User = defineUserModel(sequelize);
  const Game = defineGameModel(sequelize);
  const UserGame = defineUserGameModel(sequelize);
  const UserDevice = defineUserDeviceModel(sequelize);

  // 定义模型关联关系
  User.belongsToMany(Game, {
    through: UserGame,
    foreignKey: 'user_id',
    otherKey: 'game_id',
    as: 'games'
  });

  Game.belongsToMany(User, {
    through: UserGame,
    foreignKey: 'game_id',
    otherKey: 'user_id',
    as: 'users'
  });

  UserGame.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
  });

  UserGame.belongsTo(Game, {
    foreignKey: 'game_id',
    as: 'game'
  });

  UserGame.belongsTo(User, {
    foreignKey: 'assigned_by',
    as: 'assignedByUser'
  });

  // UserDevice关联关系
  UserDevice.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
  });

  return { User, Game, UserGame, UserDevice };
}

async function showDatabaseData() {
  console.log('📊 数据库数据查看工具');
  console.log('=' .repeat(50));

  try {
    // 1. 初始化数据库连接和模型
    console.log('📡 初始化数据库连接...');
    const { User, Game, UserGame, UserDevice } = await initializeDatabase();

    // 2. 显示用户表数据
    console.log('\n👥 用户表 (users) 数据:');
    console.log('-'.repeat(30));
    const users = await User.findAll({
      attributes: ['id', 'username', 'name', 'email', 'role', 'is_active', 'last_login_at', 'created_at'],
      order: [['created_at', 'ASC']]
    });

    if (users.length === 0) {
      console.log('📝 用户表为空');
    } else {
      console.table(users.map(user => ({
        ID: user.id,
        用户名: user.username,
        姓名: user.name || '未设置',
        邮箱: user.email || '未设置',
        角色: user.role,
        状态: user.is_active ? '✅ 活跃' : '❌ 禁用',
        最后登录: user.last_login_at ? user.last_login_at.toLocaleString('zh-CN') : '从未登录',
        创建时间: user.created_at.toLocaleString('zh-CN')
      })));
    }

    // 3. 显示游戏表数据
    console.log('\n🎮 游戏表 (games) 数据:');
    console.log('-'.repeat(30));
    const games = await Game.findAll({
      attributes: ['id', 'appid', 'name', 'status', 'validated', 'validated_at', 'advertiser_id', 'promotion_id', 'created_at'],
      order: [['created_at', 'ASC']]
    });

    if (games.length === 0) {
      console.log('📝 游戏表为空');
    } else {
      console.table(games.map(game => ({
        ID: game.id,
        应用ID: game.appid,
        游戏名称: game.name,
        状态: game.status === 'active' ? '✅ 活跃' : game.status === 'inactive' ? '⏸️ 非活跃' : '🚫 暂停',
        已验证: game.validated ? '✅ 是' : '❌ 否',
        验证时间: game.validated_at ? game.validated_at.toLocaleString('zh-CN') : '未验证',
        广告主ID: game.advertiser_id || '未设置',
        广告ID: game.promotion_id || '未设置',
        创建时间: game.created_at.toLocaleString('zh-CN')
      })));
    }

    // 4. 显示用户游戏关联表数据
    console.log('\n🔗 用户游戏关联表 (user_games) 数据:');
    console.log('-'.repeat(40));
    const userGames = await UserGame.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['username', 'name']
        },
        {
          model: Game,
          as: 'game',
          attributes: ['name', 'appid']
        },
        {
          model: User,
          as: 'assignedByUser',
          attributes: ['username']
        }
      ],
      order: [['assigned_at', 'ASC']]
    });

    if (userGames.length === 0) {
      console.log('📝 用户游戏关联表为空');
    } else {
      console.table(userGames.map(ug => ({
        ID: ug.id,
        用户: ug.user ? `${ug.user.name}(${ug.user.username})` : '未知用户',
        游戏: ug.game ? `${ug.game.name}(${ug.game.appid})` : '未知游戏',
        权限角色: ug.role === 'owner' ? '👑 所有者' : ug.role === 'editor' ? '✏️ 编辑者' : '👁️ 查看者',
        分配人: ug.assignedByUser ? ug.assignedByUser.username : '系统',
        分配时间: ug.assigned_at ? ug.assigned_at.toLocaleString('zh-CN') : '未设置',
        创建时间: ug.created_at.toLocaleString('zh-CN')
      })));
    }

    // 4. 显示用户设备表数据
    console.log('\n📱 用户设备表 (user_devices) 数据:');
    console.log('-'.repeat(50));
    const userDevices = await UserDevice.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['username', 'name']
        }
      ],
      order: [['last_login_at', 'DESC']]
    });

    if (userDevices.length === 0) {
      console.log('📝 用户设备表为空');
    } else {
      console.table(userDevices.map(ud => ({
        ID: ud.id,
        用户: ud.user ? `${ud.user.name}(${ud.user.username})` : '未知用户',
        设备ID: ud.device_id,
        设备品牌: ud.device_brand || '未知',
        设备型号: ud.device_model || '未知',
        平台: ud.platform || '未知',
        浏览器: ud.browser_name ? `${ud.browser_name} ${ud.browser_version || ''}`.trim() : '未知',
        操作系统: ud.os_name ? `${ud.os_name} ${ud.os_version || ''}`.trim() : '未知',
        设备类型: ud.device_type || '未知',
        当前设备: ud.is_current_device ? '✅ 是' : '❌ 否',
        最后登录: ud.last_login_at ? ud.last_login_at.toLocaleString('zh-CN') : '未登录',
        登录次数: ud.login_count,
        创建时间: ud.created_at.toLocaleString('zh-CN')
      })));
    }

    // 6. 显示数据统计
    console.log('\n📈 数据统计:');
    console.log('-'.repeat(20));
    console.log(`👥 总用户数: ${users.length}`);
    console.log(`🎮 总游戏数: ${games.length}`);
    console.log(`🔗 用户游戏关联数: ${userGames.length}`);
    console.log(`📱 用户设备记录数: ${userDevices.length}`);

    const activeUsers = users.filter(u => u.is_active).length;
    const activeGames = games.filter(g => g.status === 'active').length;
    const currentDevices = userDevices.filter(d => d.is_current_device).length;

    console.log(`✅ 活跃用户数: ${activeUsers}`);
    console.log(`✅ 活跃游戏数: ${activeGames}`);
    console.log(`📱 当前设备数: ${currentDevices}`);

    // 6. 显示eCPM数据说明
    console.log('\n💡 eCPM数据说明:');
    console.log('-'.repeat(25));
    console.log('📊 eCPM数据不存储在本地数据库中');
    console.log('🔄 采用实时查询策略，直接调用抖音API');
    console.log('⚡ 这样可以确保数据的实时性和准确性');
    console.log('💰 同时减少存储成本和维护复杂度');

    console.log('\n🎉 数据查看完成！');

  } catch (error) {
    console.error('❌ 查看数据库数据失败:', error);
    process.exit(1);
  }
}

// 运行数据查看脚本
showDatabaseData().then(() => {
  console.log('\n✅ 脚本执行完毕');
  process.exit(0);
}).catch((error) => {
  console.error('❌ 脚本执行失败:', error);
  process.exit(1);
});