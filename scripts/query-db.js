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

  // 获取sequelize实例
  const { sequelize } = require('../config/database');

  // 初始化模型
  const User = defineUserModel(sequelize);
  const Game = defineGameModel(sequelize);
  const UserGame = defineUserGameModel(sequelize);

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

  return { User, Game, UserGame };
}

// 查询所有用户
async function queryUsers(User) {
  console.log('👥 查询所有用户:');
  console.log('='.repeat(50));

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
}

// 查询特定用户
async function queryUserById(User, userId) {
  console.log(`👤 查询用户 ID: ${userId}`);
  console.log('='.repeat(30));

  const user = await User.findByPk(userId, {
    attributes: ['id', 'username', 'name', 'email', 'role', 'is_active', 'last_login_at', 'created_at', 'updated_at']
  });

  if (!user) {
    console.log('❌ 用户不存在');
  } else {
    console.log(`ID: ${user.id}`);
    console.log(`用户名: ${user.username}`);
    console.log(`姓名: ${user.name || '未设置'}`);
    console.log(`邮箱: ${user.email || '未设置'}`);
    console.log(`角色: ${user.role}`);
    console.log(`状态: ${user.is_active ? '✅ 活跃' : '❌ 禁用'}`);
    console.log(`最后登录: ${user.last_login_at ? user.last_login_at.toLocaleString('zh-CN') : '从未登录'}`);
    console.log(`创建时间: ${user.created_at.toLocaleString('zh-CN')}`);
    console.log(`更新时间: ${user.updated_at.toLocaleString('zh-CN')}`);
  }
}

// 查询所有游戏
async function queryGames(Game) {
  console.log('🎮 查询所有游戏:');
  console.log('='.repeat(50));

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
}

// 查询特定游戏
async function queryGameByAppId(Game, appid) {
  console.log(`🎮 查询游戏 应用ID: ${appid}`);
  console.log('='.repeat(30));

  const game = await Game.findOne({
    where: { appid },
    attributes: ['id', 'appid', 'name', 'app_secret', 'description', 'status', 'validated', 'validated_at', 'created_at', 'updated_at']
  });

  if (!game) {
    console.log('❌ 游戏不存在');
  } else {
    console.log(`ID: ${game.id}`);
    console.log(`应用ID: ${game.appid}`);
    console.log(`游戏名称: ${game.name}`);
    console.log(`应用密钥: ${game.app_secret}`);
    console.log(`描述: ${game.description || '无'}`);
    console.log(`状态: ${game.status === 'active' ? '✅ 活跃' : game.status === 'inactive' ? '⏸️ 非活跃' : '🚫 暂停'}`);
    console.log(`已验证: ${game.validated ? '✅ 是' : '❌ 否'}`);
    console.log(`验证时间: ${game.validated_at ? game.validated_at.toLocaleString('zh-CN') : '未验证'}`);
    console.log(`创建时间: ${game.created_at.toLocaleString('zh-CN')}`);
    console.log(`更新时间: ${game.updated_at.toLocaleString('zh-CN')}`);
  }
}

// 查询用户游戏关联
async function queryUserGames(UserGame) {
  console.log('🔗 查询用户游戏关联:');
  console.log('='.repeat(50));

  const userGames = await UserGame.findAll({
    include: [
      {
        model: require('../models/User')(require('../config/database').sequelize),
        as: 'user',
        attributes: ['username', 'name']
      },
      {
        model: require('../models/Game')(require('../config/database').sequelize),
        as: 'game',
        attributes: ['name', 'appid']
      },
      {
        model: require('../models/User')(require('../config/database').sequelize),
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
}

// 显示统计信息
async function showStats(User, Game, UserGame) {
  console.log('📈 数据库统计信息:');
  console.log('='.repeat(30));

  const [userCount, gameCount, userGameCount] = await Promise.all([
    User.count(),
    Game.count(),
    UserGame.count()
  ]);

  const [activeUsers, activeGames] = await Promise.all([
    User.count({ where: { is_active: true } }),
    Game.count({ where: { status: 'active' } })
  ]);

  console.log(`👥 总用户数: ${userCount}`);
  console.log(`✅ 活跃用户数: ${activeUsers}`);
  console.log(`🎮 总游戏数: ${gameCount}`);
  console.log(`✅ 活跃游戏数: ${activeGames}`);
  console.log(`🔗 用户游戏关联数: ${userGameCount}`);
}

// 删除游戏
async function deleteGame(Game, UserGame, identifier) {
  console.log(`🗑️ 删除游戏: ${identifier}`);
  console.log('='.repeat(30));

  // 尝试通过ID或应用ID查找游戏
  let game;
  if (!isNaN(identifier)) {
    // 如果是数字，按ID查找
    game = await Game.findByPk(parseInt(identifier));
  } else {
    // 否则按应用ID查找
    game = await Game.findOne({ where: { appid: identifier } });
  }

  if (!game) {
    console.log('❌ 游戏不存在');
    return;
  }

  console.log(`找到游戏: ${game.name} (${game.appid})`);
  console.log('⚠️ 警告: 此操作将同时删除相关的用户游戏关联记录！');

  // 确认删除（在命令行中无法真正交互，这里直接执行）
  try {
    // 先删除相关的user_games记录
    const deletedAssociations = await UserGame.destroy({
      where: { game_id: game.id }
    });

    // 然后删除游戏
    await game.destroy();

    console.log(`✅ 游戏删除成功: ${game.name}`);
    console.log(`🗑️ 删除了 ${deletedAssociations} 条用户游戏关联记录`);

  } catch (error) {
    console.error('❌ 删除失败:', error.message);
  }
}

// 显示帮助信息
function showHelp() {
  console.log('🔍 数据库查询工具使用指南:');
  console.log('='.repeat(40));
  console.log('');
  console.log('📋 基本用法:');
  console.log('  node scripts/query-db.js <command> [参数]');
  console.log('');
  console.log('📊 可用命令:');
  console.log('  users              - 查询所有用户');
  console.log('  user <id>          - 查询指定ID的用户');
  console.log('  games              - 查询所有游戏');
  console.log('  game <appid>       - 查询指定应用ID的游戏');
  console.log('  delete-game <id或appid> - 删除指定游戏（危险操作！）');
  console.log('  user-games         - 查询用户游戏关联');
  console.log('  stats              - 显示统计信息');
  console.log('  help               - 显示此帮助信息');
  console.log('');
  console.log('💡 示例:');
  console.log('  node scripts/query-db.js users');
  console.log('  node scripts/query-db.js user 1');
  console.log('  node scripts/query-db.js games');
  console.log('  node scripts/query-db.js game tt8c62fadf136c334702');
  console.log('  node scripts/query-db.js delete-game 2');
  console.log('  node scripts/query-db.js delete-game tt123456789');
  console.log('  node scripts/query-db.js stats');
  console.log('');
  console.log('⚠️ 注意: delete-game 是危险操作，会同时删除相关的用户游戏关联记录！');
  console.log('');
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const param = args[1];

  if (!command) {
    console.log('❌ 请提供查询命令');
    showHelp();
    process.exit(1);
  }

  try {
    console.log('📡 初始化数据库连接...');
    const { User, Game, UserGame } = await initializeDatabase();

    switch (command.toLowerCase()) {
      case 'users':
        await queryUsers(User);
        break;
      case 'user':
        if (!param) {
          console.log('❌ 请提供用户ID');
          process.exit(1);
        }
        await queryUserById(User, parseInt(param));
        break;
      case 'games':
        await queryGames(Game);
        break;
      case 'game':
        if (!param) {
          console.log('❌ 请提供游戏应用ID');
          process.exit(1);
        }
        await queryGameByAppId(Game, param);
        break;
      case 'delete-game':
        if (!param) {
          console.log('❌ 请提供游戏ID或应用ID');
          process.exit(1);
        }
        await deleteGame(Game, UserGame, param);
        break;
      case 'user-games':
        await queryUserGames(UserGame);
        break;
      case 'stats':
        await showStats(User, Game, UserGame);
        break;
      case 'help':
      case '-h':
      case '--help':
        showHelp();
        break;
      default:
        console.log(`❌ 未知命令: ${command}`);
        showHelp();
        process.exit(1);
    }

    console.log('\n✅ 查询完成！');

  } catch (error) {
    console.error('❌ 查询失败:', error.message);
    process.exit(1);
  }
}

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = { initializeDatabase, queryUsers, queryGames, queryUserGames, showStats, deleteGame };