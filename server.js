const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// 数据库和模型导入
const { testConnection, sequelize } = require('./config/database');
const defineUserModel = require('./models/User');
const defineGameModel = require('./models/Game');
const defineUserGameModel = require('./models/UserGame');

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

// JWT secret key - In production, use a strong secret key from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// 认证中间件
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

// 用户登录
app.post('/api/user/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        code: 400,
        message: '用户名和密码不能为空'
      });
    }

    // 从数据库查找用户
    const user = await User.findByUsername(username);

    if (!user) {
      return res.status(401).json({
        code: 50008,
        message: '用户名或密码错误'
      });
    }

    // 验证密码
    const isValidPassword = await user.validatePassword(password);

    if (!isValidPassword) {
      return res.status(401).json({
        code: 50008,
        message: '用户名或密码错误'
      });
    }

    // 检查用户是否激活
    if (!user.is_active) {
      return res.status(401).json({
        code: 50008,
        message: '账号已被禁用'
      });
    }

    // 更新最后登录时间
    await User.updateLastLogin(user.id);

    // 生成token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      code: 20000,
      data: {
        token,
        userInfo: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          avatar: user.avatar
        }
      },
      message: '登录成功'
    });

  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// 获取用户信息 - 支持 GET 和 POST 方法
const handleUserInfo = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        code: 50008,
        message: '未认证'
      });
    }

    const user = await User.findByPk(req.user.userId);

    if (!user || !user.is_active) {
      return res.status(404).json({
        code: 50008,
        message: '用户不存在或已被禁用'
      });
    }

    res.json({
      code: 20000,
      data: user.toFrontendFormat()
    });

  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

// 注册路由
app.get('/api/user/info', authenticateJWT, handleUserInfo);
app.post('/api/user/info', authenticateJWT, handleUserInfo);

// 创建新用户
app.post('/api/user/create', async (req, res) => {
  try {
    const { username, password, name, role } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({
        code: 400,
        message: '用户名、密码和显示名称不能为空'
      });
    }

    // 检查用户名是否已存在
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({
        code: 400,
        message: '用户名已存在'
      });
    }

    // 创建新用户
    const newUser = await User.createUser({
      username,
      password,
      name,
      role: role || 'user'
    });

    console.log('✅ 新用户创建成功:', username);

    res.json({
      code: 20000,
      data: {
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        role: newUser.role,
        created_at: newUser.created_at
      },
      message: '用户创建成功'
    });

  } catch (error) {
    console.error('创建用户错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// 用户登出
app.post('/api/user/logout', (req, res) => {
  res.json({
    code: 20000,
    data: {},
    message: '登出成功'
  });
});

// 个人中心相关API - 返回空数据以避免前端报错
app.post('/api/user/my-project/list', (req, res) => {
  res.json({
    code: 20000,
    data: [],
    message: '获取成功'
  });
});

app.post('/api/user/latest-activity', (req, res) => {
  res.json({
    code: 20000,
    data: [],
    message: '获取成功'
  });
});

app.post('/api/user/my-team/list', (req, res) => {
  res.json({
    code: 20000,
    data: [],
    message: '获取成功'
  });
});

app.post('/api/user/certification', (req, res) => {
  res.json({
    code: 20000,
    data: {
      enterpriseInfo: {},
      record: []
    },
    message: '获取成功'
  });
});

// 删除用户 (仅管理员)
app.delete('/api/user/delete/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    // 检查权限：只有管理员可以删除用户
    if (currentUser.role !== 'admin') {
      return res.status(403).json({
        code: 403,
        message: '权限不足，只有管理员可以删除用户'
      });
    }

    // 不允许删除自己
    if (parseInt(id) === currentUser.userId) {
      return res.status(400).json({
        code: 400,
        message: '不能删除自己的账号'
      });
    }

    // 查找用户
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    // 删除用户
    await user.destroy();

    console.log(`管理员 ${currentUser.username} 删除了用户 ${user.username} (ID: ${id})`);

    res.json({
      code: 20000,
      message: '用户删除成功'
    });

  } catch (error) {
    console.error('删除用户错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// 获取所有用户列表 (仅管理员)
app.get('/api/user/list', authenticateJWT, async (req, res) => {
  try {
    const currentUser = req.user;

    // 检查权限：只有管理员可以查看用户列表
    if (currentUser.role !== 'admin') {
      return res.status(403).json({
        code: 403,
        message: '权限不足，只有管理员可以查看用户列表'
      });
    }

    // 获取所有用户
    const users = await User.findAll({
      attributes: ['id', 'username', 'name', 'email', 'role', 'is_active', 'last_login_at', 'created_at', 'password_plain'],
      order: [['created_at', 'DESC']]
    });

    console.log('用户列表查询结果:', users.map(u => ({ id: u.id, username: u.username, password_plain: u.password_plain })));

    // 格式化数据
    const formattedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      name: user.name || '',
      email: user.email || '',
      role: user.role,
      is_active: user.is_active,
      last_login_at: user.last_login_at,
      created_at: user.created_at,
      password: user.password_plain || '******' // 显示明文密码或默认值
    }));

    res.json({
      code: 20000,
      data: {
        users: formattedUsers,
        total: formattedUsers.length
      },
      message: '获取用户列表成功'
    });

  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// 获取用户游戏列表 (管理员可看所有，普通用户只能看自己的)
app.get('/api/game/user-games/:userId', authenticateJWT, async (req, res) => {
  try {
    const currentUser = req.user;
    const { userId } = req.params;

    // 检查权限：管理员可以查看任何用户的游戏列表，普通用户只能查看自己的
    if (currentUser.role !== 'admin' && parseInt(userId) !== currentUser.userId) {
      return res.status(403).json({
        code: 403,
        message: '权限不足，只能查看自己的游戏列表'
      });
    }

    // 验证用户是否存在
    const targetUser = await User.findByPk(userId);
    if (!targetUser) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    // 获取用户的游戏列表 - 使用原生SQL查询确保包含app_secret字段
    const userGames = await sequelize.query(`
      SELECT
        ug.id, ug.user_id, ug.game_id, ug.role, ug.permissions,
        ug.assigned_at as "assignedAt", ug.assigned_by as "assignedBy",
        ug.created_at, ug.updated_at,
        g.id as "game.id", g.appid as "game.appid", g.name as "game.name",
        g.app_secret as "game.appSecret", g.description as "game.description",
        g.status as "game.status", g.validated as "game.validated",
        g.created_at as "game.created_at",
        u.username as "assignedByUser.username", u.name as "assignedByUser.name"
      FROM user_games ug
      INNER JOIN games g ON ug.game_id = g.id AND g.status = 'active'
      LEFT JOIN users u ON ug.assigned_by = u.id
      WHERE ug.user_id = ?
      ORDER BY ug.assigned_at DESC
    `, {
      replacements: [userId],
      type: sequelize.QueryTypes.SELECT
    });

    // 重新格式化为预期的结构
    const formattedGames = userGames.map(item => ({
      id: item.id,
      game: {
        id: item['game.id'],
        appid: item['game.appid'],
        name: item['game.name'],
        appSecret: item['game.appSecret'],
        description: item['game.description'],
        status: item['game.status'],
        validated: item['game.validated'],
        created_at: item['game.created_at']
      },
      role: item.role,
      permissions: item.permissions || {},
      assignedAt: item.assignedAt,
      assignedBy: item['assignedByUser.username'] ? {
        username: item['assignedByUser.username'],
        name: item['assignedByUser.name']
      } : null
    }));

    console.log(`管理员 ${currentUser.username} 查看用户 ${targetUser.username} 的游戏列表`);

    res.json({
      code: 20000,
      data: {
        user: {
          id: targetUser.id,
          username: targetUser.username,
          name: targetUser.name,
          role: targetUser.role
        },
        games: formattedGames,
        total: formattedGames.length
      },
      message: '获取用户游戏列表成功'
    });

  } catch (error) {
    console.error('获取用户游戏列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// 为用户分配游戏权限 (仅管理员)
app.post('/api/game/assign', authenticateJWT, async (req, res) => {
 try {
   const currentUser = req.user;
   const { userId, gameId, role = 'viewer' } = req.body;

   // 检查权限：只有管理员可以分配游戏权限
   if (currentUser.role !== 'admin') {
     return res.status(403).json({
       code: 403,
       message: '权限不足，只有管理员可以分配游戏权限'
     });
   }

   // 验证用户是否存在
   const targetUser = await User.findByPk(userId);
   if (!targetUser || !targetUser.is_active) {
     return res.status(404).json({
       code: 404,
       message: '用户不存在或已被禁用'
     });
   }

   // 验证游戏是否存在
   const game = await Game.findByPk(gameId);
   if (!game || game.status !== 'active') {
     return res.status(404).json({
       code: 404,
       message: '游戏不存在或已停用'
     });
   }

   // 检查是否已存在关联
   const existing = await UserGame.findOne({
     where: { user_id: userId, game_id: gameId }
   });

   if (existing) {
     // 更新现有权限
     await existing.update({
       role,
       assignedBy: currentUser.userId,
       assignedAt: new Date(),
       updated_at: new Date()
     });

     console.log(`管理员 ${currentUser.username} 更新用户 ${targetUser.username} 的游戏 ${game.name} 权限为 ${role}`);
     res.json({
       code: 20000,
       message: '游戏权限更新成功'
     });
   } else {
     // 创建新关联
     await UserGame.create({
       user_id: userId,
       game_id: gameId,
       role,
       assignedBy: currentUser.userId,
       assignedAt: new Date()
     });

     console.log(`管理员 ${currentUser.username} 为用户 ${targetUser.username} 分配游戏 ${game.name}，权限：${role}`);
     res.json({
       code: 20000,
       message: '游戏权限分配成功'
     });
   }

 } catch (error) {
   console.error('分配游戏权限错误:', error);
   res.status(500).json({
     code: 500,
     message: '服务器内部错误'
   });
 }
});

// 移除用户的游戏权限 (仅管理员)
app.delete('/api/game/remove/:userId/:gameId', authenticateJWT, async (req, res) => {
 try {
   const currentUser = req.user;
   const { userId, gameId } = req.params;

   // 检查权限：只有管理员可以移除游戏权限
   if (currentUser.role !== 'admin') {
     return res.status(403).json({
       code: 403,
       message: '权限不足，只有管理员可以移除游戏权限'
     });
   }

   // 验证用户是否存在
   const targetUser = await User.findByPk(userId);
   if (!targetUser) {
     return res.status(404).json({
       code: 404,
       message: '用户不存在'
     });
   }

   // 验证游戏是否存在
   const game = await Game.findByPk(gameId);
   if (!game) {
     return res.status(404).json({
       code: 404,
       message: '游戏不存在'
     });
   }

   // 删除关联
   const deletedCount = await UserGame.destroy({
     where: { user_id: userId, game_id: gameId }
   });

   if (deletedCount > 0) {
     console.log(`管理员 ${currentUser.username} 移除了用户 ${targetUser.username} 的游戏 ${game.name} 权限`);
     res.json({
       code: 20000,
       message: '游戏权限移除成功'
     });
   } else {
     res.status(404).json({
       code: 404,
       message: '未找到相应的游戏权限记录'
     });
   }

 } catch (error) {
   console.error('移除游戏权限错误:', error);
   res.status(500).json({
     code: 500,
     message: '服务器内部错误'
   });
 }
});

// 获取游戏的所有用户 (仅管理员)
app.get('/api/game/:id/users', authenticateJWT, async (req, res) => {
  try {
    const currentUser = req.user;
    const { id } = req.params;

    // 检查权限：只有管理员可以查看游戏用户列表
    if (currentUser.role !== 'admin') {
      return res.status(403).json({
        code: 403,
        message: '权限不足，只有管理员可以查看游戏用户列表'
      });
    }

    // 验证游戏是否存在
    const game = await Game.findByPk(id);
    if (!game) {
      return res.status(404).json({
        code: 404,
        message: '游戏不存在'
      });
    }

    // 查询游戏的所有用户（通过user_games表）
    const userGames = await UserGame.findAll({
      where: { game_id: id },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'name', 'role']
      }],
      order: [['assigned_at', 'DESC']]
    });

    // 格式化数据
    const formattedUsers = userGames.map(userGame => ({
      id: userGame.id,
      user: userGame.user,
      role: userGame.role,
      permissions: userGame.permissions,
      assignedAt: userGame.assignedAt,
      assignedBy: userGame.assignedByUser ? {
        username: userGame.assignedByUser.username,
        name: userGame.assignedByUser.name
      } : null
    }));

    res.json({
      code: 20000,
      data: {
        game: {
          id: game.id,
          name: game.name,
          appid: game.appid
        },
        users: formattedUsers,
        total: formattedUsers.length
      },
      message: '获取游戏用户列表成功'
    });

  } catch (error) {
    console.error('获取游戏用户列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// 获取游戏的所有者信息 (仅管理员)
app.get('/api/game/:id/owner', authenticateJWT, async (req, res) => {
  try {
    const currentUser = req.user;
    const { id } = req.params;

    // 检查权限：只有管理员可以查看游戏所有者信息
    if (currentUser.role !== 'admin') {
      return res.status(403).json({
        code: 403,
        message: '权限不足，只有管理员可以查看游戏所有者信息'
      });
    }

    // 验证游戏是否存在
    const game = await Game.findByPk(id);
    if (!game) {
      return res.status(404).json({
        code: 404,
        message: '游戏不存在'
      });
    }

    // 查询游戏的所有者（通过user_games表查找owner用户）
    const userGame = await UserGame.findOne({
      where: { game_id: id, role: 'owner' },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'name', 'role']
      }]
    });

    if (userGame && userGame.user) {
      res.json({
        code: 20000,
        data: {
          owner: userGame.user,
          assignedAt: userGame.assignedAt
        },
        message: '获取游戏所有者信息成功'
      });
    } else {
      // 如果没有找到owner，可能是系统创建的游戏，返回默认管理员
      res.json({
        code: 20000,
        data: {
          owner: {
            id: 1,
            username: 'admin',
            name: '系统管理员',
            role: 'admin'
          },
          assignedAt: game.created_at
        },
        message: '获取游戏所有者信息成功（使用默认管理员）'
      });
    }

  } catch (error) {
    console.error('获取游戏所有者信息错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// 获取游戏列表 (管理员看所有，普通用户看自己的)
app.get('/api/game/list', authenticateJWT, async (req, res) => {
  try {
    const currentUser = req.user;

    if (currentUser.role === 'admin') {
      // 管理员可以看到所有活跃游戏
      const games = await Game.findAll({
        where: { status: 'active' },
        attributes: ['id', 'appid', 'name', 'description', 'status', 'validated', 'created_at', 'app_secret'],
        order: [['created_at', 'DESC']]
      });

      res.json({
        code: 20000,
        data: {
          games: games,
          total: games.length
        },
        message: '获取游戏列表成功'
      });
    } else {
      // 普通用户只能看到自己有权限的游戏
      const userGames = await UserGame.findAll({
        where: { user_id: currentUser.userId },
        include: [{
          model: Game,
          as: 'game',
          where: { status: 'active' },
          required: true
        }],
        order: [['assigned_at', 'DESC']]
      });

      // 提取游戏信息
      const games = userGames.map(userGame => userGame.game);

      res.json({
        code: 20000,
        data: {
          games: games,
          total: games.length
        },
        message: '获取游戏列表成功'
      });
    }

  } catch (error) {
    console.error('获取游戏列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// 删除游戏 (仅管理员)
app.delete('/api/game/delete/:id', authenticateJWT, async (req, res) => {
  try {
    console.log('🗑️ 删除游戏请求:', { id: req.params.id, user: req.user });

    const currentUser = req.user;
    const { id } = req.params;

    // 检查权限：只有管理员可以删除游戏
    if (currentUser.role !== 'admin') {
      console.log('❌ 权限不足:', { userRole: currentUser.role, requiredRole: 'admin' });
      return res.status(403).json({
        code: 403,
        message: '权限不足，只有管理员可以删除游戏'
      });
    }

    // 查找游戏
    const game = await Game.findByPk(id);
    if (!game) {
      return res.status(404).json({
        code: 404,
        message: '游戏不存在'
      });
    }

    // 检查游戏是否有关联的用户权限记录
    const userGameCount = await UserGame.count({
      where: { game_id: id }
    });

    if (userGameCount > 0) {
      // 如果有用户权限记录，先删除它们
      await UserGame.destroy({
        where: { game_id: id }
      });
      console.log(`删除了 ${userGameCount} 条用户游戏权限记录`);
    }

    // 删除游戏
    await game.destroy();

    console.log(`管理员 ${currentUser.username} 删除了游戏 ${game.name} (ID: ${id})`);

    res.json({
      code: 20000,
      message: '游戏删除成功',
      data: {
        deletedGame: {
          id: game.id,
          name: game.name,
          appid: game.appid
        },
        deletedPermissions: userGameCount
      }
    });

  } catch (error) {
    console.error('删除游戏错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// 创建新游戏 (仅管理员)
app.post('/api/game/create', authenticateJWT, async (req, res) => {
  try {
    const currentUser = req.user;
    const { name, appid, appSecret, description } = req.body;

    // 检查权限：只有管理员可以创建游戏
    if (currentUser.role !== 'admin') {
      return res.status(403).json({
        code: 403,
        message: '权限不足，只有管理员可以创建游戏'
      });
    }

    // 验证必填字段
    if (!name || !appid || !appSecret) {
      return res.status(400).json({
        code: 400,
        message: '游戏名称、App ID和App Secret不能为空'
      });
    }

    // 检查App ID是否已存在
    const existingGame = await Game.findByAppId(appid);
    if (existingGame) {
      return res.status(400).json({
        code: 400,
        message: '该App ID已存在，请使用不同的App ID'
      });
    }

    // 创建新游戏
    const newGame = await Game.create({
      name,
      appid,
      appSecret,
      description: description || '',
      status: 'active',
      validated: true, // 前端已经验证过
      validatedAt: new Date()
    });

    console.log(`管理员 ${currentUser.username} 创建了新游戏: ${name} (App ID: ${appid})`);

    res.json({
      code: 20000,
      data: {
        game: newGame.toFrontendFormat(),
        id: newGame.id
      },
      message: '游戏创建成功'
    });

  } catch (error) {
    console.error('创建游戏错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// 获取所有用户的基本信息 (仅管理员，用于用户选择器)
app.get('/api/user/basic-list', authenticateJWT, async (req, res) => {
  try {
    const currentUser = req.user;

    // 检查权限：只有管理员可以查看用户列表
    if (currentUser.role !== 'admin') {
      return res.status(403).json({
        code: 403,
        message: '权限不足，只有管理员可以查看用户列表'
      });
    }

    // 获取所有活跃用户的基本信息
    const users = await User.findAll({
      where: { is_active: true },
      attributes: ['id', 'username', 'name', 'role'],
      order: [['username', 'ASC']]
    });

    res.json({
      code: 20000,
      data: {
        users: users,
        total: users.length
      },
      message: '获取用户基本信息成功'
    });

  } catch (error) {
    console.error('获取用户基本信息错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// 抖音webhook端点
app.get('/api/douyin/webhook', (req, res) => {
  console.log('📡 抖音webhook GET请求验证:', req.query);
  
  // 抖音平台验证请求处理
  const echostr = req.query.echostr;
  
  if (echostr) {
    console.log('✅ 返回验证字符串:', echostr);
    return res.send(echostr);
  }
  
  res.json({
    endpoint: '/api/douyin/webhook',
    status: 'active',
    timestamp: new Date().toISOString(),
    description: '用于接收抖音开放平台消息推送',
    token: 'douyingameads2024'
  });
});


// POST请求 - 用于接收消息推送
app.post('/api/douyin/webhook', (req, res) => {
  console.log('📨 收到抖音webhook POST消息:');
  // 生产环境不记录敏感信息
  if (process.env.NODE_ENV !== 'production') {
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
  }
  
  // 处理不同类型的消息推送
  if (req.body?.event_type) {
    switch (req.body.event_type) {
      case 'ad_update':
        console.log('📈 广告数据更新通知');
        break;
      case 'account_update':
        console.log('👤 账户信息更新通知');
        break;
      case 'budget_alert':
        console.log('💰 预算警告通知');
        break;
      default:
        console.log('📋 其他类型消息:', req.body.event_type);
    }
  }
  
  // 返回成功响应（抖音平台要求）
  res.json({
    code: 0,
    message: 'success',
    data: {
      received: true,
      timestamp: new Date().toISOString()
    }
  });
});

// 抖音API代理端点 - 获取client_token - 已删除
// app.post('/api/douyin/token', async (req, res) => {
//   // Token API调用已删除
// });

// 抖音广告数据代理 - 使用client_token
app.get('/api/douyin/ads', async (req, res) => {
  try {
    console.log('📋 获取抖音广告数据请求');

    // Token获取已删除 - 使用模拟token
    const clientToken = 'mock_token_deleted';
    console.log('✅ 使用模拟token（Token API已删除）');

    // 使用client_token获取广告数据
    // 这里可以根据实际需求调用不同的抖音API
    const advertiserId = req.query.advertiser_id || process.env.VITE_DOUYIN_ADVERTISER_ID;

    if (!advertiserId) {
      return res.status(400).json({
        error: '缺少参数',
        message: '请提供advertiser_id参数或配置环境变量'
      });
    }

    // 示例：获取广告计划数据 - 已删除
    // const adsResponse = await axios.get('https://developer.toutiao.com/api/v1.0/qianchuan/campaign/list/', {
    //   params: {
    //     advertiser_id: advertiserId,
    //     page: req.query.page || 1,
    //     page_size: req.query.page_size || 20
    //   },
    //   headers: {
    //     'Access-Token': clientToken,
    //     'Content-Type': 'application/json'
    //   },
    //   timeout: 15000
    // });

    // console.log('✅ 获取广告数据成功');

    // res.json({
    //   code: 0,
    //   message: 'success',
    //   data: adsResponse.data.data || {
    //     list: [],
    //     total: 0
    //   },
    //   token_info: {
    //     expires_in: tokenResponse.data.data.expires_in,
    //     token_type: 'client_token'
    //   }
    // });

    // 返回空数据响应
    res.json({
      code: 0,
      message: 'success',
      data: {
        list: [],
        total: 0
      },
      token_info: {
        expires_in: 7200,
        token_type: 'client_token'
      }
    });

  } catch (error) {
    console.error('❌ 获取广告数据失败:', error);

    if (error.response) {
      console.error('📄 抖音API响应:', {
        status: error.response.status,
        data: error.response.data
      });
    }

    res.status(500).json({
      error: '获取广告数据失败',
      message: error.message || '网络请求失败',
      code: error.response?.status || 'API_ERROR'
    });
  }
});



// 测试应用连接API
app.post('/api/douyin/test-connection', async (req, res) => {
  console.log('🔗 测试应用连接请求');

  try {
    const { appid, secret } = req.body;
    const appSecret = secret; // 兼容前端发送的参数名

    if (!appid || !appSecret) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要的参数：appid或appSecret'
      });
    }

    console.log('🔑 测试应用连接:', { appid: appid.substring(0, 10) + '...' });

    // 调用抖音小游戏token API进行测试
    const tokenRequestData = {
      appid: appid,
      secret: appSecret,
      grant_type: 'client_credential'
    };

    console.log('📤 Token测试请求参数:', JSON.stringify(tokenRequestData, null, 2));

    const tokenResponse = await axios.post('https://minigame.zijieapi.com/mgplatform/api/apps/v2/token', tokenRequestData, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DouyinGameAds-TestConnection/1.0'
      }
    });

    console.log('📥 Token测试响应:', JSON.stringify(tokenResponse.data, null, 2));

    if (tokenResponse.data.err_no === 0 && tokenResponse.data.data && tokenResponse.data.data.access_token) {
      console.log('✅ 应用连接测试成功');

      res.json({
        code: 0,
        message: '连接成功！应用配置有效',
        data: {
          access_token: tokenResponse.data.data.access_token.substring(0, 20) + '...',
          expires_in: tokenResponse.data.data.expires_in,
          tested_at: new Date().toISOString()
        }
      });
    } else {
      console.log('❌ 应用连接测试失败:', tokenResponse.data.err_tips || tokenResponse.data.err_msg);

      res.status(400).json({
        code: 400,
        message: '连接失败',
        error: tokenResponse.data.err_tips || tokenResponse.data.err_msg || '未知错误',
        details: tokenResponse.data
      });
    }

  } catch (error) {
    console.error('❌ 测试应用连接时出错:', error);

    if (error.response) {
      console.error('📄 抖音API响应错误:', {
        status: error.response.status,
        data: error.response.data
      });

      // 根据HTTP状态码提供更具体的错误信息
      let errorMessage = '连接失败';
      if (error.response.status === 401) {
        errorMessage = 'App ID或App Secret无效';
      } else if (error.response.status === 403) {
        errorMessage = '应用权限不足或已被禁用';
      } else if (error.response.status === 429) {
        errorMessage = '请求过于频繁，请稍后重试';
      }

      res.status(400).json({
        code: 400,
        message: errorMessage,
        error: error.response.data,
        http_status: error.response.status
      });
    } else if (error.code === 'ECONNREFUSED') {
      res.status(500).json({
        code: 500,
        message: '网络连接失败，请检查网络设置',
        error: '无法连接到抖音API服务器'
      });
    } else {
      res.status(500).json({
        code: 500,
        message: '测试服务暂时不可用，请稍后重试',
        error: error.message || '未知错误'
      });
    }
  }
});

// 小游戏eCPM数据获取API - 根据游戏App ID获取对应的access_token
app.get('/api/douyin/ecpm', async (req, res) => {
  console.log('🚀 ===== 开始eCPM数据获取流程 =====');

  try {
    const mpId = req.query.mp_id;
    if (!mpId) {
      return res.status(400).json({
        error: '缺少参数',
        message: '请提供mp_id参数'
      });
    }

    console.log('🎮 查询游戏:', mpId);

    // 步骤1: 根据游戏App ID获取对应的access_token
    console.log('📍 步骤1: 获取access_token');
    console.log('🔗 请求URL: https://minigame.zijieapi.com/mgplatform/api/apps/v2/token');

    // 从前端传递的查询参数中获取App Secret
    // 前端应该传递app_secret参数，或者我们需要从配置中获取
    const appSecret = req.query.app_secret || process.env.VITE_DOUYIN_APP_SECRET || '56808246ee49c052ecc7be8be79551859837409e';

    const tokenRequestData = {
      appid: mpId,  // 使用前端传递的mp_id作为appid
      secret: appSecret,  // 使用对应的App Secret
      grant_type: 'client_credential'
    };

    console.log('📤 请求参数:', JSON.stringify(tokenRequestData, null, 2));

    const tokenResponse = await axios.post('https://minigame.zijieapi.com/mgplatform/api/apps/v2/token', tokenRequestData, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DouyinGameAds/1.0'
      }
    });

    console.log('📥 Token响应:', JSON.stringify(tokenResponse.data, null, 2));

    if (tokenResponse.data.err_no !== 0) {
      console.error('❌ Token获取失败:', tokenResponse.data.err_tips);
      return res.status(500).json({
        error: 'Token获取失败',
        message: tokenResponse.data.err_tips,
        details: tokenResponse.data
      });
    }

    const accessToken = tokenResponse.data.data.access_token;
    console.log('✅ Token获取成功:', accessToken);

    // 步骤2: 获取eCPM数据
    console.log('📍 步骤2: 获取eCPM数据');
    console.log('🔗 请求URL: https://minigame.zijieapi.com/mgplatform/api/apps/data/get_ecpm');

    // 构建eCPM查询参数，支持前端传递的筛选条件
    const ecpmParams = {
      open_id: '',
      mp_id: req.query.mp_id || 'tt8c62fadf136c334702',  // 使用前端传递的参数
      date_hour: req.query.date_hour || new Date().toISOString().split('T')[0],  // 使用前端传递的参数
      access_token: accessToken,  // 使用刚获取的真实token
      page_no: parseInt(req.query.page_no) || 1,  // 使用前端传递的参数
      page_size: parseInt(req.query.page_size) || 10  // 使用前端传递的参数
    };

    // 添加可选的筛选参数
    if (req.query.aid) {
      ecpmParams.aid = req.query.aid;  // 广告ID筛选
    }
    if (req.query.event_name) {
      ecpmParams.event_name = req.query.event_name;  // 事件类型筛选
    }
    if (req.query.min_revenue) {
      ecpmParams.min_revenue = parseFloat(req.query.min_revenue);  // 最小收益筛选
    }

    console.log('📤 eCPM请求参数:', JSON.stringify(ecpmParams, null, 2));

    const ecpmResponse = await axios.get('https://minigame.zijieapi.com/mgplatform/api/apps/data/get_ecpm', {
      params: ecpmParams,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DouyinGameAds-ECPM/1.0'
      },
      timeout: 20000
    });

    console.log('📥 eCPM响应:', JSON.stringify(ecpmResponse.data, null, 2));
    console.log('✅ eCPM数据获取成功');

    console.log('🎉 ===== eCPM数据获取流程完成 =====');

    res.json({
      code: 0,
      message: 'success',
      data: ecpmResponse.data,
      token_info: {
        access_token: accessToken,
        expires_in: tokenResponse.data.data.expires_in
      },
      request_log: {
        token_request: {
          url: 'https://minigame.zijieapi.com/mgplatform/api/apps/v2/token',
          params: tokenRequestData,
          response: tokenResponse.data
        },
        ecpm_request: {
          url: 'https://minigame.zijieapi.com/mgplatform/api/apps/data/get_ecpm',
          params: ecpmParams,
          response: ecpmResponse.data
        }
      }
    });

  } catch (error) {
    console.error('❌ eCPM流程失败:', error.message);

    if (error.response) {
      console.error('📄 API响应错误:', {
        status: error.response.status,
        data: error.response.data
      });
    }

    res.status(500).json({
      error: '获取eCPM数据失败',
      message: error.message || '网络请求失败',
      code: error.response?.status || 'API_ERROR'
    });
  }
});

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});
// 用户登录API 已在上方实现

// 错误处理中间件
app.use((error, req, res, next) => {
  console.error('服务器错误:', error);
  res.status(500).json({
    error: '内部服务器错误',
    message: error.message
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    error: '接口不存在',
    path: req.url
  });
});

// 初始化数据库并启动服务器
async function startServer() {
  try {
    // 测试数据库连接
    console.log('📡 测试数据库连接...');
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ 数据库连接失败，请检查配置');
      console.log('💡 请确保：');
      console.log('   1. PostgreSQL服务正在运行');
      console.log('   2. .env文件配置正确');
      console.log('   3. 数据库和用户已创建');
      console.log('   4. 运行: node scripts/init-db.js');
      process.exit(1);
    }

    // 启动服务器
    app.listen(PORT, () => {
      console.log(`🚀 服务器运行在端口 ${PORT}`);
      console.log(`📡 Webhook地址: http://localhost:${PORT}/api/douyin/webhook`);
      console.log(`🔍 健康检查: http://localhost:${PORT}/api/health`);
      console.log(`🔐 用户认证: http://localhost:${PORT}/api/user/login`);
      console.log('');
      console.log('📝 默认用户:');
      console.log('   管理员: admin / admin123');
      console.log('   用户: user / user123');
      console.log('   审核员: moderator / mod123');
    });

  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

// 启动服务器
startServer();
