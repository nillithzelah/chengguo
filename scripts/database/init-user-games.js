const { testConnection, sequelize } = require('../config/database');
const defineUserModel = require('../models/User');
const defineGameModel = require('../models/Game');
const defineUserGameModel = require('../models/UserGame');

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

async function initUserGames() {
  try {
    console.log('🎮 初始化用户游戏关联数据...');

    // 测试数据库连接
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ 数据库连接失败');
      return;
    }

    // 获取现有用户和游戏
    const users = await User.findAll({ where: { is_active: true } });
    const games = await Game.findAll({ where: { status: 'active' } });

    console.log(`📊 找到 ${users.length} 个活跃用户，${games.length} 个活跃游戏`);

    if (users.length === 0 || games.length === 0) {
      console.log('⚠️ 没有足够的用户或游戏数据，跳过初始化');
      return;
    }

    // 为每个用户分配游戏
    for (const user of users) {
      for (const game of games) {
        // 检查是否已存在关联
        const existing = await UserGame.findOne({
          where: { user_id: user.id, game_id: game.id }
        });

        if (!existing) {
          // 创建用户游戏关联
          const role = user.role === 'admin' ? 'owner' : (user.role === 'moderator' ? 'editor' : 'viewer');

          await UserGame.create({
            user_id: user.id,
            game_id: game.id,
            role: role,
            assignedBy: 1, // 假设管理员ID为1
            assignedAt: new Date()
          });

          console.log(`✅ 为用户 ${user.username} 分配游戏 ${game.name}，角色：${role}`);
        } else {
          console.log(`⏭️ 用户 ${user.username} 已拥有游戏 ${game.name}`);
        }
      }
    }

    console.log('🎉 用户游戏关联数据初始化完成！');

  } catch (error) {
    console.error('❌ 初始化用户游戏关联数据失败:', error);
  } finally {
    await sequelize.close();
  }
}

// 运行初始化
initUserGames();