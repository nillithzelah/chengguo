const express = require('express');
const cors = require('cors');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 数据库和模型导入
const { testConnection, sequelize } = require('./config/database');
const defineUserModel = require('./models/User');
const defineGameModel = require('./models/Game');
const defineUserGameModel = require('./models/UserGame');
const defineConversionEventModel = require('./models/ConversionEvent');
const defineTokenModel = require('./models/Token');
const defineUserOpenIdModel = require('./models/UserOpenId');
const defineEntityModel = require('./models/Entity');

// 初始化模型
const User = defineUserModel(sequelize);
const Game = defineGameModel(sequelize);
const UserGame = defineUserGameModel(sequelize);
const ConversionEvent = defineConversionEventModel(sequelize);
const Token = defineTokenModel(sequelize);
const UserOpenId = defineUserOpenIdModel(sequelize);
const Entity = defineEntityModel(sequelize);


// 转化事件回调服务
const conversionCallbackService = require('./services/conversion-callback-service');

// 角色映射：兼容以前的角色类型，默认迁移为内部角色
const roleMapping = {
  'admin': 'admin',
  'super_viewer': 'internal_boss',
  'viewer': 'internal_user_1',
  'user': 'internal_user_1',
  'internal_user': 'internal_user_1',
  'external_user': 'external_user_1',
  'moderator': 'internal_service', // 审核员映射到内部客服
  'clerk': 'steward', // 文员映射到管家
};
// 获取当前用户可以管理的用户ID列表（基于上级关系和创建关系）
async function getManagedUserIds(managerId, sequelize) {
  try {
    const managedIds = new Set();
    const queue = [managerId];

    while (queue.length > 0) {
      const currentId = queue.shift();
      managedIds.add(currentId);

      // 查找所有下级用户（parent_id等于当前用户ID）
      const subordinates = await User.findAll({
        where: { parent_id: currentId },
        attributes: ['id']
      });
      subordinates.forEach(subordinate => {
        if (!managedIds.has(subordinate.id)) {
          queue.push(subordinate.id);
        }
      });

      // 对于客服角色，还要找到自己创建的用户（created_by等于当前用户ID）
      const currentUser = await User.findByPk(managerId);
      if (['internal_service', 'external_service'].includes(getMappedRole(currentUser.role))) {
        const createdUsers = await User.findAll({
          where: { created_by: currentId },
          attributes: ['id']
        });
        createdUsers.forEach(createdUser => {
          if (!managedIds.has(createdUser.id)) {
            queue.push(createdUser.id);
          }
        });
      }
    }

    return Array.from(managedIds);
  } catch (error) {
    console.error('获取管理用户ID列表失败:', error);
    return [managerId]; // 至少返回自己
  }
}

// 获取映射后的角色
function getMappedRole(role) {
  return roleMapping[role] || role;
}

// 获取角色文本显示
function getRoleText(role) {
  const roleTexts = {
    'admin': '管理员',
    'internal_boss': '内部老板',
    'external_boss': '外部老板',
    'internal_service': '内部客服',
    'external_service': '外部客服',
    'internal_user_1': '内部1级用户',
    'internal_user_2': '内部2级用户',
    'internal_user_3': '内部3级用户',
    'external_user_1': '外部1级用户',
    'external_user_2': '外部2级用户',
    'external_user_3': '外部3级用户',
    'programmer': '程序员',
    'steward': '管家'
  };
  return roleTexts[role] || role;
}

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

// 用户自关联：创建者
User.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'userCreator',
  targetKey: 'id'
});

// 用户自关联：上级用户
User.belongsTo(User, {
  foreignKey: 'parent_id',
  as: 'parentUser',
  targetKey: 'id'
});

// 主体关联：分配用户
Entity.belongsTo(User, {
  foreignKey: 'assigned_user_id',
  as: 'assignedUser',
  targetKey: 'id'
});

// 用户OpenID关联
User.hasMany(UserOpenId, {
  foreignKey: 'user_id',
  as: 'openIds',
  onDelete: 'CASCADE'
});

UserOpenId.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
  onDelete: 'CASCADE'
});

// JWT secret key - 强制要求环境变量，必须设置强密钥
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('❌ 请设置JWT_SECRET环境变量');
  process.exit(1);
}

// 抖音API Token管理 - 从数据库加载
let adAccessToken = null; // 广告投放access_token
let adRefreshToken = null; // 广告投放refresh_token
let adTokenLastRefresh = null; // 广告投放token最后刷新时间
let adTokenExpiresAt = null; // 广告投放token过期时间

// Token刷新历史记录文件
const TOKEN_LOG_FILE = path.join(__dirname, 'token-refresh-history.log');

// 流量主金额存储文件
const TRAFFIC_MASTER_FILE = path.join(__dirname, 'traffic-master-amounts.json');

// 虚假ECPM数据缓存文件
const FAKE_ECPM_CACHE_FILE = path.join(__dirname, 'fake-ecpm-cache.json');

// 记录token刷新历史
function logTokenRefresh(accessToken, refreshToken, expiresIn, refreshTime) {
  const logEntry = {
    timestamp: refreshTime.toISOString(),
    timestamp_cn: refreshTime.toLocaleString('zh-CN'),
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: expiresIn,
    expires_at: expiresIn ? new Date(refreshTime.getTime() + expiresIn * 1000).toISOString() : null
  };

  const logLine = JSON.stringify(logEntry, null, 2) + '\n---\n';

  try {
    fs.appendFileSync(TOKEN_LOG_FILE, logLine);
  } catch (error) {
    console.error('❌ 记录token历史失败:', error);
  }
}

// 读取流量主金额数据
function loadTrafficMasterAmounts() {
  try {
    if (fs.existsSync(TRAFFIC_MASTER_FILE)) {
      const data = fs.readFileSync(TRAFFIC_MASTER_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('❌ 读取流量主金额失败:', error);
  }
  return {};
}

// 保存流量主金额数据
function saveTrafficMasterAmounts(data) {
  try {
    fs.writeFileSync(TRAFFIC_MASTER_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ 保存流量主金额失败:', error);
    return false;
  }
}

// 读取虚假ECPM数据缓存
function loadFakeEcpmCache() {
  try {
    if (fs.existsSync(FAKE_ECPM_CACHE_FILE)) {
      const data = fs.readFileSync(FAKE_ECPM_CACHE_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('❌ 读取虚假ECPM数据缓存失败:', error);
  }
  return {};
}

// 保存虚假ECPM数据缓存
function saveFakeEcpmCache(data) {
  try {
    fs.writeFileSync(FAKE_ECPM_CACHE_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ 保存虚假ECPM数据缓存失败:', error);
    return false;
  }
}

// 获取缓存的虚假ECPM数据
function getCachedFakeEcpmData(appId, queryDate = null) {
  const cache = loadFakeEcpmCache();
  const cacheKey = queryDate ? `${appId}_${queryDate}` : `${appId}_all`;

  const cachedData = cache[cacheKey];
  if (cachedData) {
    // 检查缓存是否过期（24小时）
    const cacheTime = new Date(cachedData.timestamp);
    const now = new Date();
    const hoursDiff = (now - cacheTime) / (1000 * 60 * 60);

    if (hoursDiff < 24) {
      console.log(`✅ 使用缓存的虚假ECPM数据: ${cacheKey}, 缓存时间: ${cacheTime.toLocaleString()}`);
      return cachedData.data;
    } else {
      console.log(`⏰ 缓存过期，删除旧缓存: ${cacheKey}`);
      delete cache[cacheKey];
      saveFakeEcpmCache(cache);
    }
  }

  return null;
}

// 保存虚假ECPM数据到缓存
function setCachedFakeEcpmData(appId, queryDate = null, data) {
  const cache = loadFakeEcpmCache();
  const cacheKey = queryDate ? `${appId}_${queryDate}` : `${appId}_all`;

  cache[cacheKey] = {
    data: data,
    timestamp: new Date().toISOString(),
    appId: appId,
    queryDate: queryDate
  };

  const success = saveFakeEcpmCache(cache);
  if (success) {
    console.log(`💾 虚假ECPM数据已缓存: ${cacheKey}, 记录数: ${data.length}`);
  }

  return success;
}

// 获取指定应用和日期的流量主金额
function getTrafficMasterAmount(appId, date) {
  const data = loadTrafficMasterAmounts();
  const key = `${appId}_${date}`;
  return data[key] || '0.00';
}

// 设置指定应用和日期的流量主金额
function setTrafficMasterAmount(appId, date, amount) {
  const data = loadTrafficMasterAmounts();
  const key = `${appId}_${date}`;
  data[key] = {
    amount: amount,
    updated_at: new Date().toISOString()
  };
  return saveTrafficMasterAmounts(data);
}

// 从数据库加载token
async function loadTokensFromDatabase() {
  try {
    console.log('📡 从数据库加载token...');

    const accessTokenRecord = await Token.getActiveToken('access_token');
    const refreshTokenRecord = await Token.getActiveToken('refresh_token');

    if (accessTokenRecord) {
      adAccessToken = accessTokenRecord.token_value;
      adTokenExpiresAt = accessTokenRecord.expires_at ? new Date(accessTokenRecord.expires_at) : null;
      console.log('✅ 加载广告投放access_token成功');
    } else {
      console.log('⚠️ 未找到活跃的广告投放access_token');
    }

    if (refreshTokenRecord) {
      adRefreshToken = refreshTokenRecord.token_value;
      adTokenLastRefresh = refreshTokenRecord.last_refresh_at || new Date();
      console.log('✅ 加载广告投放refresh_token成功');
    } else {
      console.log('⚠️ 未找到活跃的广告投放refresh_token');
    }

    // 记录服务器启动时的初始token状态
    if (adAccessToken && adRefreshToken) {
      const startupTime = new Date();
      logTokenRefresh(adAccessToken, adRefreshToken, null, startupTime);
    }

    // 如果没有找到token，初始化默认token
    if (!accessTokenRecord || !refreshTokenRecord) {
      console.log('🔄 初始化默认token...');
      await Token.initDefaultTokens();
      // 重新加载
      return await loadTokensFromDatabase();
    }

  } catch (error) {
    console.error('❌ 加载token失败:', error);
    // 如果数据库加载失败，使用默认值作为fallback
    console.log('🔄 使用默认token作为fallback...');
    // Token已在数据库中初始化，无需硬编码默认值
  }
}

// 强制重新加载token（用于更新后立即生效）
async function reloadTokensFromDatabase() {
  console.log('🔄 强制重新加载token...');
  await loadTokensFromDatabase();
}

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 日志级别控制
const LOG_LEVEL = process.env.LOG_LEVEL || 'info'; // debug, info, warn, error

// 日志函数
const logger = {
  debug: (message, ...args) => {
    if (['debug', 'info'].includes(LOG_LEVEL)) {
      console.log(`🐛 [DEBUG] ${message}`, ...args);
    }
  },
  info: (message, ...args) => {
    if (['debug', 'info'].includes(LOG_LEVEL)) {
      console.log(`ℹ️  [INFO] ${message}`, ...args);
    }
  },
  warn: (message, ...args) => {
    if (['debug', 'info', 'warn'].includes(LOG_LEVEL)) {
      console.warn(`⚠️  [WARN] ${message}`, ...args);
    }
  },
  error: (message, ...args) => {
    console.error(`❌ [ERROR] ${message}`, ...args);
  }
};

// 日志中间件
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.headers['user-agent']?.substring(0, 100)
  });
  next();
});

// 认证中间件
const authenticateJWT = (req, res, next) => {
  console.log(`🔐 [AUTH] ${req.method} ${req.url} - 检查认证头`);
  console.log(`🔐 [AUTH] Authorization 头:`, req.headers.authorization ? '存在' : '不存在');

  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    console.log(`🔐 [AUTH] Token 前缀:`, authHeader.split(' ')[0]);
    console.log(`🔐 [AUTH] Token 长度:`, token ? token.length : 0);

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        console.error('❌ [AUTH] JWT验证失败:', err.message);
        console.error('❌ [AUTH] Token 内容:', token.substring(0, 50) + '...');
        return res.status(403).json({
          code: 403,
          message: 'Token验证失败',
          error: err.message
        });
      }
      console.log(`✅ [AUTH] JWT验证成功，用户:`, user.username);
      req.user = user;
      next();
    });
  } else {
    console.warn('❌ [AUTH] 缺少认证头');
    return res.status(401).json({
      code: 401,
      message: '缺少认证头，请提供有效的JWT token'
    });
  }
};

// 权限检查中间件
const requireRoles = (allowedRoles) => {
  return (req, res, next) => {
    const currentUser = req.user;
    if (!currentUser) {
      return errorResponse(res, 401, '未认证', null, 50008);
    }

    const mappedRole = getMappedRole(currentUser.role);
    if (!allowedRoles.includes(mappedRole)) {
      return errorResponse(res, 403, '权限不足', null, 403);
    }

    next();
  };
};

// 管理员权限检查中间件
const requireAdmin = requireRoles(['admin']);

// 管理员和老板权限检查中间件
const requireAdminOrBoss = requireRoles(['admin', 'internal_boss', 'external_boss']);

// 管理员、老板、客服和管家权限检查中间件
const requireManagementRoles = requireRoles(['admin', 'internal_boss', 'external_boss', 'internal_service', 'external_service', 'steward']);

// 程序员权限检查中间件（只能访问主体管理）
const requireProgrammer = requireRoles(['admin', 'programmer', 'steward']);

// 用户登录
app.post('/api/user/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return errorResponse(res, 400, '用户名和密码不能为空', null, 400);
    }

    logger.info('用户登录尝试:', { username });

    // 从数据库查找用户
    const user = await User.findByUsername(username);

    if (!user) {
      logger.warn('登录失败 - 用户不存在:', { username });
      return errorResponse(res, 401, '用户名或密码错误', null, 50008);
    }

    // 验证密码
    const isValidPassword = await user.validatePassword(password);

    if (!isValidPassword) {
      logger.warn('登录失败 - 密码错误:', { username });
      return errorResponse(res, 401, '用户名或密码错误', null, 50008);
    }

    // 检查用户是否激活
    if (!user.is_active) {
      logger.warn('登录失败 - 账号已禁用:', { username });
      return errorResponse(res, 401, '账号已被禁用', null, 50008);
    }

    // 更新最后登录时间
    await User.updateLastLogin(user.id);

    // 生成token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    logger.info('用户登录成功:', { username });

    return successResponse(res, {
      token,
      userInfo: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        avatar: user.avatar
      }
    }, '登录成功');

  } catch (error) {
    logger.error('登录过程发生错误:', error);
    return errorResponse(res, 500, '服务器内部错误', error, 500);
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
app.post('/api/user/create', authenticateJWT, async (req, res) => {
  try {
    const currentUser = req.user;
    const { username, password, name, role, parent_id } = req.body;

    if (!username || !password || !name) {
      return errorResponse(res, 400, '用户名、密码和显示名称不能为空', null, 400);
    }

    // 检查用户名是否已存在
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return errorResponse(res, 400, '用户名已存在', null, 400);
    }

    // 验证上级用户选择
    let validatedParentId = null;
    if (parent_id) {
      const parentUser = await User.findByPk(parent_id);
      if (!parentUser) {
        return errorResponse(res, 400, '指定的上级用户不存在', null, 400);
      }

      // 验证上级用户权限和级别关系
      const currentUserRole = currentUser.role;
      const targetRole = role;
      const parentRole = parentUser.role;

      // 根据角色级别验证上级关系
      if (targetRole === 'internal_user_1' || targetRole === 'external_user_1') {
        // 1级用户上级必须是客服
        if (!['internal_service', 'external_service'].includes(parentRole)) {
          return errorResponse(res, 400, '1级用户的上级必须是客服', null, 400);
        }
      } else if (targetRole === 'internal_user_2' || targetRole === 'external_user_2') {
        // 2级用户上级必须是1级用户
        const expectedParentRole = targetRole === 'internal_user_2' ? 'internal_user_1' : 'external_user_1';
        if (parentRole !== expectedParentRole) {
          return errorResponse(res, 400, '2级用户的上级必须是1级用户', null, 400);
        }
      } else if (targetRole === 'internal_user_3' || targetRole === 'external_user_3') {
        // 3级用户上级必须是2级用户
        const expectedParentRole = targetRole === 'internal_user_3' ? 'internal_user_2' : 'external_user_2';
        if (parentRole !== expectedParentRole) {
          return errorResponse(res, 400, '3级用户的上级必须是2级用户', null, 400);
        }
      }

      validatedParentId = parent_id;
    } else {
      // 如果没有指定上级，根据角色自动设置
      if (role === 'internal_user_1' || role === 'external_user_1') {
        // 1级用户默认上级是当前用户（如果是客服）
        if (['internal_service', 'external_service'].includes(currentUser.role)) {
          validatedParentId = currentUser.userId;
        } else {
          return errorResponse(res, 400, '创建1级用户需要指定客服作为上级', null, 400);
        }
      } else if (role === 'internal_user_2' || role === 'external_user_2') {
        return errorResponse(res, 400, '创建2级用户必须指定1级用户作为上级', null, 400);
      } else if (role === 'internal_user_3' || role === 'external_user_3') {
        return errorResponse(res, 400, '创建3级用户必须指定2级用户作为上级', null, 400);
      }
    }

    // 创建新用户，记录创建者和上级
    const newUser = await User.createUser({
      username,
      password,
      name,
      role: role || 'external_user_1',
      created_by: currentUser.userId,
      parent_id: validatedParentId
    });

    logger.info('新用户创建成功:', {
      username,
      role,
      parentId: validatedParentId,
      createdBy: currentUser.username
    });

    return successResponse(res, {
      id: newUser.id,
      username: newUser.username,
      name: newUser.name,
      role: newUser.role,
      parent_id: newUser.parent_id,
      created_at: newUser.created_at
    }, '用户创建成功');

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

// 以下接口已被移除，因为只返回空数据，无实际业务价值：
// - /api/user/my-project/list
// - /api/user/latest-activity
// - /api/user/my-team/list
// - /api/user/certification

// 更新用户 (仅管理员)
app.put('/api/user/update/:id', authenticateJWT, async (req, res) => {
  try {
    const currentUser = req.user;
    const { id } = req.params;
    const { name, email, role, is_active, password } = req.body;

    // 检查权限：只有管理员和老板可以更新用户
    const mappedRole = getMappedRole(currentUser.role);
    const allowedRoles = ['admin', 'internal_boss', 'external_boss', 'steward'];
    if (!allowedRoles.includes(mappedRole)) {
      return res.status(403).json({
        code: 403,
        message: '权限不足，只有管理员和老板可以更新用户信息'
      });
    }

    // 不允许修改自己的角色
    if (parseInt(id) === currentUser.userId && role && role !== currentUser.role) {
      return res.status(400).json({
        code: 400,
        message: '不能修改自己的角色'
      });
    }

    // 管家不能修改管理员的信息
    if (mappedRole === 'steward' && user.role === 'admin') {
      return res.status(403).json({
        code: 403,
        message: '权限不足，不能修改管理员信息'
      });
    }

    // 管家不能将用户角色设置为管理员
    if (mappedRole === 'steward' && role === 'admin') {
      return res.status(403).json({
        code: 403,
        message: '权限不足，不能将用户角色设置为管理员'
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

    // 更新用户信息
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined && email.trim() !== '') updateData.email = email.trim();
    if (role !== undefined) updateData.role = role;
    if (is_active !== undefined) updateData.is_active = is_active;

    // 处理上级用户ID
    if (req.body.parent_id !== undefined) {
      if (req.body.parent_id === null || req.body.parent_id === '') {
        updateData.parent_id = null;
      } else {
        updateData.parent_id = parseInt(req.body.parent_id);
      }
    }

    // 如果提供了密码，则更新密码
    if (password && password.trim()) {
      if (password.length < 6) {
        return res.status(400).json({
          code: 400,
          message: '密码长度至少6位'
        });
      }
      // 直接生成密码哈希，避免实例方法问题
      const bcrypt = require('bcrypt');
      const saltRounds = 10;
      updateData.password_hash = await bcrypt.hash(password, saltRounds);
      updateData.password_plain = password; // 保存明文密码用于显示
    }

    await user.update(updateData);

    console.log(`管理员 ${currentUser.username} 更新了用户 ${user.username} 的信息`);

    res.json({
      code: 20000,
      data: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
        updated_at: user.updated_at
      },
      message: '用户信息更新成功'
    });

  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// 删除用户 (仅管理员)
app.delete('/api/user/delete/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    // 检查权限：只有管理员可以删除用户
    const originalRole = currentUser.role;
    if (originalRole !== 'admin' && originalRole !== 'steward') {
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

    // 管家不能删除管理员
    if (originalRole === 'steward' && user.role === 'admin') {
      return res.status(403).json({
        code: 403,
        message: '权限不足，不能删除管理员'
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
app.get('/api/user/list', authenticateJWT, requireManagementRoles, async (req, res) => {
  try {
    const currentUser = req.user;
    logger.info('用户列表查询请求:', { userId: currentUser.userId, username: currentUser.username, role: currentUser.role });

    // 根据用户角色过滤用户数据
    let whereCondition = {};

    // 获取映射后的角色
    const mappedRole = getMappedRole(currentUser.role);

    // admin、internal_boss、external_boss可以看到所有用户
    if (['admin', 'internal_boss', 'external_boss', 'steward'].includes(mappedRole)) {
      // 不添加任何过滤条件，查看所有用户
      console.log('✅ 用户列表API - admin/boss权限，查看所有用户');
    } else if (['internal_service', 'external_service'].includes(mappedRole)) {
      // internal_service和external_service只能看到自己创建的用户，以及这些用户创建的用户（递归）
      const managedUserIds = await getManagedUserIds(currentUser.userId, sequelize);
      whereCondition = {
        id: {
          [sequelize.Sequelize.Op.in]: managedUserIds
        }
      };
      console.log('✅ 用户列表API - service权限，查看自己创建的用户及其下级用户');
    } else {
      // 其他角色不能查看用户列表（虽然前端已经过滤，但这里再加一层保护）
      console.log('❌ 用户列表API - 权限不足，拒绝访问');
      return res.status(403).json({
        code: 403,
        message: '权限不足'
      });
    }

    // 获取用户列表，包含创建者和上级信息
    const users = await User.findAll({
      where: whereCondition,
      attributes: ['id', 'username', 'name', 'email', 'role', 'is_active', 'last_login_at', 'created_at', 'password_plain', 'created_by', 'parent_id'],
      include: [{
        model: User,
        as: 'userCreator',
        attributes: ['username', 'name'],
        required: false
      }, {
        model: User,
        as: 'parentUser',
        attributes: ['username', 'name', 'role'],
        required: false
      }],
      order: [['created_at', 'DESC']]
    });

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
      created_by: user.created_by,
      parent_id: user.parent_id,
      creator_name: user.userCreator ? (user.userCreator.name || user.userCreator.username) : '系统',
      parent_name: user.parentUser ? `${user.parentUser.name || user.parentUser.username} (${getRoleText(user.parentUser.role)})` : '无',
      password: '******' // 隐藏密码信息
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
    // 检查权限：管理员、老板和客服可以查看任何用户的游戏列表，普通用户只能查看自己的
    const mappedRole = getMappedRole(currentUser.role);
    const allowedRoles = ['admin', 'internal_boss', 'external_boss', 'internal_service', 'external_service', 'steward'];
    if (!allowedRoles.includes(mappedRole) && parseInt(userId) !== currentUser.userId) {
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
        g.advertiser_id as "game.advertiser_id", g.promotion_id as "game.promotion_id",
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
        advertiser_id: item['game.advertiser_id'],
        promotion_id: item['game.promotion_id'],
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

    logger.info(`管理员 ${currentUser.username} 查看用户 ${targetUser.username} 的游戏列表`);

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

   // 检查权限：管理员、老板和客服可以分配游戏权限
   const mappedRole = getMappedRole(currentUser.role);
   const allowedRoles = ['admin', 'internal_boss', 'external_boss', 'internal_service', 'external_service','steward'];
   if (!allowedRoles.includes(mappedRole)) {
     return res.status(403).json({
       code: 403,
       message: '权限不足，只有管理员、老板和客服可以分配游戏权限'
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

     logger.info(`管理员 ${currentUser.username} 更新用户 ${targetUser.username} 的游戏 ${game.name} 权限为 ${role}`);
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

     logger.info(`管理员 ${currentUser.username} 为用户 ${targetUser.username} 分配游戏 ${game.name}，权限：${role}`);
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

   // 检查权限：管理员、老板和客服可以移除游戏权限
   const mappedRole = getMappedRole(currentUser.role);
   const allowedRoles = ['admin', 'internal_boss', 'external_boss', 'internal_service', 'external_service','steward'];
   if (!allowedRoles.includes(mappedRole)) {
     return res.status(403).json({
       code: 403,
       message: '权限不足，只有管理员、老板和客服可以移除游戏权限'
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
     logger.info(`管理员 ${currentUser.username} 移除了用户 ${targetUser.username} 的游戏 ${game.name} 权限`);
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

    // 检查权限：只有管理员和老板可以查看游戏用户列表
    const mappedRole = getMappedRole(currentUser.role);
    const allowedRoles = ['admin', 'internal_boss', 'external_boss','steward'];
    if (!allowedRoles.includes(mappedRole)) {
      return res.status(403).json({
        code: 403,
        message: '权限不足，只有管理员和老板可以查看游戏用户列表'
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
          appid: game.appid,
          advertiser_id: game.advertiser_id,
          promotion_id: game.promotion_id
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

    // 检查权限：只有管理员和老板可以查看游戏所有者信息
    const mappedRole = getMappedRole(currentUser.role);
    const allowedRoles = ['admin', 'internal_boss', 'external_boss','steward'];
    if (!allowedRoles.includes(mappedRole)) {
      return res.status(403).json({
        code: 403,
        message: '权限不足，只有管理员和老板可以查看游戏所有者信息'
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
    const pageType = req.query.page_type || 'user'; // 默认是用户页面

    const mappedRole = getMappedRole(currentUser.role);
    if (mappedRole === 'admin' || mappedRole === 'steward') {
      // 只有管理员可以看到所有游戏，但根据页面类型过滤状态
      let whereCondition = {};

      // 根据页面类型过滤游戏状态
      if (pageType === 'gray') {
        // 灰游页面：只显示状态为 'gray' 的游戏
        whereCondition.status = 'gray';
      } else if (pageType === 'active') {
        // 白游页面：只显示状态为 'active' 的游戏
        whereCondition.status = 'active';
      }
      // 如果是 'user' 或其他值，不设置status过滤，显示所有游戏

      const games = await Game.findAll({
        where: whereCondition,
        attributes: ['id', 'appid', 'name', 'description', 'status', 'validated', 'created_at', 'app_secret', 'advertiser_id', 'promotion_id'],
        order: [['created_at', 'DESC']]
      });

      // 为每个游戏添加主体信息
      const gamesWithEntities = await Promise.all(games.map(async (game) => {
        try {
          // 查询与该游戏关联的主体
          const entities = await Entity.findAll({
            where: { game_name: game.name },
            attributes: ['name'],
            order: [['created_at', 'DESC']]
          });

          const gameData = game.toJSON();
          if (entities && entities.length > 0) {
            gameData.entity_names = entities.map(entity => entity.name).join('、');
          } else {
            gameData.entity_names = null; // 明确设置为null表示无主体
          }

          return gameData;
        } catch (error) {
          console.error(`获取游戏 ${game.name} 的主体信息失败:`, error);
          const gameData = game.toJSON();
          gameData.entity_names = null; // 出错时也设置为null
          return gameData;
        }
      }));

      res.json({
        code: 20000,
        data: {
          games: gamesWithEntities,
          total: gamesWithEntities.length
        },
        message: '获取游戏列表成功'
      });
    } else {
      // 老板和普通用户只能看到自己有权限的游戏
      let gameWhereCondition = {};

      // 根据页面类型过滤游戏状态
      if (pageType === 'gray') {
        // 灰游页面：只显示状态为 'gray' 的游戏
        gameWhereCondition.status = 'gray';
      } else if (pageType === 'active') {
        // 白游页面：只显示状态为 'active' 的游戏
        gameWhereCondition.status = 'active';
      }
      // 如果是 'user' 或其他值，不设置status过滤，显示所有游戏

      const userGames = await UserGame.findAll({
        where: { user_id: currentUser.userId },
        include: [{
          model: Game,
          as: 'game',
          where: gameWhereCondition,
          required: true,
          attributes: ['id', 'appid', 'name', 'description', 'status', 'validated', 'created_at', 'app_secret', 'advertiser_id', 'promotion_id']
        }],
        order: [['assigned_at', 'DESC']]
      });

      // 提取游戏信息并添加主体信息
      const gamesWithEntities = await Promise.all(userGames.map(async (userGame) => {
        const game = userGame.game;
        try {
          // 查询与该游戏关联的主体
          const entities = await Entity.findAll({
            where: { game_name: game.name },
            attributes: ['name'],
            order: [['created_at', 'DESC']]
          });

          const gameData = game.toJSON();
          if (entities && entities.length > 0) {
            gameData.entity_names = entities.map(entity => entity.name).join('、');
          } else {
            gameData.entity_names = null; // 明确设置为null表示无主体
          }

          return gameData;
        } catch (error) {
          console.error(`获取游戏 ${game.name} 的主体信息失败:`, error);
          const gameData = game.toJSON();
          gameData.entity_names = null; // 出错时也设置为null
          return gameData;
        }
      }));

      res.json({
        code: 20000,
        data: {
          games: gamesWithEntities,
          total: gamesWithEntities.length
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
    const currentUser = req.user;
    const { id } = req.params;

    // 检查权限：只有管理员可以删除游戏
    const mappedRole = getMappedRole(currentUser.role);
    if (mappedRole !== 'admin' && mappedRole !== 'steward') {
      logger.warn('删除游戏权限不足:', { userRole: currentUser.role, mappedRole, requiredRole: 'admin' });
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
      logger.info(`删除了 ${userGameCount} 条用户游戏权限记录`);
    }

    // 删除游戏
    await game.destroy();

    logger.info(`管理员 ${currentUser.username} 删除了游戏 ${game.name} (ID: ${id})`);

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
    const { name, appid, appSecret, description, advertiser_id, promotion_id } = req.body;

    // 检查权限：只有管理员可以创建游戏
    const mappedRole = getMappedRole(currentUser.role);
    if (mappedRole !== 'admin' && mappedRole !== 'steward') {
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
      advertiser_id: advertiser_id || null, // 可选参数
      promotion_id: promotion_id || null,   // 可选参数
      status: 'active',
      validated: true, // 前端已经验证过
      validatedAt: new Date()
    });

    logger.info(`管理员 ${currentUser.username} 创建了新游戏: ${name} (App ID: ${appid})`);

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

// 更新游戏 (仅管理员)
app.put('/api/game/update/:id', authenticateJWT, async (req, res) => {
  try {
    const currentUser = req.user;
    const { id } = req.params;
    const { name, appid, appSecret, description, advertiser_id, promotion_id } = req.body;

    logger.info(`🔄 开始更新游戏 - ID: ${id}, 用户: ${currentUser.username}, 角色: ${currentUser.role}`);
    logger.debug('📝 请求数据:', { name, appid, appSecret: appSecret ? '***' : '', description, advertiser_id, promotion_id });

    // 检查权限：只有管理员可以更新游戏
    const mappedRole = getMappedRole(currentUser.role);
    logger.debug(`🔐 用户角色映射: ${currentUser.role} -> ${mappedRole}`);

    if (mappedRole !== 'admin' && mappedRole !== 'steward') {
      logger.warn(`❌ 权限不足 - 用户 ${currentUser.username} 尝试更新游戏但角色不是管理员`);
      return res.status(403).json({
        code: 403,
        message: '权限不足，只有管理员可以更新游戏'
      });
    }

    // 查找游戏
    const game = await Game.findByPk(id);
    if (!game) {
      logger.warn(`❌ 游戏不存在 - ID: ${id}`);
      return res.status(404).json({
        code: 404,
        message: '游戏不存在'
      });
    }

    logger.info(`📋 找到游戏: ${game.name} (AppID: ${game.appid})`);

    // 如果App ID改变，检查是否与其他游戏冲突
    if (appid && appid !== game.appid) {
      logger.debug(`🔍 检查AppID冲突: ${appid}`);
      const existingGame = await Game.findByAppId(appid);
      if (existingGame && existingGame.id !== parseInt(id)) {
        logger.warn(`❌ AppID已存在: ${appid}`);
        return res.status(400).json({
          code: 400,
          message: '该App ID已存在，请使用不同的App ID'
        });
      }
    }

    // 更新游戏信息
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (appid !== undefined) updateData.appid = appid;
    if (appSecret !== undefined) updateData.appSecret = appSecret;
    if (description !== undefined) updateData.description = description;
    if (advertiser_id !== undefined) updateData.advertiser_id = advertiser_id || null;
    if (promotion_id !== undefined) updateData.promotion_id = promotion_id || null;
    if (req.body.status !== undefined) updateData.status = req.body.status;

    logger.debug('📝 准备更新数据:', updateData);

    // 如果appid和appSecret都填写了，则设置为已验证状态
    if ((appid !== undefined && appid.trim()) && (appSecret !== undefined && appSecret.trim())) {
      // 如果是临时值开头，则保持未验证状态
      if (appid.startsWith('temp_') && appSecret.startsWith('temp_secret_')) {
        updateData.validated = false;
        updateData.validatedAt = null;
        logger.debug('🔄 临时值，保持未验证状态');
      } else {
        updateData.validated = true;
        updateData.validatedAt = new Date();
        logger.debug('✅ 设置为已验证状态');
      }
    }

    logger.info(`💾 执行数据库更新...`);
    const updatedGame = await game.update(updateData);
    logger.info(`✅ 数据库更新成功 - 游戏: ${updatedGame.name} (ID: ${id})`);

    logger.info(`🎉 游戏更新完成 - 管理员 ${currentUser.username} 更新了游戏: ${game.name} (ID: ${id})`);

    res.json({
      code: 20000,
      data: {
        game: updatedGame.toFrontendFormat()
      },
      message: '游戏更新成功'
    });

  } catch (error) {
    logger.error('❌ 更新游戏错误:', error);
    logger.error('📋 错误详情:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    // 检查是否是数据库相关错误
    if (error.name === 'SequelizeValidationError') {
      logger.error('🔍 Sequelize验证错误:', error.errors);
      return res.status(400).json({
        code: 400,
        message: '数据验证失败',
        details: error.errors.map(e => e.message)
      });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      logger.error('🔍 唯一约束错误:', error.errors);
      return res.status(400).json({
        code: 400,
        message: '数据冲突，请检查输入的数据'
      });
    }

    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

// 获取所有用户的基本信息 (仅管理员，用于用户选择器)
app.get('/api/user/basic-list', authenticateJWT, async (req, res) => {
  try {
    const currentUser = req.user;

    // 检查权限：管理员、老板和客服可以查看用户列表（排除普通用户）
    const mappedRole = getMappedRole(currentUser.role);
    const allowedRoles = ['admin', 'internal_boss', 'external_boss', 'internal_service', 'external_service', 'steward'];
    if (!allowedRoles.includes(mappedRole)) {
      return res.status(403).json({
        code: 403,
        message: '权限不足，只有管理员、老板和客服可以查看用户列表'
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

// 获取分配用户选项 (用于主体管理)
app.get('/api/user/assigned-options', authenticateJWT, async (req, res) => {
  try {
    const currentUser = req.user;

    // 检查权限：管理员、老板和客服可以查看分配用户选项
    const mappedRole = getMappedRole(currentUser.role);
    const allowedRoles = ['admin','programmer', 'internal_boss', 'external_boss', 'internal_service', 'external_service','steward'];
    if (!allowedRoles.includes(mappedRole)) {
      return res.status(403).json({
        code: 403,
        message: '权限不足，只有管理员、老板和客服可以查看分配用户选项'
      });
    }

    // 获取所有活跃的老板用户（internal_boss 和 external_boss）
    const bossUsers = await User.findAll({
      where: {
        is_active: true,
        role: ['internal_boss', 'external_boss']
      },
      attributes: ['id', 'username', 'name', 'role'],
      order: [['username', 'ASC']]
    });

    res.json({
      code: 20000,
      data: {
        users: bossUsers,
        total: bossUsers.length
      },
      message: '获取分配用户选项成功'
    });

  } catch (error) {
    console.error('获取分配用户选项错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// 获取程序员选项 (用于主体管理)
app.get('/api/entity/programmer-options', authenticateJWT, async (req, res) => {
  try {
    const currentUser = req.user;

    // 检查权限：管理员、老板和客服可以查看程序员选项
    const mappedRole = getMappedRole(currentUser.role);
    const allowedRoles = ['admin', 'internal_boss', 'external_boss', 'internal_service', 'external_service','steward'];
    if (!allowedRoles.includes(mappedRole)) {
      return res.status(403).json({
        code: 403,
        message: '权限不足，只有管理员、老板和客服可以查看程序员选项'
      });
    }

    // 程序员选项列表
    const programmerOptions = [
      { value: '冯', label: '冯' },
      { value: '张', label: '张' }
    ];

    res.json({
      code: 20000,
      data: {
        programmers: programmerOptions,
        total: programmerOptions.length
      },
      message: '获取程序员选项成功'
    });

  } catch (error) {
    console.error('获取程序员选项错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});
// 创建主体
app.post('/api/entity/create', authenticateJWT, async (req, res) => {
  try {
    const currentUser = req.user;
    const { name, programmer, manager, assigned_user_id, game_name, account_name } = req.body;

    // 检查权限：管理员和程序员可以创建主体
    const mappedRole = getMappedRole(currentUser.role);
    if (mappedRole !== 'admin' && mappedRole !== 'programmer' && mappedRole !== 'steward') {
      return res.status(403).json({
        code: 403,
        message: '权限不足，只有管理员和程序员可以创建主体'
      });
    }

    // 验证必填字段
    if (!name) {
      return res.status(400).json({
        code: 400,
        message: '主体名称不能为空'
      });
    }

    // 检查主体名称是否已存在（新增主体时不能同名）
    const existingEntity = await Entity.findOne({
      where: { name: name.trim() }
    });
    if (existingEntity) {
      return res.status(400).json({
        code: 400,
        message: '该主体名称已存在，请使用不同的名称'
      });
    }

    // 验证分配用户ID（必须是老板角色）
    if (assigned_user_id) {
      const assignedUser = await User.findByPk(assigned_user_id);
      if (!assignedUser) {
        return res.status(400).json({
          code: 400,
          message: '指定的分配用户不存在'
        });
      }

      const assignedUserRole = getMappedRole(assignedUser.role);
      if (!['internal_boss', 'external_boss'].includes(assignedUserRole)) {
        return res.status(400).json({
          code: 400,
          message: '分配用户必须是老板角色'
        });
      }
    }

    // 创建主体
    const newEntity = await Entity.create({
      name: name.trim(),
      programmer: programmer ? programmer.trim() : '',
      manager: manager ? manager.trim() : '',
      account_name: account_name ? account_name.trim() : '',
      game_name: game_name ? game_name.trim() : '',
      development_status: '游戏创建',
      assigned_user_id: assigned_user_id || null,
      is_limited_status: req.body.is_limited_status || false
    });

    logger.info(`用户 ${currentUser.username} 创建了新主体: ${name}, 账号名: ${account_name || '未设置'}, 游戏名称: ${game_name || '未设置'}, 分配给用户ID: ${assigned_user_id || '未分配'}`);

    res.json({
      code: 20000,
      data: {
        entity: newEntity.toFrontendFormat(),
        id: newEntity.id
      },
      message: '主体创建成功'
    });

  } catch (error) {
    console.error('创建主体错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// 更新主体
app.put('/api/entity/update/:id', authenticateJWT, async (req, res) => {
  try {
    const currentUser = req.user;
    const { id } = req.params;
    const { name, programmer, manager, assigned_user_id, account_name } = req.body;

    // 检查权限：管理员和程序员可以更新主体
    const mappedRole = getMappedRole(currentUser.role);
    if (mappedRole !== 'admin' && mappedRole !== 'programmer' && mappedRole !== 'steward') {
      return res.status(403).json({
        code: 403,
        message: '权限不足，只有管理员和程序员可以更新主体'
      });
    }

    // 查找主体
    const entity = await Entity.findByPk(id);
    if (!entity) {
      return res.status(404).json({
        code: 404,
        message: '主体不存在'
      });
    }

    // 如果名称改变，检查同名主体数量是否超过限制（最多5个）
    if (name && name !== entity.name) {
      const existingEntities = await Entity.findByName(name);
      if (existingEntities && existingEntities.length >= 5) {
        return res.status(400).json({
          code: 400,
          message: '该主体名称已达到最大数量限制（最多5个）'
        });
      }
    }

    // 验证分配用户ID（必须是老板角色）
    if (assigned_user_id !== undefined) {
      if (assigned_user_id === null || assigned_user_id === '') {
        // 允许清空分配用户
      } else {
        const assignedUser = await User.findByPk(assigned_user_id);
        if (!assignedUser) {
          return res.status(400).json({
            code: 400,
            message: '指定的分配用户不存在'
          });
        }

        const assignedUserRole = getMappedRole(assignedUser.role);
        if (!['internal_boss', 'external_boss'].includes(assignedUserRole)) {
          return res.status(400).json({
            code: 400,
            message: '分配用户必须是老板角色'
          });
        }
      }
    }

    // 检查开发状态限制
    if (req.body.development_status !== undefined) {
      // 定义开发状态顺序
      const developmentStatuses = [
        '游戏创建',
        '基础/资质进行中',
        '基础/资质已提交',
        '创建流量主',
        '开发/提审进行中',
        '开发/提审已提交',
        '游戏备案进行中',
        '游戏备案已提交',
        'ICP备案进行中',
        'ICP备案已提交',
        '上线运营'
      ];

      const currentIndex = developmentStatuses.indexOf(entity.development_status);
      const newIndex = developmentStatuses.indexOf(req.body.development_status);

      // 如果不是跳过验证的批量操作，才进行状态限制检查
      if (!req.body.skip_status_validation) {
        // 如果主体有限制状态，且新状态超过"游戏备案进行中"，则拒绝更新
        if (entity.is_limited_status && newIndex > developmentStatuses.indexOf('游戏备案进行中')) {
          return res.status(400).json({
            code: 400,
            message: '该主体已开启开发状态限制，最多只能升级到"游戏备案进行中"'
          });
        }

        // 检查状态顺序是否合理（只能升级或降级，不能跳跃）
        if (currentIndex !== -1 && newIndex !== -1 && Math.abs(newIndex - currentIndex) > 1) {
          return res.status(400).json({
            code: 400,
            message: '开发状态只能逐级升级或降级'
          });
        }
      }
    }

    // 更新主体信息
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (programmer !== undefined) updateData.programmer = programmer.trim();
    if (manager !== undefined) updateData.manager = manager ? manager.trim() : '';
    if (account_name !== undefined) updateData.account_name = account_name ? account_name.trim() : '';
    if (req.body.game_name !== undefined) updateData.game_name = req.body.game_name;
    if (req.body.development_status !== undefined) {
      updateData.development_status = req.body.development_status;
      updateData.development_status_updated_at = new Date();
    }
    if (assigned_user_id !== undefined) updateData.assigned_user_id = assigned_user_id || null;
    if (req.body.is_limited_status !== undefined) updateData.is_limited_status = req.body.is_limited_status;

    await entity.update(updateData);

    // 如果开发状态更新为"上线运营"，自动创建游戏记录
    if (req.body.development_status === '上线运营' && entity.game_name) {
      const existingGame = await Game.findOne({
        where: { name: entity.game_name }
      });

      if (!existingGame) {
        // 创建新的游戏记录，使用临时值绕过验证
        await Game.create({
          name: entity.game_name,
          appid: 'temp_' + Date.now(), // 临时appid，使用时间戳避免重复
          appSecret: 'temp_secret_' + Date.now(), // 临时appSecret
          description: `由主体"${entity.name}"自动创建的游戏`,
          status: 'active',
          validated: false, // 未验证状态
          validatedAt: null
        });

        logger.info(`自动创建游戏记录: ${entity.game_name} (由于主体 ${entity.name} 达到上线运营状态)`);
      }
    }

    logger.info(`用户 ${currentUser.username} 更新了主体: ${entity.name} (ID: ${id})`);

    res.json({
      code: 20000,
      data: {
        entity: entity.toFrontendFormat()
      },
      message: '主体更新成功'
    });

  } catch (error) {
    console.error('更新主体错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// 删除主体 (仅管理员)
app.delete('/api/entity/delete/:id', authenticateJWT, async (req, res) => {
  try {
    const currentUser = req.user;
    const { id } = req.params;

    // 检查权限：管理员和程序员可以删除主体
    const mappedRole = getMappedRole(currentUser.role);
    if (mappedRole !== 'admin' && mappedRole !== 'programmer' && mappedRole !== 'steward') {
      return res.status(403).json({
        code: 403,
        message: '权限不足，只有管理员和程序员可以删除主体'
      });
    }

    // 查找主体
    const entity = await Entity.findByPk(id);
    if (!entity) {
      return res.status(404).json({
        code: 404,
        message: '主体不存在'
      });
    }

    // 删除主体
    await entity.destroy();

    logger.info(`管理员 ${currentUser.username} 删除了主体 ${entity.name} (ID: ${id})`);

    res.json({
      code: 20000,
      message: '主体删除成功'
    });

  } catch (error) {
    console.error('删除主体错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// 获取主体列表
app.get('/api/entity/list', authenticateJWT, async (req, res) => {
  try {
    const currentUser = req.user;

    // 检查权限：管理员、内部老板和程序员可以查看主体列表
    const mappedRole = getMappedRole(currentUser.role);
    const allowedRoles = ['admin', 'internal_boss', 'programmer', 'steward'];
    if (!allowedRoles.includes(mappedRole)) {
      return res.status(403).json({
        code: 403,
        message: '权限不足，只有管理员、内部老板和程序员可以查看主体列表'
      });
    }

    // 构建查询条件
    const whereCondition = {};

    // 如果是程序员角色，添加程序员筛选条件
    if (mappedRole === 'programmer') {
      const programmerFilter = req.query.programmer_filter;
      if (programmerFilter) {
        // 解码URL编码的参数
        const decodedProgrammer = decodeURIComponent(programmerFilter);
        whereCondition.programmer = decodedProgrammer;

        logger.info(`👨‍💻 [后端筛选] 程序员 ${currentUser.name || currentUser.username} (角色: ${currentUser.role}) 筛选自己负责的主体: ${decodedProgrammer}`);
      } else {
        // 如果程序员没有提供筛选参数，返回空结果
        logger.warn(`⚠️ [程序员筛选警告] 程序员 ${currentUser.name || currentUser.username} 未提供programmer_filter参数`);
        return res.json({
          code: 20000,
          data: {
            entities: [],
            total: 0
          },
          message: '获取主体列表成功'
        });
      }
    }

    // 获取主体列表，包含分配用户信息
    const entities = await Entity.findAll({
      where: whereCondition,
      include: [{
        model: User,
        as: 'assignedUser',
        attributes: ['id', 'username', 'name', 'role'],
        required: false
      }],
      order: [['created_at', 'DESC']]
    });

    // 格式化数据
    const formattedEntities = entities.map(entity => {
      const frontendFormat = entity.toFrontendFormat();
      // 添加分配用户信息
      if (entity.assignedUser) {
        frontendFormat.assigned_user_name = entity.assignedUser.name || entity.assignedUser.username;
        frontendFormat.assigned_user_role = entity.assignedUser.role;
      } else {
        frontendFormat.assigned_user_name = '未分配';
        frontendFormat.assigned_user_role = null;
      }
      return frontendFormat;
    });

    logger.info(`📊 [主体列表] 返回 ${formattedEntities.length} 条主体记录`);

    res.json({
      code: 20000,
      data: {
        entities: formattedEntities,
        total: formattedEntities.length
      },
      message: '获取主体列表成功'
    });

  } catch (error) {
    console.error('获取主体列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// 为主体分配游戏
app.post('/api/entity/assign-game', authenticateJWT, async (req, res) => {
  try {
    const currentUser = req.user;
    const { entity_id, game_name, programmer, development_status } = req.body;

    // 检查权限：管理员和程序员可以分配游戏给主体
    const mappedRole = getMappedRole(currentUser.role);
    if (mappedRole !== 'admin' && mappedRole !== 'programmer' && mappedRole !== 'steward') {
      return res.status(403).json({
        code: 403,
        message: '权限不足，只有管理员和程序员可以分配游戏给主体'
      });
    }

    // 验证必填参数
    if (!entity_id || !game_name) {
      return res.status(400).json({
        code: 400,
        message: '主体ID和游戏名称不能为空'
      });
    }

    // 验证程序员字段（如果提供的话）
    if (programmer && !['冯', '张'].includes(programmer)) {
      return res.status(400).json({
        code: 400,
        message: '程序员只能选择"冯"或"张"'
      });
    }

    // 验证主体是否存在
    const entity = await Entity.findByPk(entity_id);
    if (!entity) {
      return res.status(404).json({
        code: 404,
        message: '主体不存在'
      });
    }

    // 查找游戏（允许不存在的游戏）
    const game = await Game.findOne({
      where: { name: game_name, status: 'active' }
    });

    // 检查游戏是否已经被分配给任何主体（一个游戏只能出现一次）
    const existingEntityWithGame = await Entity.findOne({
      where: { game_name: game_name }
    });

    if (existingEntityWithGame) {
      // 游戏已经被分配给其他主体，不允许重复分配
      return res.status(400).json({
        code: 400,
        message: `游戏 "${game_name}" 已被其他主体使用，无法重复分配`
      });
    }

    // 检查该主体是否已经分配了5个游戏
    const existingGamesCount = await Entity.count({
      where: {
        name: entity.name
      }
    });

    if (existingGamesCount >= 5) {
      return res.status(400).json({
        code: 400,
        message: `该主体"${entity.name}"已经分配了5个游戏，不能再分配更多游戏`
      });
    }

    // 检查是否已经分配过这个游戏给这个主体
    const existingEntity = await Entity.findOne({
      where: {
        game_name: game_name,
        name: entity.name
      }
    });

    if (existingEntity) {
      return res.status(400).json({
        code: 400,
        message: `游戏"${game_name}"已经分配给主体"${entity.name}"`
      });
    }

    // 创建新的主体记录
    const resultEntity = await Entity.create({
      name: entity.name,
      programmer: programmer || '',
      account_name: entity.account_name || '', // 从原主体复制账号名
      game_name: game_name,
      development_status: development_status || '',
      assigned_user_id: entity.assigned_user_id,
      is_limited_status: entity.is_limited_status || false // 从原主体复制限制状态
    });

    // 如果开发状态是"上线运营"，自动创建游戏记录
    if (development_status === '上线运营') {
      const existingGame = await Game.findOne({
        where: { name: game_name }
      });

      if (!existingGame) {
        // 创建新的游戏记录
        await Game.create({
          name: game_name,
          appid: 'temp_' + Date.now(), // 临时appid，使用时间戳避免重复
          appSecret: 'temp_secret_' + Date.now(), // 临时appSecret
          description: `由主体"${entity.name}"自动创建的游戏`,
          status: 'active',
          validated: false, // 未验证状态
          validatedAt: null
        });

        logger.info(`自动创建游戏记录: ${game_name} (由于主体 ${entity.name} 达到上线运营状态)`);
      }
    }

    logger.info(`管理员 ${currentUser.username} 分配游戏 ${game_name} 给主体 ${entity.name} (当前游戏数量: ${existingGamesCount + 1}/5)`);

    res.json({
      code: 20000,
      data: {
        entity: resultEntity.toFrontendFormat(),
        created_new_entity: true
      },
      message: `成功为主体"${entity.name}"分配游戏"${game_name}" (当前游戏数量: ${existingGamesCount + 1}/5)`
    });

  } catch (error) {
    console.error('分配游戏给主体错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// 移除主体的游戏分配
app.delete('/api/entity/remove-game/:entityId', authenticateJWT, async (req, res) => {
  try {
    const currentUser = req.user;
    const { entityId } = req.params;

    // 检查权限：管理员和程序员可以移除主体的游戏分配
    const mappedRole = getMappedRole(currentUser.role);
    if (mappedRole !== 'admin' && mappedRole !== 'programmer' && mappedRole !== 'steward') {
      return res.status(403).json({
        code: 403,
        message: '权限不足，只有管理员和程序员可以移除主体的游戏分配'
      });
    }

    // 验证主体是否存在
    const entity = await Entity.findByPk(entityId);
    if (!entity) {
      return res.status(404).json({
        code: 404,
        message: '主体不存在'
      });
    }

    // 移除游戏分配
    await entity.update({
      game_name: '',
      updated_at: new Date()
    });

    logger.info(`管理员 ${currentUser.username} 移除了主体 ${entity.name} (ID: ${entityId}) 的游戏分配`);

    res.json({
      code: 20000,
      data: {
        entity: entity.toFrontendFormat()
      },
      message: '游戏分配移除成功'
    });

  } catch (error) {
    console.error('移除主体游戏分配错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// 获取可作为上级用户的列表
app.get('/api/user/parent-options', authenticateJWT, async (req, res) => {
  try {
    const currentUser = req.user;
    const { target_role } = req.query;

    if (!target_role) {
      return res.status(400).json({
        code: 400,
        message: '请提供目标用户角色参数 target_role'
      });
    }

    // 检查权限：只有管理员、老板和客服可以查看上级用户选项
    const mappedRole = getMappedRole(currentUser.role);
    const allowedRoles = ['admin', 'internal_boss', 'external_boss', 'internal_service', 'external_service','steward'];
    if (!allowedRoles.includes(mappedRole)) {
      return res.status(403).json({
        code: 403,
        message: '权限不足'
      });
    }

    let parentRoleFilter = [];
    let whereCondition = { is_active: true };

    // 根据目标角色确定上级角色要求
    if (target_role === 'internal_user_1' || target_role === 'external_user_1') {
      // 1级用户上级必须是客服
      parentRoleFilter = target_role.startsWith('internal_') ? ['internal_service'] : ['external_service'];
    } else if (target_role === 'internal_user_2' || target_role === 'external_user_2') {
      // 2级用户上级必须是1级用户
      parentRoleFilter = target_role.startsWith('internal_') ? ['internal_user_1'] : ['external_user_1'];
    } else if (target_role === 'internal_user_3' || target_role === 'external_user_3') {
      // 3级用户上级必须是2级用户
      parentRoleFilter = target_role.startsWith('internal_') ? ['internal_user_2'] : ['external_user_2'];
    } else if (target_role === 'internal_service' || target_role === 'external_service') {
      // 客服上级必须是老板
      parentRoleFilter = target_role.startsWith('internal_') ? ['internal_boss'] : ['external_boss'];
    } else {
      return res.status(400).json({
        code: 400,
        message: '不支持的角色类型'
      });
    }

    // 限制上级用户的选择范围（当前用户能管理的用户）
    if (mappedRole === 'internal_service') {
      // 内部客服只能选择自己作为上级
      whereCondition.id = currentUser.userId;
    } else if (mappedRole === 'external_service') {
      // 外部客服可以选择外部老板作为上级
      whereCondition.role = parentRoleFilter;
    } else {
      // 管理员、老板可以选择符合条件的任何用户
      whereCondition.role = parentRoleFilter;
    }

    const parentUsers = await User.findAll({
      where: whereCondition,
      attributes: ['id', 'username', 'name', 'role'],
      order: [['username', 'ASC']]
    });

    // 格式化返回数据
    const formattedParents = parentUsers.map(user => ({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      display_name: `${user.name || user.username} (${getRoleText(user.role)})`
    }));

    res.json({
      code: 20000,
      data: {
        parents: formattedParents,
        total: formattedParents.length,
        target_role: target_role
      },
      message: '获取上级用户选项成功'
    });

  } catch (error) {
    console.error('获取上级用户选项错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// 绑定用户OpenID
app.post('/api/user/bind-openid', authenticateJWT, async (req, res) => {
  try {
    const currentUser = req.user;
    const { open_id } = req.body;

    if (!open_id) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要的参数：open_id'
      });
    }

    logger.info(`用户 ${currentUser.username} 请求绑定OpenID: ${open_id}`);

    // 绑定用户和OpenID
    const binding = await UserOpenId.bindUserOpenId(currentUser.userId, open_id);

    logger.info(`用户 ${currentUser.username} 成功绑定OpenID: ${open_id}`);

    res.json({
      code: 20000,
      data: {
        binding: {
          id: binding.id,
          user_id: binding.user_id,
          open_id: binding.open_id,
          bound_at: binding.bound_at
        }
      },
      message: 'OpenID绑定成功'
    });

  } catch (error) {
    console.error('绑定OpenID错误:', error);

    let errorMessage = '绑定失败：服务器内部错误';
    let statusCode = 500;

    if (error.message.includes('已绑定此OpenID')) {
      errorMessage = '❌ 绑定失败：该用户已绑定此OpenID';
      statusCode = 400;
    } else if (error.message.includes('已被其他用户绑定')) {
      errorMessage = '❌ 绑定失败：此OpenID已被其他用户绑定，请联系管理员处理';
      statusCode = 409; // Conflict
    } else if (error.message.includes('OpenID')) {
      errorMessage = `❌ 绑定失败：${error.message}`;
      statusCode = 400;
    }

    res.status(statusCode).json({
      code: statusCode,
      message: errorMessage,
      details: {
        open_id: open_id,
        user_id: currentUser.userId,
        username: currentUser.username
      },
      error: error.message
    });
  }
});

// 解绑用户OpenID
app.delete('/api/user/unbind-openid', authenticateJWT, async (req, res) => {
  try {
    const currentUser = req.user;
    const { open_id, target_user_id } = req.body;

    if (!open_id) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要的参数：open_id'
      });
    }

    logger.info(`用户 ${currentUser.username} 请求解绑OpenID: ${open_id}`);

    // 检查权限：管理员和客服可以解绑任何用户的OpenID，普通用户只能解绑自己的
    const mappedRole = getMappedRole(currentUser.role);
    let targetUserId = currentUser.userId; // 默认解绑自己的

    if (target_user_id) {
      // 如果指定了目标用户ID，检查权限
      const adminRoles = ['admin', 'internal_boss', 'external_boss','steward'];
      const serviceRoles = ['internal_service', 'external_service'];
      if (adminRoles.includes(mappedRole) || serviceRoles.includes(mappedRole)) {
        targetUserId = parseInt(target_user_id);
      } else {
        return res.status(403).json({
          code: 403,
          message: '❌ 权限不足：只有管理员、老板和客服可以解绑其他用户的OpenID'
        });
      }
    }

    // 解绑用户和OpenID
    await UserOpenId.unbindUserOpenId(targetUserId, open_id);

    logger.info(`用户 ${currentUser.username} 成功解绑用户ID ${targetUserId} 的OpenID: ${open_id}`);

    res.json({
      code: 20000,
      message: 'OpenID解绑成功',
      data: {
        target_user_id: targetUserId,
        open_id: open_id,
        unbound_by: currentUser.username
      }
    });

  } catch (error) {
    console.error('解绑OpenID错误:', error);

    let errorMessage = '解绑失败：服务器内部错误';
    let statusCode = 500;

    if (error.message.includes('未找到对应的绑定关系')) {
      errorMessage = '❌ 解绑失败：未找到对应的绑定关系，可能已被其他用户操作或已解绑';
      statusCode = 404;
    } else if (error.message.includes('OpenID')) {
      errorMessage = `❌ 解绑失败：${error.message}`;
      statusCode = 400;
    }

    res.status(statusCode).json({
      code: statusCode,
      message: errorMessage,
      details: {
        open_id: open_id,
        target_user_id: target_user_id || currentUser.userId,
        user_id: currentUser.userId,
        username: currentUser.username
      },
      error: error.message
    });
  }
});

// 根据OpenID查询用户名
app.post('/api/qr-scan/username-by-openid', async (req, res) => {
  try {
    const { open_id, aid, query_type } = req.body;

    logger.debug('根据OpenID查询用户名:', { openId: open_id, aid, query_type });

    if (!open_id) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要的参数：open_id'
      });
    }

    logger.debug('根据OpenID获取用户名:', { openId: open_id, aid, query_type });

    // 从数据库查询绑定关系
    const userOpenId = await UserOpenId.findByOpenId(open_id);

    if (userOpenId && userOpenId.user) {
      const username = userOpenId.user.name || userOpenId.user.username;
      logger.info('找到用户名绑定关系:', { username, openId: open_id });

      return successResponse(res, {
        username: username,
        user_id: userOpenId.user.id,
        open_id: open_id,
        bound_at: userOpenId.bound_at
      }, '查询成功');
    } else {
      logger.warn('未找到OpenID绑定关系:', { openId: open_id });

      return successResponse(res, {
        username: '未绑定用户',
        user_id: null,
        open_id: open_id,
        bound_at: null
      }, '未找到绑定关系');
    }

  } catch (error) {
    logger.error('查询用户名过程出错:', error);
    return errorResponse(res, 500, '服务器内部错误', error, 500);
  }
});

// 抖音webhook端点
app.get('/api/douyin/webhook', (req, res) => {
  logger.debug('抖音webhook GET请求验证:', req.query);

  // 抖音平台验证请求处理
  const echostr = req.query.echostr;

  if (echostr) {
    logger.info('抖音webhook验证成功');
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
  logger.info('收到抖音webhook POST消息:', { eventType: req.body?.event_type });

  // 处理不同类型的消息推送
  if (req.body?.event_type) {
    logger.info('抖音webhook事件:', req.body.event_type);
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


// 抖音广告数据API - 已废弃，建议使用新的广告报告API
// app.get('/api/douyin/ads', async (req, res) => {
//   // 此API已被巨量引擎广告报告API替代，请使用 /api/douyin/ad-report
//   res.status(410).json({
//     error: 'API已废弃',
//     message: '请使用 /api/douyin/ad-report 接口',
//     code: 'DEPRECATED'
//   });
// });




// Token刷新函数
async function refreshAdAccessToken() {
  try {
    logger.info('开始刷新广告投放access_token...');

    // 从环境变量获取配置，强制要求设置
    const appId = process.env.VITE_DOUYIN_APP_ID;
    const appSecret = process.env.VITE_DOUYIN_APP_SECRET;

    if (!appId || !appSecret) {
      logger.error('缺少抖音API配置，请设置 VITE_DOUYIN_APP_ID 和 VITE_DOUYIN_APP_SECRET 环境变量');
      throw new Error('抖音API配置不完整');
    }

    const refreshRequestData = {
      app_id: appId, // 应用ID
      secret: appSecret, // App Secret
      refresh_token: adRefreshToken, // 使用当前refresh_token
      grant_type: 'refresh_token'
    };

    logger.debug('刷新token请求参数:', JSON.stringify(refreshRequestData, null, 2));

    const refreshResponse = await axios.post('https://api.oceanengine.com/open_api/oauth2/refresh_token/', refreshRequestData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    logger.debug('刷新token响应:', JSON.stringify(refreshResponse.data, null, 2));

    if (refreshResponse.data.code === 0 && refreshResponse.data.data) {
      const newAccessToken = refreshResponse.data.data.access_token;
      const newRefreshToken = refreshResponse.data.data.refresh_token;
      const expiresIn = refreshResponse.data.data.expires_in;
      const refreshTokenExpiresIn = refreshResponse.data.data.refresh_token_expires_in;
      const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;
      const refreshTokenExpiresAt = refreshTokenExpiresIn ? new Date(Date.now() + refreshTokenExpiresIn * 1000) : null;

      // 更新数据库中的token
      await Token.updateToken('access_token', newAccessToken, {
        expiresAt,
        appId: appId,
        appSecret: appSecret
      });

      await Token.updateToken('refresh_token', newRefreshToken, {
        refreshTokenExpiresAt, // refresh_token有过期时间
        appId: appId,
        appSecret: appSecret
      });

      // 更新全局token变量
      adAccessToken = newAccessToken;
      adRefreshToken = newRefreshToken;
      adTokenLastRefresh = new Date();
      adTokenExpiresAt = expiresAt;

      // 强制重新加载token以确保全局变量更新
      await reloadTokensFromDatabase();

      // 记录token刷新历史
      logTokenRefresh(newAccessToken, newRefreshToken, expiresIn, adTokenLastRefresh);

      logger.info('广告投放Token刷新成功，已更新数据库和全局变量');

      return {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        expires_in: expiresIn
      };
    } else {
      console.error('❌ 广告投放Token刷新失败:', refreshResponse.data.message);

      // 检查是否是refresh_token失效的错误
      if (refreshResponse.data.message?.includes('refresh_token') &&
          (refreshResponse.data.message?.includes('invalid') ||
           refreshResponse.data.message?.includes('expired') ||
           refreshResponse.data.message?.includes('失效'))) {
        const errorMsg = 'refresh_token已失效，请重新进行OAuth授权获取新的refresh_token';
        logger.error('检测到refresh_token失效，需要重新授权');
        throw new Error(errorMsg);
      }

      throw new Error(refreshResponse.data.message || 'Token刷新失败');
    }
  } catch (error) {
    logger.error('广告投放Token刷新异常:', error.message);
    throw error;
  }
}

// 检查token是否需要刷新的函数
function shouldRefreshToken() {
  if (!adTokenExpiresAt) {
    logger.debug('没有token过期时间信息，需要刷新');
    return true;
  }

  const now = new Date();
  const timeUntilExpiry = adTokenExpiresAt.getTime() - now.getTime();
  const minutesUntilExpiry = timeUntilExpiry / (1000 * 60);

  // 如果还有5分钟或更少时间过期，就刷新
  if (minutesUntilExpiry <= 5) {
    logger.info(`Token将在 ${minutesUntilExpiry.toFixed(1)} 分钟后过期，需要刷新`);
    return true;
  }

  logger.debug(`Token还有 ${minutesUntilExpiry.toFixed(1)} 分钟过期，无需刷新`);
  return false;
}

// 基于过期时间检查的Token刷新调度器
function startTokenRefreshScheduler() {
  logger.info('启动广告投放Token过期检查调度器...');

  // 每5分钟检查一次是否需要刷新
  setInterval(async () => {
    if (!shouldRefreshToken()) {
      return; // 不需要刷新，跳过
    }

    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 5 * 1000; // 5秒重试间隔

    while (retryCount < maxRetries) {
      try {
        logger.info(`检测到token即将过期，开始刷新广告投放Token... (尝试 ${retryCount + 1}/${maxRetries})`);
        await refreshAdAccessToken();
        logger.info('广告投放Token刷新成功');
        break; // 成功后跳出重试循环
      } catch (error) {
        retryCount++;
        logger.error(`广告投放Token刷新失败 (尝试 ${retryCount}/${maxRetries}):`, error.message);

        if (retryCount < maxRetries) {
          logger.debug(`${retryDelay / 1000}秒后重试...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        } else {
          logger.error('广告投放Token刷新失败，已达到最大重试次数，请手动检查配置');
          // 这里可以添加告警机制，比如发送邮件或消息通知
        }
      }
    }
  }, 5 * 60 * 1000); // 5分钟检查一次

  logger.info('广告投放Token过期检查调度器已启动');
}

// 手动触发Token刷新端点
app.post('/api/douyin/refresh-token', async (req, res) => {
  logger.info('手动触发广告投放Token刷新请求');

  try {
    const result = await refreshAdAccessToken();

    res.json({
      code: 0,
      message: '广告投放Token刷新成功',
      data: {
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        expires_in: result.expires_in,
        refreshed_at: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('手动广告投放Token刷新失败:', error.message);

    // 检查是否是refresh_token失效的错误
    let errorMessage = '广告投放Token刷新失败';
    let statusCode = 500;

    if (error.message?.includes('refresh_token') &&
        (error.message?.includes('invalid') ||
         error.message?.includes('expired') ||
         error.message?.includes('失效'))) {
      errorMessage = 'refresh_token已失效，请重新进行OAuth授权获取新的refresh_token';
      statusCode = 401; // Unauthorized
    }

    res.status(statusCode).json({
      code: statusCode,
      message: errorMessage,
      error: error.message,
      timestamp: new Date().toISOString(),
      solution: statusCode === 401 ? '请访问巨量引擎开发者平台重新进行OAuth授权，获取新的refresh_token并更新到系统配置中' : null
    });
  }
});

// 手动更新refresh_token端点 (仅管理员)
app.post('/api/douyin/update-refresh-token', authenticateJWT, async (req, res) => {
  try {
    const currentUser = req.user;

    // 检查权限：只有管理员可以更新refresh_token
    const mappedRole = getMappedRole(currentUser.role);
    if (mappedRole !== 'admin') {
      return res.status(403).json({
        code: 403,
        message: '权限不足，只有管理员可以更新refresh_token'
      });
    }

    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        code: 400,
        message: '请提供新的refresh_token'
      });
    }

    logger.info('管理员手动更新refresh_token');

    // 更新数据库中的refresh_token
    await Token.updateToken('refresh_token', refresh_token, {
      appId: process.env.VITE_DOUYIN_APP_ID,
      appSecret: process.env.VITE_DOUYIN_APP_SECRET
    });

    // 更新全局变量
    adRefreshToken = refresh_token;
    adTokenLastRefresh = new Date();

    // 强制重新加载token以确保全局变量更新
    await reloadTokensFromDatabase();

    // 立即尝试刷新access_token
    try {
      const result = await refreshAdAccessToken();

      res.json({
        code: 0,
        message: 'refresh_token更新成功，并成功刷新access_token',
        data: {
          refresh_token_updated: true,
          access_token_refreshed: true,
          access_token: result.access_token,
          expires_in: result.expires_in,
          updated_at: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });
    } catch (refreshError) {
      res.json({
        code: 0,
        message: 'refresh_token更新成功，但access_token刷新失败，请稍后重试',
        data: {
          refresh_token_updated: true,
          access_token_refreshed: false,
          error: refreshError.message,
          updated_at: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('❌ 更新refresh_token失败:', error.message);

    res.status(500).json({
      code: 500,
      message: '更新refresh_token失败',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});


// 广告预览二维码获取API
app.get('/api/douyin/ad-preview-qrcode', async (req, res) => {
  logger.info('开始广告预览二维码获取流程');

  try {
    const { advertiser_id, id_type, promotion_id } = req.query;

    // 验证必填参数
    if (!advertiser_id || !id_type || !promotion_id) {
      return res.status(400).json({
        error: '缺少参数',
        message: '请提供 advertiser_id, id_type, promotion_id 参数'
      });
    }

    logger.debug('请求参数:', { advertiser_id, id_type, promotion_id });

    // 使用原始id_type参数，不进行修正
    let correctedIdType = id_type;
    logger.debug('使用原始id_type参数:', correctedIdType);

    // 步骤1: 使用已知的有效access_token
    logger.debug('获取有效的广告投放access_token');

    // 使用全局token变量
    let accessToken = adAccessToken;
    logger.debug('使用当前广告投放access_token');

    // 如果token过期，可以在这里添加动态获取逻辑

    // 步骤2: 调用广告预览二维码API
    logger.debug('获取广告预览二维码');

    const qrParams = {
      advertiser_id: advertiser_id,
      id_type: correctedIdType,
      promotion_id: promotion_id
    };

    logger.debug('二维码请求参数:', JSON.stringify(qrParams, null, 2));

    const qrResponse = await axios.get('https://api.oceanengine.com/open_api/v3.0/tools/ad_preview/qrcode_get/', {
      params: qrParams,
      headers: {
        'Access-Token': accessToken,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    logger.debug('二维码响应:', JSON.stringify(qrResponse.data, null, 2));

    if (qrResponse.data.code !== 0) {
      logger.error('二维码获取失败:', qrResponse.data.message);

      // 如果是token过期错误，尝试刷新token
      if (qrResponse.data.code === 40105 ||
          qrResponse.data.code === 40102 ||
          qrResponse.data.code === 401 ||
          qrResponse.data.message?.includes('access_token已过期') ||
          qrResponse.data.message?.includes('token') && qrResponse.data.message?.includes('过期') ||
          qrResponse.data.message?.includes('token') && qrResponse.data.message?.includes('invalid') ||
          qrResponse.data.message?.includes('unauthorized')) {
        logger.info('检测到token过期或无效，尝试刷新token...');

        try {
          const newTokenData = await refreshAdAccessToken();
          accessToken = newTokenData.access_token;

          logger.info('Token刷新成功，重试二维码获取...');

          // 使用新token重试请求
          const retryResponse = await axios.get('https://api.oceanengine.com/open_api/v3.0/tools/ad_preview/qrcode_get/', {
            params: qrParams,
            headers: {
              'Access-Token': accessToken,
              'Content-Type': 'application/json'
            },
            timeout: 15000
          });

          if (retryResponse.data.code === 0) {
            console.log('✅ 重试成功，二维码获取成功');
            return res.json({
              code: 0,
              message: 'success',
              data: retryResponse.data.data.data, // 修正：从 data.data 中获取实际数据
              token_info: {
                ad_access_token: accessToken,
                expires_in: newTokenData.expires_in,
                note: '使用刷新后的广告投放access_token'
              },
              request_log: {
                qr_request: {
                  url: 'https://api.oceanengine.com/open_api/v3.0/tools/ad_preview/qrcode_get/',
                  params: qrParams,
                  response: retryResponse.data
                }
              }
            });
          }
        } catch (refreshError) {
          logger.error('Token刷新失败:', refreshError.message);
        }
      }

      // 如果是refresh_token失效，返回更详细的错误信息
      if (qrResponse.data.code === 40107 ||
          qrResponse.data.message?.includes('refresh_token无效') ||
          qrResponse.data.message?.includes('refresh_token') && qrResponse.data.message?.includes('无效')) {
        logger.error('refresh_token已失效，需要重新进行OAuth授权');
        return res.status(401).json({
          error: 'refresh_token已失效',
          message: 'refresh_token无效，请重新进行OAuth授权获取新的refresh_token',
          code: 'REFRESH_TOKEN_INVALID',
          solution: '请访问巨量引擎开发者平台重新进行OAuth授权，获取新的refresh_token并更新到系统配置中',
          details: qrResponse.data
        });
      }

      return res.status(500).json({
        error: '二维码获取失败',
        message: qrResponse.data.message,
        details: qrResponse.data
      });
    }

    logger.info('二维码获取成功');

    res.json({
      code: 0,
      message: 'success',
      data: qrResponse.data.data.data, // 修正：从 data.data 中获取实际数据
      token_info: {
        ad_access_token: accessToken,
        // expires_in: tokenExpiresInfo.expires_in, // 使用预配置token，过期时间未知
        // note: '使用预配置的广告投放access_token'
      },
      request_log: {
        qr_request: {
          url: 'https://api.oceanengine.com/open_api/v3.0/tools/ad_preview/qrcode_get/',
          params: qrParams,
          response: qrResponse.data
        }
      }
    });

  } catch (error) {
    logger.error('广告预览二维码流程失败:', error.message);

    if (error.response) {
      logger.error('API响应错误:', {
        status: error.response.status,
        data: error.response.data
      });
    }

    res.status(500).json({
      error: '获取广告预览二维码失败',
      message: error.message || '网络请求失败',
      code: error.response?.status || 'API_ERROR'
    });
  }
});

// 测试连接API - 获取小游戏access_token
app.post('/api/douyin/test-connection', async (req, res) => {
  logger.info('测试连接API请求');

  try {
    const { appid, secret } = req.body;

    if (!appid || !secret) {
      return res.status(400).json({
        error: '缺少参数',
        message: '请提供 appid 和 secret 参数'
      });
    }

    logger.info('测试连接游戏:', appid);

    // 获取小游戏access_token
    logger.debug('获取小游戏access_token...');

    const tokenRequestData = {
      appid: appid,
      secret: secret,
      grant_type: 'client_credential'
    };

    logger.debug('请求参数:', JSON.stringify(tokenRequestData, null, 2));

    const tokenResponse = await axios.post('https://minigame.zijieapi.com/mgplatform/api/apps/v2/token', tokenRequestData, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DouyinGameAds-Test/1.0'
      }
    });

    logger.debug('Token响应:', JSON.stringify(tokenResponse.data, null, 2));

    if (tokenResponse.data.err_no !== 0) {
      logger.error('小游戏Token获取失败:', tokenResponse.data.err_tips);
      return res.status(500).json({
        error: '小游戏Token获取失败',
        message: tokenResponse.data.err_tips,
        details: tokenResponse.data
      });
    }

    const minigameAccessToken = tokenResponse.data.data.access_token;
    logger.info('小游戏Token获取成功');

    res.json({
      code: 0,
      message: 'success',
      data: {
        minigame_access_token: minigameAccessToken,
        expires_in: tokenResponse.data.data.expires_in
      },
      request_log: {
        token_request: {
          url: 'https://minigame.zijieapi.com/mgplatform/api/apps/v2/token',
          params: tokenRequestData,
          response: tokenResponse.data
        }
      }
    });

  } catch (error) {
    logger.error('测试连接失败:', error.message);

    if (error.response) {
      logger.error('API响应错误:', {
        status: error.response.status,
        data: error.response.data
      });
    }

    res.status(500).json({
      error: '获取access_token失败',
      message: error.message || '网络请求失败',
      code: error.response?.status || 'API_ERROR'
    });
  }
});

// 获取所有ECPM数据的辅助函数
async function getAllEcpmData(mpId, dateHour, accessToken, additionalParams = {}) {
  const allRecords = [];
  let pageNo = 1;
  const pageSize = 100; // 使用较大的页面大小来减少请求次数
  let hasMoreData = true;

  while (hasMoreData) {
    const ecpmParams = {
      open_id: '',
      mp_id: mpId,
      date_hour: dateHour,
      access_token: accessToken,
      page_no: pageNo,
      page_size: pageSize,
      ...additionalParams
    };

    logger.debug(`获取ECPM数据 - 页 ${pageNo}, 参数:`, JSON.stringify(ecpmParams, null, 2));

    const ecpmResponse = await axios.get('https://minigame.zijieapi.com/mgplatform/api/apps/data/get_ecpm', {
      params: ecpmParams,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DouyinGameAds-ECPM/1.0'
      },
      timeout: 20000
    });

    if (ecpmResponse.data.err_no !== 0) {
      throw new Error(`获取ECPM数据失败: ${ecpmResponse.data.err_tips}`);
    }

    const pageData = ecpmResponse.data.data;
    const records = pageData.records || pageData.data || [];

    allRecords.push(...records);
    logger.debug(`页 ${pageNo} 获取到 ${records.length} 条记录，累计 ${allRecords.length} 条`);

    // 检查是否还有更多数据
    if (records.length < pageSize) {
      hasMoreData = false;
    } else {
      pageNo++;
      // 防止无限循环，最多获取100页
      if (pageNo > 100) {
        logger.warn('已达到最大页数限制，停止获取更多数据');
        hasMoreData = false;
      }
    }

    // 添加小延迟避免请求过快
    if (hasMoreData) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  logger.info(`获取所有ECPM数据完成，共 ${allRecords.length} 条记录`);
  return allRecords;
}

// 小游戏eCPM数据获取API - 根据游戏App ID获取对应的access_token
app.get('/api/douyin/ecpm', authenticateJWT, async (req, res) => {
  logger.info('开始eCPM数据获取流程');

  try {
    const mpId = req.query.mp_id;
    if (!mpId) {
      return res.status(400).json({
        error: '缺少参数',
        message: '请提供mp_id参数'
      });
    }

    logger.info('查询游戏:', mpId);

    // 步骤1: 根据游戏App ID获取对应的access_token
    logger.debug('获取access_token');

    // 从前端传递的查询参数中获取App Secret
    // 前端应该传递app_secret参数，或者我们需要从配置中获取
    const appSecret = req.query.app_secret || process.env.VITE_DOUYIN_APP_SECRET || '7ad00307b2596397ceeee3560ca8bfc9b3622476';

    const tokenRequestData = {
      appid: mpId,  // 使用前端传递的mp_id作为appid
      secret: appSecret,  // 使用对应的App Secret
      grant_type: 'client_credential'
    };

    logger.debug('请求参数:', JSON.stringify(tokenRequestData, null, 2));

    const tokenResponse = await axios.post('https://minigame.zijieapi.com/mgplatform/api/apps/v2/token', tokenRequestData, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DouyinGameAds/1.0'
      }
    });

    logger.debug('Token响应:', JSON.stringify(tokenResponse.data, null, 2));

    if (tokenResponse.data.err_no !== 0) {
      logger.error('小游戏Token获取失败:', tokenResponse.data.err_tips);
      return res.status(500).json({
        error: '小游戏Token获取失败',
        message: tokenResponse.data.err_tips,
        details: tokenResponse.data
      });
    }

    const minigameAccessToken = tokenResponse.data.data.access_token;
    logger.info('小游戏Token获取成功');

    // 获取查询参数
    const queryDate = req.query.date_hour || new Date().toISOString().split('T')[0];
    const pageNo = parseInt(req.query.page_no) || 1;
    const pageSize = parseInt(req.query.page_size) || 10;

    // 构建额外的筛选参数
    const additionalParams = {};
    if (req.query.aid) {
      additionalParams.aid = req.query.aid;
    }
    if (req.query.event_name) {
      additionalParams.event_name = req.query.event_name;
    }
    if (req.query.min_revenue) {
      additionalParams.min_revenue = parseFloat(req.query.min_revenue);
    }

    // 步骤2: 获取所有真实ECPM数据
    logger.debug('获取所有ECPM数据');
    const allRealRecords = await getAllEcpmData(mpId, queryDate, minigameAccessToken, additionalParams);

    // 步骤3: 处理虚假数据
    let allRecords = [...allRealRecords];
    console.log(`🔍 [ECPM调试] 检查用户: ${req.user ? req.user.username : '未登录'}, 查询游戏: ${mpId}`);

    if (req.user && (req.user.username === 'yuan' || req.user.username === 'Ayla6026')) {
      console.log(`✅ [ECPM调试] 用户 ${req.user.username} 符合条件，开始为游戏 ${mpId} 生成虚假数据`);

      // 生成预定义的虚假数据（根据查询日期过滤）
      const fakeData = await generateFakeEcpmDataForTargetUsers(mpId, queryDate);
      console.log(`📊 [ECPM调试] 生成虚假数据 ${fakeData.length} 条，查询日期: ${queryDate}`);

      // 将虚假数据添加到所有记录中
      allRecords.push(...fakeData);
      console.log(`✅ [ECPM调试] 合并完成，总记录数: ${allRecords.length} (真实: ${allRealRecords.length}, 虚假: ${fakeData.length})`);
    } else {
      console.log(`❌ [ECPM调试] 用户不符合条件，跳过虚假数据生成`);
    }

    // 步骤4: 手动应用分页
    const totalRecords = allRecords.length;
    const startIndex = (pageNo - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pageRecords = allRecords.slice(startIndex, endIndex);

    // 计算总收益（基于所有记录，不是当前页）
    const totalRevenue = allRecords.reduce((sum, item) => sum + parseFloat(item.revenue || 0), 0);

    // 构建分页响应数据
    const finalData = {
      data: {
        records: pageRecords,
        total: totalRecords,
        total_revenue: totalRevenue.toFixed(2) // 添加总收益信息
      },
      err_no: 0,
      err_msg: ""
    };

    logger.info(`分页完成 - 页 ${pageNo}, 每页 ${pageSize} 条, 返回 ${pageRecords.length} 条记录, 总共 ${totalRecords} 条, 总收益 ${totalRevenue.toFixed(2)} 元`);

    res.json({
      code: 0,
      message: 'success',
      data: finalData,
      pagination: {
        page_no: pageNo,
        page_size: pageSize,
        total_records: totalRecords,
        total_pages: Math.ceil(totalRecords / pageSize),
        has_next: endIndex < totalRecords,
        has_prev: pageNo > 1
      },
      token_info: {
        minigame_access_token: minigameAccessToken,
        expires_in: tokenResponse.data.data.expires_in
      },
      request_log: {
        minigame_token_request: {
          url: 'https://minigame.zijieapi.com/mgplatform/api/apps/v2/token',
          params: tokenRequestData,
          response: tokenResponse.data
        },
        ecpm_data_summary: {
          real_records_count: allRealRecords.length,
          fake_records_count: req.user && (req.user.username === 'yuan' || req.user.username === 'Ayla6026') ?
            (allRecords.length - allRealRecords.length) : 0,
          total_records: allRecords.length,
          total_revenue: totalRevenue.toFixed(2),
          pagination_applied: {
            page_no: pageNo,
            page_size: pageSize,
            returned_records: pageRecords.length
          }
        }
      }
    });

  } catch (error) {
    logger.error('eCPM流程失败:', error.message);

    if (error.response) {
      logger.error('API响应错误:', {
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

// 巨量引擎广告报告API - 获取广告投放数据
app.post('/api/douyin/ad-report', async (req, res) => {
  logger.info('开始巨量引擎广告报告获取流程');

  try {
    const {
      advertiser_id,
      start_date,
      end_date,
      fields,
      page,
      page_size
    } = req.body;

    // 验证必填参数
    if (!advertiser_id) {
      return res.status(400).json({
        error: '缺少参数',
        message: '请提供 advertiser_id 参数'
      });
    }

    logger.debug('请求参数:', { advertiser_id, start_date, end_date, fields, page, page_size });

    // 步骤1: 获取有效的access_token
    logger.debug('获取access_token');

    // 优先使用前端传递的小游戏access_token（用于广告报告）
    let accessToken = req.headers['authorization']?.replace('Bearer ', '');

    if (!accessToken) {
      // 如果前端没有传递，尝试使用全局广告投放token
      accessToken = adAccessToken;
      logger.debug('使用全局广告投放access_token');
    } else {
      logger.debug('使用前端传递的小游戏access_token');
    }

    if (!accessToken) {
      return res.status(401).json({
        error: '缺少认证',
        message: '请提供有效的access_token'
      });
    }

    // 步骤2: 调用巨量引擎广告报告API
    logger.debug('获取广告报告数据');

    const reportParams = {
      advertiser_id: advertiser_id,
      start_date: start_date || new Date().toISOString().split('T')[0],
      end_date: end_date || new Date().toISOString().split('T')[0],
      fields: fields || ['ad_id', 'impressions', 'clicks', 'media_source', 'platform'],
      page: page || 1,
      page_size: page_size || 10
    };

    logger.debug('广告报告请求参数:', JSON.stringify(reportParams, null, 2));

    const reportResponse = await axios.get('https://ad.oceanengine.com/open_api/2/report/ad/get/', {
      params: reportParams,
      headers: {
        'Access-Token': accessToken,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    logger.debug('广告报告响应:', JSON.stringify(reportResponse.data, null, 2));

    if (reportResponse.data.code !== 0) {
      logger.error('广告报告获取失败:', reportResponse.data.message);

      // 如果是token过期错误，尝试刷新token
      if (reportResponse.data.code === 40105 ||
          reportResponse.data.code === 401 ||
          reportResponse.data.message?.includes('access_token已过期') ||
          reportResponse.data.message?.includes('token') && reportResponse.data.message?.includes('过期') ||
          reportResponse.data.message?.includes('token') && reportResponse.data.message?.includes('invalid') ||
          reportResponse.data.message?.includes('unauthorized')) {
        logger.info('检测到token过期或无效，尝试刷新token...');

        try {
          const newTokenData = await refreshAdAccessToken();
          accessToken = newTokenData.access_token;

          logger.info('Token刷新成功，重试广告报告获取...');

          // 使用新token重试请求
          const retryResponse = await axios.get('https://ad.oceanengine.com/open_api/2/report/ad/get/', {
            params: reportParams,
            headers: {
              'Access-Token': accessToken,
              'Content-Type': 'application/json'
            },
            timeout: 15000
          });

          if (retryResponse.data.code === 0) {
            console.log('✅ 重试成功，广告报告获取成功');
            return res.json({
              code: 0,
              message: 'success',
              data: retryResponse.data.data,
              token_info: {
                ad_access_token: accessToken,
                expires_in: newTokenData.expires_in,
                note: '使用刷新后的广告投放access_token'
              },
              request_log: {
                report_request: {
                  url: 'https://ad.oceanengine.com/open_api/2/report/ad/get/',
                  params: reportParams,
                  response: retryResponse.data
                }
              }
            });
          }
        } catch (refreshError) {
          logger.error('Token刷新失败:', refreshError.message);
        }
      }

      return res.status(reportResponse.data.code === 40105 ? 401 : 500).json({
        error: '广告报告获取失败',
        message: reportResponse.data.message,
        details: reportResponse.data
      });
    }

    logger.info('广告报告获取成功');

    res.json({
      code: 0,
      message: 'success',
      data: reportResponse.data.data,
      request_log: {
        report_request: {
          url: 'https://ad.oceanengine.com/open_api/2/report/ad/get/',
          params: reportParams,
          response: reportResponse.data
        }
      }
    });

  } catch (error) {
    logger.error('广告报告流程失败:', error.message);

    if (error.response) {
      logger.error('API响应错误:', {
        status: error.response.status,
        data: error.response.data
      });
    }

    res.status(500).json({
      error: '获取广告报告失败',
      message: error.message || '网络请求失败',
      code: error.response?.status || 'API_ERROR'
    });
  }
});

// 抖音小程序游戏二维码创建API
app.post('/api/douyin/mini-game/create-qr-code', async (req, res) => {
  logger.info('开始抖音小程序游戏二维码创建流程');

  try {
    const {
      access_token, // 可选：如果前端已经获取了token，可以直接传递
      path = '',
      width = 430,
      auto_color = false,
      line_color = {"r": 0, "g": 0, "b": 0},
      is_hyaline = false
    } = req.body;

    logger.debug('请求参数:', {
      access_token: access_token ? '***' : '',
      path,
      width,
      auto_color,
      line_color,
      is_hyaline,
      hasAccessToken: !!access_token
    });

    let accessToken = access_token;

    // 如果前端没有传递access_token，则获取新的token
    if (!accessToken) {
      logger.debug('获取小游戏access_token');

      const { app_id, app_secret } = req.body;

      if (!app_id || !app_secret) {
        return res.status(400).json({
          error: '缺少参数',
          message: '请提供 app_id 和 app_secret 参数，或直接提供 access_token 参数'
        });
      }

      // 获取小游戏access_token
      const tokenRequestData = {
        appid: app_id,
        secret: app_secret,
        grant_type: 'client_credential'
      };

      logger.debug('获取token请求参数:', JSON.stringify(tokenRequestData, null, 2));

      const tokenResponse = await axios.post('https://minigame.zijieapi.com/mgplatform/api/apps/v2/token', tokenRequestData, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      logger.debug('Token响应:', JSON.stringify(tokenResponse.data, null, 2));

      if (tokenResponse.data.err_no !== 0) {
        logger.error('小游戏Token获取失败:', tokenResponse.data.err_tips);
        return res.status(500).json({
          error: '小游戏Token获取失败',
          message: tokenResponse.data.err_tips,
          details: tokenResponse.data
        });
      }

      accessToken = tokenResponse.data.data.access_token;
      logger.info('小游戏Token获取成功');
    } else {
      logger.debug('使用前端传递的access_token');
    }

    // 步骤2: 调用抖音小程序游戏二维码创建API
    logger.debug('创建小程序游戏二维码');

    // 构建二维码参数，确保没有循环引用
    const qrParams = {
      access_token: accessToken,
      appname: req.body.appname || 'douyin', // 使用前端传递的appname参数
      path: path || "",
      width: Math.max(280, Math.min(1280, width || 430)) // 限制在280-1280px范围内
    };

    logger.debug('二维码创建请求参数:', JSON.stringify(qrParams, null, 2));

    // 使用 responseType: 'arraybuffer' 来处理可能的二进制响应
    const qrResponse = await axios.post('https://minigame.zijieapi.com/mgplatform/api/apps/qrcode', qrParams, {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json'
      },
      responseType: 'arraybuffer' // 重要：设置为 arraybuffer 以处理二进制数据
    });

    logger.debug('二维码创建响应状态:', qrResponse.status);

    // 检查响应内容类型
    const contentType = qrResponse.headers['content-type'] || qrResponse.headers['Content-Type'];
    logger.debug('响应Content-Type:', contentType);

    // 如果是PNG图像，直接返回二进制数据
    if (contentType && contentType.includes('image/png')) {
      logger.debug('检测到PNG图像响应，直接返回二进制数据');

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `inline; filename="douyin-qr-${req.body.app_id || 'unknown'}-${Date.now()}.png"`);
      res.setHeader('Cache-Control', 'no-cache');

      return res.send(qrResponse.data);
    }

    // 如果是JSON响应，尝试解析
    let responseData;
    try {
      // 将 arraybuffer 转换为字符串
      const responseText = Buffer.from(qrResponse.data).toString('utf8');
      responseData = JSON.parse(responseText);
      logger.debug('二维码创建JSON响应:', responseData);
    } catch (parseError) {
      logger.error('解析响应数据失败:', parseError.message);
      return res.status(500).json({
        error: '二维码创建失败',
        message: 'API返回数据格式错误',
        details: '无法解析响应数据'
      });
    }

    // 检查JSON响应中的错误
    if (responseData.err_no !== 0) {
      logger.error('二维码创建失败:', responseData.err_tips);
      return res.status(500).json({
        error: '二维码创建失败',
        message: responseData.err_tips || responseData.err_msg || '未知错误',
        details: responseData
      });
    }

    logger.info('二维码创建成功');

    // 构建响应数据
    const apiResponse = {
      code: 0,
      message: 'success',
      data: {
        qr_code_url: responseData.data.qr_code_url,
        app_id: req.body.app_id || 'test_app_id',
        path: path,
        width: width,
        created_at: new Date().toISOString()
      },
      token_info: {
        access_token: accessToken,
        source: access_token ? 'frontend_provided' : 'server_generated'
      },
      request_log: {
        qr_create_request: {
          url: 'https://minigame.zijieapi.com/mgplatform/api/apps/qrcode',
          params: qrParams,
          response: responseData
        }
      }
    };

    // 如果是服务器生成的token，添加token请求信息
    if (!access_token && tokenResponse) {
      apiResponse.token_info.expires_in = tokenResponse.data.data.expires_in;
      apiResponse.request_log.token_request = {
        url: 'https://minigame.zijieapi.com/mgplatform/api/apps/v2/token',
        params: tokenRequestData,
        response: tokenResponse.data
      };
    }

    res.json(apiResponse);

  } catch (error) {
    logger.error('抖音小程序游戏二维码创建流程失败:', error.message);

    if (error.response) {
      console.error('📄 API响应错误:', {
        status: error.response.status,
        data: error.response.data
      });
    }

    res.status(500).json({
      error: '创建二维码失败',
      message: error.message || '网络请求失败',
      code: error.response?.status || 'API_ERROR',
      stack: error.stack
    });
  }
});

// 通用API代理端点 - 用于解决前端跨域问题
app.post('/api/douyin/proxy', async (req, res) => {
  logger.info('通用API代理请求');

  try {
    const { url, method = 'GET', headers = {}, body, params } = req.body;

    if (!url) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要的参数：url'
      });
    }

    logger.debug('代理请求:', { url, method, hasBody: !!body, hasParams: !!params });

    // 构建请求配置
    const requestConfig = {
      method: method.toUpperCase(),
      url: url,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DouyinGameAds-Proxy/1.0',
        ...headers
      }
    };

    // 添加查询参数
    if (params && Object.keys(params).length > 0) {
      requestConfig.params = params;
    }

    // 添加请求体
    if (body && (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT')) {
      requestConfig.data = body;
    }

    logger.debug('发送代理请求到:', url);

    const response = await axios(requestConfig);

    logger.debug('代理响应状态:', response.status);

    res.json({
      code: 0,
      message: '代理请求成功',
      data: {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data
      },
      request: {
        url: url,
        method: method,
        headers: headers,
        params: params,
        hasBody: !!body
      }
    });

  } catch (error) {
    console.error('❌ 代理请求失败:', error.message);

    if (error.response) {
      console.error('📄 目标API错误响应:', {
        status: error.response.status,
        data: error.response.data
      });

      res.status(error.response.status).json({
        code: error.response.status,
        message: '目标API返回错误',
        error: error.response.data,
        request: {
          url: req.body.url,
          method: req.body.method
        }
      });
    } else {
      res.status(500).json({
        code: 500,
        message: '代理请求失败',
        error: error.message,
        request: {
          url: req.body.url,
          method: req.body.method
        }
      });
    }
  }
});

// 转化事件回调端点 - 支持GET和POST方法
const handleConversionCallback = async (req, res) => {
  const method = req.method;
  const params = method === 'POST' ? req.body : req.query;
  const startTime = Date.now();

  console.log(`📡 收到转化事件回调请求 (${method}):`, {
    url: req.url,
    headers: req.headers,
    params: params,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  let eventRecord = null;

  try {
    // 1. 检查是否重复事件（通过outer_event_id去重）
    if (params.outer_event_id) {
      const existingEvent = await ConversionEvent.findByOuterEventId(params.outer_event_id);
      if (existingEvent) {
        console.log('⚠️ 检测到重复事件，跳过处理:', params.outer_event_id);

        const response = {
          code: 0,
          message: 'success (duplicate event skipped)',
          data: {
            event_id: existingEvent.id,
            duplicate: true,
            original_received_at: existingEvent.received_at
          },
          timestamp: new Date().toISOString()
        };

        return res.json(response);
      }
    }

    // 2. 创建转化事件记录
    const eventData = {
      callback: params.callback,
      event_type: parseInt(params.event_type),
      event_name: conversionCallbackService.getSupportedEventTypes()[params.event_type] || '未知事件',
      request_method: method,
      request_ip: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.ip,
      user_agent: req.headers['user-agent'],
      status: 'processing',
      received_at: new Date()
    };

    // 添加设备信息
    if (params.idfa) eventData.idfa = params.idfa;
    if (params.imei) eventData.imei = params.imei;
    if (params.oaid) eventData.oaid = params.oaid;
    if (params.oaid_md5) eventData.oaid_md5 = params.oaid_md5;
    if (params.muid) eventData.muid = params.muid;
    if (params.os !== undefined) eventData.os = parseInt(params.os);
    if (params.caid1) eventData.caid1 = params.caid1;
    if (params.caid2) eventData.caid2 = params.caid2;

    // 添加可选参数
    if (params.conv_time) eventData.conv_time = parseInt(params.conv_time);
    if (params.match_type !== undefined) eventData.match_type = parseInt(params.match_type);
    if (params.outer_event_id) eventData.outer_event_id = params.outer_event_id;
    if (params.outer_event_identity) eventData.outer_event_identity = params.outer_event_identity;
    if (params.source) eventData.source = params.source;
    if (params.props) {
      eventData.props = typeof params.props === 'object' ? JSON.stringify(params.props) : params.props;
    }

    eventRecord = await ConversionEvent.createEvent(eventData);
    console.log('📝 已创建转化事件记录:', eventRecord.id);

    // 3. 处理转化事件回调
    const result = await conversionCallbackService.processConversionCallback(params, method);

    // 4. 更新事件记录状态
    const updateData = {
      processing_time: Date.now() - startTime,
      processed_at: new Date()
    };

    if (result.success) {
      updateData.status = 'success';
      updateData.callback_response = JSON.stringify(result.callback_result);
      updateData.callback_status = result.callback_result.status || 200;

      console.log('✅ 转化事件回调处理成功');

      const response = {
        code: 0,
        message: 'success',
        data: {
          event_id: eventRecord.id,
          event_type: result.event_info.event_type,
          event_name: result.event_info.event_name,
          processed: true,
          processing_time: updateData.processing_time,
          callback_result: result.callback_result
        },
        timestamp: result.timestamp
      };

      // 更新数据库记录
      await ConversionEvent.updateStatus(eventRecord.id, 'success', updateData);
      res.json(response);

    } else {
      updateData.status = 'failed';
      updateData.error_message = result.error;

      console.error('❌ 转化事件回调处理失败:', result.error);

      const errorResponse = {
        code: result.code || 500,
        message: '转化事件回调处理失败',
        error: result.error,
        event_id: eventRecord.id,
        timestamp: result.timestamp
      };

      // 更新数据库记录
      await ConversionEvent.updateStatus(eventRecord.id, 'failed', updateData);
      res.status(result.code || 500).json(errorResponse);
    }

  } catch (error) {
    console.error('❌ 处理转化事件回调时发生异常:', error);

    // 如果已经创建了事件记录，更新其状态
    if (eventRecord) {
      await ConversionEvent.updateStatus(eventRecord.id, 'failed', {
        error_message: error.message,
        processing_time: Date.now() - startTime,
        processed_at: new Date()
      });
    }

    const errorResponse = {
      code: 500,
      message: '服务器内部错误',
      error: error.message,
      event_id: eventRecord ? eventRecord.id : null,
      timestamp: new Date().toISOString()
    };

    res.status(500).json(errorResponse);
  }
};

// 转化事件回调路由
app.get('/api/conversion/callback', handleConversionCallback);
app.post('/api/conversion/callback', handleConversionCallback);

// 获取支持的事件类型列表
app.get('/api/conversion/event-types', (req, res) => {
  const eventTypes = conversionCallbackService.getSupportedEventTypes();

  res.json({
    code: 0,
    message: 'success',
    data: {
      event_types: Object.entries(eventTypes).map(([code, name]) => ({
        code: parseInt(code),
        name: name
      })),
      total: Object.keys(eventTypes).length
    },
    timestamp: new Date().toISOString()
  });
});

// 获取支持的归因方式列表
app.get('/api/conversion/match-types', (req, res) => {
  const matchTypes = conversionCallbackService.getSupportedMatchTypes();

  res.json({
    code: 0,
    message: 'success',
    data: {
      match_types: Object.entries(matchTypes).map(([code, name]) => ({
        code: parseInt(code),
        name: name
      })),
      total: Object.keys(matchTypes).length
    },
    timestamp: new Date().toISOString()
  });
});

// 获取转化事件列表 (仅管理员)
app.get('/api/conversion/events', authenticateJWT, async (req, res) => {
  try {
    const currentUser = req.user;

    // 检查权限：只有管理员、老板和客服可以查看转化事件
    const mappedRole = getMappedRole(currentUser.role);
    const allowedRoles = ['admin', 'internal_boss', 'external_boss', 'internal_service', 'external_service'];
    if (!allowedRoles.includes(mappedRole)) {
      return res.status(403).json({
        code: 403,
        message: '权限不足，只有管理员、老板和客服可以查看转化事件'
      });
    }

    const {
      page = 1,
      page_size = 20,
      event_type,
      status,
      start_date,
      end_date
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(page_size);
    const limit = parseInt(page_size);

    // 构建查询条件
    const whereCondition = {};

    if (event_type !== undefined) {
      whereCondition.event_type = parseInt(event_type);
    }

    if (status) {
      whereCondition.status = status;
    }

    if (start_date && end_date) {
      whereCondition.received_at = {
        [sequelize.Sequelize.Op.between]: [new Date(start_date), new Date(end_date)]
      };
    }

    // 查询转化事件
    const { count, rows } = await ConversionEvent.findAndCountAll({
      where: whereCondition,
      limit,
      offset,
      order: [['received_at', 'DESC']],
      attributes: [
        'id', 'callback', 'event_type', 'event_name', 'status',
        'processing_time', 'callback_status', 'error_message',
        'request_method', 'request_ip', 'received_at', 'processed_at',
        'idfa', 'imei', 'oaid', 'muid', 'os', 'conv_time', 'match_type'
      ]
    });

    // 格式化数据
    const formattedEvents = rows.map(event => event.toFrontendFormat());

    res.json({
      code: 0,
      message: 'success',
      data: {
        events: formattedEvents,
        pagination: {
          page: parseInt(page),
          page_size: parseInt(page_size),
          total: count,
          total_pages: Math.ceil(count / parseInt(page_size))
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('获取转化事件列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

// 获取转化事件统计 (仅管理员)
app.get('/api/conversion/stats', authenticateJWT, async (req, res) => {
  try {
    const currentUser = req.user;

    // 检查权限：只有管理员、老板和客服可以查看统计
    const mappedRole = getMappedRole(currentUser.role);
    const allowedRoles = ['admin', 'internal_boss', 'external_boss', 'internal_service', 'external_service'];
    if (!allowedRoles.includes(mappedRole)) {
      return res.status(403).json({
        code: 403,
        message: '权限不足，只有管理员、老板和客服可以查看统计'
      });
    }

    const { start_date, end_date } = req.query;

    let startDate = start_date ? new Date(start_date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 默认30天
    let endDate = end_date ? new Date(end_date) : new Date();

    // 获取基础统计
    const totalEvents = await ConversionEvent.count({
      where: {
        received_at: {
          [sequelize.Sequelize.Op.between]: [startDate, endDate]
        }
      }
    });

    const successEvents = await ConversionEvent.count({
      where: {
        received_at: {
          [sequelize.Sequelize.Op.between]: [startDate, endDate]
        },
        status: 'success'
      }
    });

    const failedEvents = await ConversionEvent.count({
      where: {
        received_at: {
          [sequelize.Sequelize.Op.between]: [startDate, endDate]
        },
        status: 'failed'
      }
    });

    // 按事件类型统计
    const eventTypeStats = await ConversionEvent.findAll({
      where: {
        received_at: {
          [sequelize.Sequelize.Op.between]: [startDate, endDate]
        }
      },
      attributes: [
        'event_type',
        'event_name',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('AVG', sequelize.col('processing_time')), 'avg_processing_time']
      ],
      group: ['event_type', 'event_name'],
      raw: true
    });

    // 按状态统计
    const statusStats = await ConversionEvent.findAll({
      where: {
        received_at: {
          [sequelize.Sequelize.Op.between]: [startDate, endDate]
        }
      },
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    // 每日统计（最近7天）
    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayStart = new Date(dateStr + ' 00:00:00');
      const dayEnd = new Date(dateStr + ' 23:59:59');

      const dayCount = await ConversionEvent.count({
        where: {
          received_at: {
            [sequelize.Sequelize.Op.between]: [dayStart, dayEnd]
          }
        }
      });

      dailyStats.push({
        date: dateStr,
        count: dayCount
      });
    }

    res.json({
      code: 0,
      message: 'success',
      data: {
        summary: {
          total_events: totalEvents,
          success_events: successEvents,
          failed_events: failedEvents,
          success_rate: totalEvents > 0 ? (successEvents / totalEvents * 100).toFixed(2) + '%' : '0%'
        },
        event_type_stats: eventTypeStats,
        status_stats: statusStats,
        daily_stats: dailyStats,
        date_range: {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0]
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('获取转化事件统计错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

// 巨量广告第三方监测链接端点 (保留原有功能)
app.get('/openid/report', async (req, res) => {
  console.log('📊 收到巨量广告监测请求:', req.query);
  console.log('📊 请求头信息:', {
    'user-agent': req.headers['user-agent'],
    'x-forwarded-for': req.headers['x-forwarded-for'],
    'x-real-ip': req.headers['x-real-ip'],
    'referer': req.headers.referer
  });

  try {
    // 提取监测参数
    const {
      promotionid,
      mid1,
      imei,
      oaid,
      androidid,
      idfa,
      muid,
      os,
      TIMESTAMP: timestamp,
      callback
    } = req.query;

    // 构建监测数据对象
    const monitorData = {
      promotion_id: promotionid,
      mid1: mid1,
      imei: imei,
      oaid: oaid,
      android_id: androidid,
      idfa: idfa,
      muid: muid,
      os: os,
      timestamp: timestamp,
      callback_param: callback,
      user_agent: req.headers['user-agent'],
      ip_address: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.ip,
      received_at: new Date().toISOString(),
      source: 'oceanengine_monitor'
    };

    console.log('📝 解析的监测数据:', monitorData);

    // 步骤1: 将数据保存到数据库（可选）
    // 这里可以根据需要保存到专门的广告监测表中
    // 例如：await saveAdMonitorData(monitorData);

    // 步骤2: 转发监测数据到巨量平台
    console.log('📤 转发监测数据到巨量平台...');

    let forwardResult = null;
    try {
      // 构建转发到巨量平台的参数 - 只包含有值的参数
      const forwardParams = {};

      // 只在参数存在且有值时才添加
      if (callback && callback.trim()) {
        forwardParams.callback = callback.trim();
      }
      // 设备信息参数 - 支持巨量广告官方规范的两种组合
      if (idfa && idfa.trim()) {
        forwardParams.idfa = idfa.trim();
      }
      if (imei && imei.trim()) {
        forwardParams.imei = imei.trim();
      }
      if (oaid && oaid.trim()) {
        forwardParams.oaid = oaid.trim();
      }
      if (muid && muid.trim()) {
        forwardParams.muid = muid.trim();
      }
      if (os && os.trim()) {
        forwardParams.os = os.trim();
      }
      if (androidid && androidid.trim()) {
        forwardParams.androidid = androidid.trim();
      }
      if (timestamp && timestamp.trim()) {
        forwardParams.conv_time = timestamp.trim();
      }

      // 只有当有参数时才转发
      if (Object.keys(forwardParams).length === 0) {
        console.log('⚠️ 没有有效的参数需要转发，跳过转发步骤');
        forwardResult = {
          success: true,
          status: 200,
          data: { code: 0, msg: 'no_params_to_forward' },
          forwarded_at: new Date().toISOString(),
          note: '没有有效的参数需要转发'
        };
      } else {
        console.log('📋 转发参数:', forwardParams);

        // 调用巨量平台的转化回调API（新版本）
        const forwardResponse = await axios.post('https://analytics.oceanengine.com/api/v2/conversion', {
          event_type: 'active', // 固定为激活事件
          context: {
            ad: {
              callback: forwardParams.callback
            },
            device: {
              platform: forwardParams.os === '1' ? 'ios' : 'android',
              ...(forwardParams.idfa && { idfa: forwardParams.idfa }),
              ...(forwardParams.imei && { imei: forwardParams.imei }),
              ...(forwardParams.oaid && { oaid: forwardParams.oaid }),
              ...(forwardParams.androidid && { android_id: forwardParams.androidid })
            }
          },
          timestamp: Date.now()
        }, {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': req.headers['user-agent'] || 'DouyinGameAds-Monitor/1.0'
          }
        });

        forwardResult = {
          success: true,
          status: forwardResponse.status,
          data: forwardResponse.data,
          forwarded_at: new Date().toISOString()
        };

        console.log('✅ 监测数据转发成功:', {
          status: forwardResponse.status,
          response: forwardResponse.data
        });
      }

    } catch (forwardError) {
      console.error('❌ 监测数据转发失败:', forwardError.message);

      forwardResult = {
        success: false,
        error: forwardError.message,
        forwarded_at: new Date().toISOString()
      };

      // 转发失败不影响整体响应，只记录错误
      if (forwardError.response) {
        console.error('📄 巨量平台响应错误:', {
          status: forwardError.response.status,
          data: forwardError.response.data
        });
        forwardResult.status = forwardError.response.status;
        forwardResult.response_data = forwardError.response.data;
      }
    }

    // 返回成功响应
    const response = {
      code: 0,
      message: 'success',
      received: true,
      timestamp: new Date().toISOString(),
      data: {
        promotion_id: promotionid,
        processed: true,
        forward_result: forwardResult
      }
    };

    // 如果有回调参数，使用JSONP格式返回
    if (callback) {
      console.log('📞 使用JSONP回调响应:', callback);
      res.type('application/javascript');
      return res.send(`${callback}(${JSON.stringify(response)})`);
    } else {
      // 普通JSON响应
      res.json(response);
    }

  } catch (error) {
    console.error('❌ 处理广告监测数据时出错:', error);

    const errorResponse = {
      code: -1,
      message: '处理失败',
      error: error.message,
      timestamp: new Date().toISOString()
    };

    if (req.query.callback) {
      res.type('application/javascript');
      res.send(`${req.query.callback}(${JSON.stringify(errorResponse)})`);
    } else {
      res.status(500).json(errorResponse);
    }
  }
});

// 流量主金额管理API
app.get('/api/traffic-master/amount', authenticateJWT, (req, res) => {
  try {
    const { app_id, date } = req.query;

    if (!app_id || !date) {
      return res.status(400).json({
        code: 400,
        message: '请提供应用ID和日期参数'
      });
    }

    const amount = getTrafficMasterAmount(app_id, date);
    res.json({
      code: 20000,
      data: {
        app_id: app_id,
        date: date,
        amount: amount
      },
      message: '获取流量主金额成功'
    });
  } catch (error) {
    console.error('获取流量主金额失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

app.post('/api/traffic-master/amount', authenticateJWT, (req, res) => {
  try {
    const { app_id, date, amount } = req.body;

    if (!app_id || !date) {
      return res.status(400).json({
        code: 400,
        message: '请提供应用ID和日期'
      });
    }

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) < 0) {
      return res.status(400).json({
        code: 400,
        message: '请输入有效的金额'
      });
    }

    const success = setTrafficMasterAmount(app_id, date, amount.toString());
    if (success) {
      res.json({
        code: 20000,
        data: {
          app_id: app_id,
          date: date,
          amount: amount
        },
        message: '流量主金额保存成功'
      });
    } else {
      res.status(500).json({
        code: 500,
        message: '保存失败，请重试'
      });
    }
  } catch (error) {
    console.error('保存流量主金额失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// 获取所有流量主金额记录
app.get('/api/traffic-master/amounts', authenticateJWT, (req, res) => {
  try {
    const data = loadTrafficMasterAmounts();
    const records = Object.entries(data).map(([key, value]) => {
      const [appId, date] = key.split('_');
      return {
        app_id: appId,
        date: date,
        amount: value.amount,
        updated_at: value.updated_at
      };
    });

    res.json({
      code: 20000,
      data: {
        records: records,
        total: records.length
      },
      message: '获取流量主金额记录成功'
    });
  } catch (error) {
    console.error('获取流量主金额记录失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// 清除虚假ECPM数据缓存（仅管理员）
app.delete('/api/fake-ecpm/clear-cache', authenticateJWT, (req, res) => {
  try {
    const currentUser = req.user;

    // 检查权限：只有管理员可以清除缓存
    const mappedRole = getMappedRole(currentUser.role);
    if (mappedRole !== 'admin') {
      return res.status(403).json({
        code: 403,
        message: '权限不足，只有管理员可以清除缓存'
      });
    }

    const { app_id, query_date } = req.query;

    if (app_id && query_date) {
      // 清除特定应用的特定日期缓存
      const cache = loadFakeEcpmCache();
      const cacheKey = `${app_id}_${query_date}`;

      if (cache[cacheKey]) {
        delete cache[cacheKey];
        saveFakeEcpmCache(cache);
        console.log(`🗑️ 已清除缓存: ${cacheKey}`);
        res.json({
          code: 20000,
          message: `已清除应用 ${app_id} 在 ${query_date} 的缓存`
        });
      } else {
        res.json({
          code: 20000,
          message: `缓存不存在: ${cacheKey}`
        });
      }
    } else {
      // 清除所有缓存
      const success = saveFakeEcpmCache({});
      if (success) {
        console.log('🗑️ 已清除所有虚假ECPM数据缓存');
        res.json({
          code: 20000,
          message: '已清除所有虚假ECPM数据缓存'
        });
      } else {
        res.status(500).json({
          code: 500,
          message: '清除缓存失败'
        });
      }
    }
  } catch (error) {
    console.error('清除缓存失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});

// 获取虚假ECPM缓存状态（仅管理员）
app.get('/api/fake-ecpm/cache-status', authenticateJWT, (req, res) => {
  try {
    const currentUser = req.user;

    // 检查权限：只有管理员可以查看缓存状态
    const mappedRole = getMappedRole(currentUser.role);
    if (mappedRole !== 'admin') {
      return res.status(403).json({
        code: 403,
        message: '权限不足，只有管理员可以查看缓存状态'
      });
    }

    const cache = loadFakeEcpmCache();
    const cacheEntries = Object.entries(cache).map(([key, value]) => ({
      cache_key: key,
      record_count: value.data ? value.data.length : 0,
      timestamp: value.timestamp,
      app_id: value.appId,
      query_date: value.queryDate
    }));

    res.json({
      code: 20000,
      data: {
        cache_file: FAKE_ECPM_CACHE_FILE,
        total_entries: cacheEntries.length,
        entries: cacheEntries
      },
      message: '获取缓存状态成功'
    });
  } catch (error) {
    console.error('获取缓存状态失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
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


// Token状态查询端点
app.get('/api/douyin/token-status', (req, res) => {
  const now = new Date();
  let nextCheckTime = new Date(now.getTime() + 30 * 1000); // 下次检查时间
  let timeUntilExpiry = null;
  let timeUntilExpiryFormatted = '未知';

  if (adTokenExpiresAt) {
    timeUntilExpiry = adTokenExpiresAt.getTime() - now.getTime();
    timeUntilExpiryFormatted = formatTimeUntilRefresh(timeUntilExpiry);
  }

  res.json({
    code: 0,
    message: 'success',
    data: {
      ad_access_token: adAccessToken,
      ad_refresh_token: adRefreshToken,
      ad_token_last_refresh: adTokenLastRefresh ? adTokenLastRefresh.toISOString() : null,
      ad_token_expires_at: adTokenExpiresAt ? adTokenExpiresAt.toISOString() : null,
      next_check: nextCheckTime.toISOString(),
      time_until_expiry_seconds: timeUntilExpiry ? Math.max(0, Math.floor(timeUntilExpiry / 1000)) : null,
      time_until_expiry_formatted: timeUntilExpiryFormatted,
      auto_refresh_enabled: true,
      refresh_strategy: '按需刷新（过期前5分钟）',
      check_interval_seconds: 30
    },
    timestamp: new Date().toISOString()
  });
});

// 获取所有token记录 (仅管理员)
app.get('/api/douyin/tokens', authenticateJWT, async (req, res) => {
  try {
    const currentUser = req.user;

    // 检查权限：只有管理员可以查看token
    const mappedRole = getMappedRole(currentUser.role);
    if (mappedRole !== 'admin') {
      return res.status(403).json({
        code: 403,
        message: '权限不足，只有管理员可以查看token信息'
      });
    }

    const tokens = await Token.findAll({
      order: [['updated_at', 'DESC']]
    });

    res.json({
      code: 0,
      message: 'success',
      data: {
        tokens: tokens.map(token => token.toFrontendFormat()),
        total: tokens.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('获取token列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

// 获取token刷新历史记录 (仅管理员)
app.get('/api/douyin/token-history', authenticateJWT, async (req, res) => {
  try {
    const currentUser = req.user;

    // 检查权限：只有管理员可以查看token历史
    const mappedRole = getMappedRole(currentUser.role);
    if (mappedRole !== 'admin') {
      return res.status(403).json({
        code: 403,
        message: '权限不足，只有管理员可以查看token历史'
      });
    }

    // 读取历史记录文件
    let history = [];
    try {
      if (fs.existsSync(TOKEN_LOG_FILE)) {
        const fileContent = fs.readFileSync(TOKEN_LOG_FILE, 'utf8');
        const entries = fileContent.split('---\n').filter(entry => entry.trim());

        history = entries.map(entry => {
          try {
            return JSON.parse(entry.trim());
          } catch (e) {
            return null;
          }
        }).filter(entry => entry !== null);

        // 按时间倒序排列
        history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      }
    } catch (error) {
      console.error('读取token历史文件失败:', error);
    }

    res.json({
      code: 0,
      message: 'success',
      data: {
        history: history,
        total: history.length,
        log_file: TOKEN_LOG_FILE
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('获取token历史错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      error: error.message
    });
  }
});


// 生成随机字符串的函数
function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 生成预定义虚假ECPM数据的函数 - 改进版
async function generateFakeEcpmDataForTargetUsers(appId, queryDate = null) {
  try {
    // 先检查缓存
    const cachedData = getCachedFakeEcpmData(appId, queryDate);
    if (cachedData) {
      return cachedData;
    }

    console.log(`🎭 开始生成新的虚假ECPM数据: appId=${appId}, queryDate=${queryDate}`);
    const fakeRecords = [];

  // 获取应用名称（从数据库查询）
  let appName = '测试游戏';
  try {
    // 使用Sequelize查询应用名称
    const game = await Game.findOne({
      where: { appid: appId },
      attributes: ['name']
    });
    if (game && game.name) {
      appName = game.name;
    }

  } catch (error) {
    console.log('获取应用名称失败，使用默认名称:', error.message);
  }

  // 如果指定了查询日期，只生成该日期的数据，否则使用默认日期范围
  const dateRange = queryDate ? [queryDate] : ['2025-11-20', '2025-11-21', '2025-11-22', '2025-11-23', '2025-11-24', '2025-11-25'];

  // 单日查询时总收益在12000000-19000000元之间（千万元级别）
  const totalRevenueTarget = queryDate ? Math.floor(Math.random() * 7000001) + 12000000 : 15000000; // 12000000-19000000随机

  // 来源选项：抖音或头条
  const sourceOptions = ['抖音', '头条'];

  // 第一步：生成低收益记录（4-6条，0-10分，即0-0.001元）
  const lowRevenueRecords = [];
  const lowRevenueCount = Math.floor(Math.random() * 10) + 25
  let totalRevenue = 0;

  for (let i = 0; i < lowRevenueCount; i++) {
    const randomDate = dateRange[Math.floor(Math.random() * dateRange.length)];
    const lowRevenue = Math.floor(Math.random() * 101); // 0-10000分（0-1万元）
    const source = sourceOptions[Math.floor(Math.random() * sourceOptions.length)];

    // 验证日期格式
    if (!randomDate || !/^\d{4}-\d{2}-\d{2}$/.test(randomDate)) {
      console.error('❌ 无效的日期格式:', randomDate);
      continue;
    }

    // 随机时间（9:00-15:00，低收益记录使用较早时间）
    const hour = Math.floor(Math.random() * 23); // 9-14小时
    const minute = Math.floor(Math.random() * 60);
    const second = Math.floor(Math.random() * 60);
    const eventTime = `${randomDate}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}.000Z`;

    lowRevenueRecords.push({
      date: randomDate,
      eventTime,
      revenue: lowRevenue,
      source,
      recordId: i
    });
    totalRevenue += lowRevenue;
  }

  // 第二步：生成正常收益记录（3-4条，2000000-8000000分，即200万-800万元）
  const normalRecords = [];
  const normalRevenueCount = Math.floor(Math.random() * 2) + 3 // 3-4条
  const revenueOptions = [3000000, 3500000, 4000000, 4500000, 5000000, 5500000, 6000000, 6500000, 7000000];

  for (let i = 0; i < normalRevenueCount; i++) {
    const randomDate = dateRange[Math.floor(Math.random() * dateRange.length)];
    const revenue = revenueOptions[Math.floor(Math.random() * revenueOptions.length)];
    const source = sourceOptions[Math.floor(Math.random() * sourceOptions.length)];

    // 验证日期格式
    if (!randomDate || !/^\d{4}-\d{2}-\d{2}$/.test(randomDate)) {
      console.error('❌ 无效的日期格式:', randomDate);
      continue;
    }

    // 生成时间戳（集中在半小时以内，正常收益记录使用较晚时间）
    let eventTime;
    try {
      // 随机选择一个30分钟的时间窗口（15:00-20:30之间）
      const baseHour = 10 + Math.floor(Math.random() * 6); // 15-20小时
      const baseMinute = Math.floor(Math.random() * 60); // 0-59分钟

      // 在这个时间点的基础上，随机分布在30分钟以内
      const timeOffsetMinutes = Math.random() * 30; // 0-30分钟随机偏移

      const baseTime = new Date(`${randomDate}T${String(baseHour).padStart(2, '0')}:${String(baseMinute).padStart(2, '0')}:00.000Z`);
      eventTime = new Date(baseTime.getTime() + timeOffsetMinutes * 60 * 1000).toISOString();
    } catch (dateError) {
      console.error('❌ 创建日期对象失败:', dateError.message, '日期:', randomDate);
      continue;
    }

    normalRecords.push({
      date: randomDate,
      eventTime,
      revenue,
      source,
      recordId: lowRevenueCount + i
    });
    totalRevenue += revenue;
  }

  // 第三步：调整收益以达到目标总收益
  const targetRevenueCents = totalRevenueTarget * 100; // 转换为分
  const currentRevenueCents = totalRevenue;

  if (currentRevenueCents > targetRevenueCents) {
    // 如果超过目标，随机减少一些记录的收益
    const excess = currentRevenueCents - targetRevenueCents;
    let adjusted = 0;

    // 优先调整正常收益记录
    const recordsToAdjust = [...normalRecords].sort(() => Math.random() - 0.5);

    for (const record of recordsToAdjust) {
      if (adjusted >= excess) break;

      const maxReduce = Math.min(record.revenue - 2000000, excess - adjusted); // 不能低于2000000分
      if (maxReduce > 0) {
        const reduce = Math.min(maxReduce, Math.floor(Math.random() * maxReduce) + 1);
        record.revenue -= reduce;
        adjusted += reduce;
      }
    }

    totalRevenue = [...lowRevenueRecords, ...normalRecords].reduce((sum, r) => sum + r.revenue, 0);
  } else if (currentRevenueCents < targetRevenueCents) {
    // 如果低于目标，增加一些记录的收益
    const deficit = targetRevenueCents - currentRevenueCents;
    let adjusted = 0;

    // 优先增加正常收益记录
    const recordsToAdjust = [...normalRecords].sort(() => Math.random() - 0.5);

    for (const record of recordsToAdjust) {
      if (adjusted >= deficit) break;

      const maxIncrease = Math.min(8000000 - record.revenue, deficit - adjusted); // 不能超过8000000分
      if (maxIncrease > 0) {
        const increase = Math.min(maxIncrease, Math.floor(Math.random() * maxIncrease) + 1);
        record.revenue += increase;
        adjusted += increase;
      }
    }

    totalRevenue = [...lowRevenueRecords, ...normalRecords].reduce((sum, r) => sum + r.revenue, 0);
  }

  // 第四步：创建所有记录
  // 低收益记录
  for (const record of lowRevenueRecords) {
    const fakeRecord = {
      id: `fake_low_${appId}_${record.date}_${record.recordId}`,
      event_time: record.eventTime,
      app_name: appName,
      source: record.source,
      username: `用户${Math.floor(Math.random() * 1000) + 1}`,
      open_id: `_0004${generateRandomString(32)}`,
      revenue: (record.revenue / 100000).toFixed(5), // 低收益，除以1000，保留5位小数
      aid: `fake_low_aid_${Math.floor(Math.random() * 1000000000)}`,
      isBound: false
    };
    fakeRecords.push(fakeRecord);
  }

  // 正常收益记录 - 所有记录使用同一个用户ID（全局固定活跃用户）
  const fixedActiveUsername = '活跃用户001'; // 全局固定活跃用户名
  const fixedActiveOpenId = '_0004ACTIVEUSERFIXEDOPENID123456789'; // 全局固定活跃用户OpenID

  for (const record of normalRecords) {
    const fakeRecord = {
      id: `fake_${appId}_${record.date}_${record.recordId}`,
      event_time: record.eventTime,
      app_name: appName,
      source: record.source,
      username: fixedActiveUsername, // 使用全局固定活跃用户名
      open_id: fixedActiveOpenId, // 使用全局固定活跃用户OpenID
      revenue: (record.revenue / 100000).toFixed(5), // 转换为元，除以1000，保留5位小数
      aid: `fake_aid_${Math.floor(Math.random() * 1000000000)}`,
      isBound: false
    };
    fakeRecords.push(fakeRecord);
  }

  console.log(`为用户生成虚假ECPM数据: 游戏${appId}(${appName}), 查询日期${queryDate || '全部'}, 总记录数${fakeRecords.length}, 总收益${totalRevenue/100000}元（万元级别）, 低收益记录${lowRevenueCount}条, 正常收益记录${normalRevenueCount}条`);

  // 按时间排序所有记录
  fakeRecords.sort((a, b) => new Date(a.event_time) - new Date(b.event_time));

  // 保存到缓存
  setCachedFakeEcpmData(appId, queryDate, fakeRecords);

  return fakeRecords;
} catch (error) {
  console.error('❌ 生成虚假ECPM数据时发生错误:', error);
  console.error('错误详情:', {
    appId,
    queryDate,
    errorMessage: error.message,
    errorStack: error.stack
  });
  // 返回空数组而不是抛出错误，避免中断整个流程
  return [];
}
}

// 格式化剩余时间
function formatTimeUntilRefresh(milliseconds) {
  if (milliseconds <= 0) return '即将刷新';

  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

  return `${hours}小时${minutes}分钟${seconds}秒`;
}

// 统一的响应格式函数
const createResponse = (success, data, message, code = null) => {
  const response = {
    success,
    message,
    data,
    timestamp: new Date().toISOString()
  };

  if (code !== null) {
    response.code = code;
  }

  return response;
};

// 统一的错误响应函数
const errorResponse = (res, statusCode, message, error = null, code = null) => {
  const response = createResponse(false, null, message, code || statusCode);

  if (error && process.env.NODE_ENV === 'development') {
    response.error = error.message;
    response.stack = error.stack;
  }

  return res.status(statusCode).json(response);
};

// 统一的成功响应函数
const successResponse = (res, data, message = '操作成功', code = 20000) => {
  return res.status(200).json(createResponse(true, data, message, code));
};

// 错误处理中间件
app.use((error, req, res, next) => {
  console.error('服务器错误:', error);

  // 处理特定的错误类型
  if (error.name === 'ValidationError') {
    return errorResponse(res, 400, '数据验证失败', error, 400);
  }

  if (error.name === 'UnauthorizedError') {
    return errorResponse(res, 401, '未授权访问', error, 401);
  }

  return errorResponse(res, 500, '服务器内部错误', error, 500);
});

// 404处理
app.use((req, res) => {
  errorResponse(res, 404, '接口不存在', null, 404);
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
      const { dbConfig } = require('./config/database');
      if (dbConfig.dialect === 'sqlite') {
        console.log('   1. 项目目录可写（database.sqlite 文件）');
        console.log('   2. sequelize 和 sqlite3 依赖已安装');
        console.log('   3. 运行: node scripts/init-db.js');
      } else {
        console.log('   1. PostgreSQL服务正在运行');
        console.log('   2. .env文件配置正确');
        console.log('   3. 数据库和用户已创建');
        console.log('   4. 运行: node scripts/init-db.js');
      }
      process.exit(1);
    }

    // 从数据库加载token
    await loadTokensFromDatabase();

    // 启动Token自动刷新调度器
    startTokenRefreshScheduler();

    // 启动服务器
    app.listen(PORT, () => {
      console.log(`🚀 服务器运行在端口 ${PORT}`);
      console.log(`📡 Webhook地址: http://localhost:${PORT}/api/douyin/webhook`);
      console.log(`🔍 健康检查: http://localhost:${PORT}/api/health`);
      console.log(`🔐 用户认证: http://localhost:${PORT}/api/user/login`);
      console.log(`📊 转化事件回调: http://localhost:${PORT}/api/conversion/callback`);
      console.log(`📋 事件类型列表: http://localhost:${PORT}/api/conversion/event-types`);
      console.log(`🎯 归因方式列表: http://localhost:${PORT}/api/conversion/match-types`);
      console.log(`📈 转化事件统计: http://localhost:${PORT}/api/conversion/stats`);
      console.log(`📝 转化事件列表: http://localhost:${PORT}/api/conversion/events`);
      console.log(`🎫 广告投放Token刷新状态: 按需刷新（过期前5分钟）`);

    });

  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

// 启动服务器
startServer();
