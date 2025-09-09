#!/usr/bin/env node

const { testConnection, syncDatabase, sequelize } = require('../config/database');
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

// 注意：eCPM数据表已移除，采用实时查询策略
// 这样可以减少存储成本，提高数据实时性

async function initializeDatabase() {
  console.log('🚀 开始初始化PostgreSQL数据库...');

  try {
    // 1. 测试数据库连接
    console.log('📡 测试数据库连接...');
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ 数据库连接失败，请检查配置');
      process.exit(1);
    }

    // 2. 同步数据库模型
    console.log('🔄 同步数据库模型...');
    const isSynced = await syncDatabase(false); // 不强制重建表
    if (!isSynced) {
      console.error('❌ 数据库同步失败');
      process.exit(1);
    }

    // 3. 检查是否已有管理员用户
    console.log('👤 检查管理员用户...');
    let adminUser = await User.findByUsername('admin');

    if (!adminUser) {
      console.log('📝 创建默认管理员用户...');

      // 创建默认管理员用户
      adminUser = await User.createUser({
        username: 'admin',
        password: 'admin123',
        name: '系统管理员',
        email: 'admin@chengguo.com',
        role: 'admin',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'
      });

      console.log('✅ 管理员用户创建成功');
      console.log('   用户名: admin');
      console.log('   密码: admin123');
      console.log('   角色: admin');
    } else {
      console.log('✅ 管理员用户已存在');
    }

    // 4. 创建一些测试用户（如果不存在）
    console.log('👥 检查测试用户...');

    const testUsers = [
      {
        username: 'user',
        password: 'user123',
        name: '测试用户',
        email: 'user@chengguo.com',
        role: 'user',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'
      },
      {
        username: 'moderator',
        password: 'mod123',
        name: '审核员',
        email: 'moderator@chengguo.com',
        role: 'moderator',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=moderator'
      }
    ];

    for (const testUser of testUsers) {
      const existingUser = await User.findByUsername(testUser.username);
      if (!existingUser) {
        await User.createUser(testUser);
        console.log(`✅ 测试用户 ${testUser.username} 创建成功`);
      } else {
        console.log(`✅ 测试用户 ${testUser.username} 已存在`);
      }
    }

    // 5. 创建默认游戏（如果不存在）
    console.log('🎮 检查默认游戏...');

    const defaultGames = [
      {
        appid: 'tt8c62fadf136c334702',
        name: '橙果宜牛小游戏',
        appSecret: '56808246ee49c052ecc7be8be79551859837409e',
        description: '默认的小游戏应用',
        status: 'active',
        validated: true
      }
    ];

    const createdGames = [];
    for (const gameData of defaultGames) {
      const existingGame = await Game.findByAppId(gameData.appid);
      if (!existingGame) {
        const game = await Game.create(gameData);
        createdGames.push(game);
        console.log(`✅ 默认游戏 ${gameData.name} 创建成功`);
      } else {
        console.log(`✅ 默认游戏 ${gameData.name} 已存在`);
        createdGames.push(existingGame);
      }
    }

    // 6. 为用户分配游戏权限
    console.log('🔗 分配用户游戏权限...');

    // 确保adminUser存在
    if (!adminUser) {
      console.error('❌ 管理员用户不存在，无法分配权限');
      process.exit(1);
    }

    console.log(`👤 管理员用户ID: ${adminUser.id}, 用户名: ${adminUser.username}`);

    // 获取所有用户
    const allUsers = await User.findAll({
      where: { is_active: true },
      attributes: ['id', 'username', 'role']
    });

    // 为每个用户分配默认游戏权限
    for (const user of allUsers) {
      for (const game of createdGames) {
        const existingPermission = await UserGame.findOne({
          where: { user_id: user.id, game_id: game.id }
        });

        if (!existingPermission) {
          // 根据用户角色设置权限
          const role = user.role === 'admin' ? 'owner' : 'viewer';
          console.log(`🔧 分配权限: userId=${user.id}, gameId=${game.id}, role=${role}, assignedBy=${adminUser.id}`);
          await UserGame.assignGameToUser(
            user.id,
            game.id,
            role,
            adminUser.id // 由管理员分配
          );
          console.log(`✅ 为用户 ${user.username} 分配游戏 ${game.name} 的 ${role} 权限`);
        }
      }
    }

    // 7. 显示所有用户和游戏信息
    console.log('📊 当前用户列表:');
    const usersWithGames = await User.findAll({
      attributes: ['id', 'username', 'name', 'email', 'role', 'is_active', 'created_at'],
      include: [{
        model: Game,
        as: 'games',
        through: { attributes: ['role'] },
        where: { status: 'active' },
        required: false
      }],
      order: [['created_at', 'ASC']]
    });

    console.table(usersWithGames.map(user => ({
      ID: user.id,
      用户名: user.username,
      姓名: user.name,
      邮箱: user.email,
      角色: user.role,
      状态: user.is_active ? '活跃' : '禁用',
      游戏数量: user.games ? user.games.length : 0,
      创建时间: user.created_at.toLocaleString('zh-CN')
    })));

    console.log('🎮 当前游戏列表:');
    const allGames = await Game.findAll({
      include: [{
        model: User,
        as: 'users',
        through: { attributes: ['role'] },
        where: { is_active: true },
        required: false
      }],
      order: [['created_at', 'ASC']]
    });

    console.table(allGames.map(game => ({
      ID: game.id,
      应用ID: game.appid,
      游戏名称: game.name,
      状态: game.status,
      用户数量: game.users ? game.users.length : 0,
      创建时间: game.created_at.toLocaleString('zh-CN')
    })));

    console.log('🎉 数据库初始化完成！');
    console.log('');
    console.log('📝 使用说明:');
    console.log('   - 管理员账号: admin / admin123');
    console.log('   - 测试账号: user / user123');
    console.log('   - 审核员账号: moderator / mod123');
    console.log('');
    console.log('🔧 如需重新初始化数据库，请运行:');
    console.log('   node scripts/init-db.js --force');

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  }
}

// 检查命令行参数
const args = process.argv.slice(2);
if (args.includes('--force')) {
  console.log('⚠️  强制重建数据库模式');
  // 这里可以添加强制重建的逻辑
}

// 运行初始化
initializeDatabase().then(() => {
  console.log('✅ 初始化脚本执行完毕');
  process.exit(0);
}).catch((error) => {
  console.error('❌ 初始化脚本执行失败:', error);
  process.exit(1);
});