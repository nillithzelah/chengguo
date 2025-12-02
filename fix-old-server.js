// 修复老服务器问题的脚本
// 这个脚本包含了修复语法错误后的server.js代码
// 可以直接在老服务器上运行

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
};

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
  }
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
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        logger.warn('JWT验证失败:', err.message);
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  } else {
    logger.warn('缺少认证头');
    res.sendStatus(401);
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

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// 统一的错误响应函数
const errorResponse = (res, statusCode, message, error = null, code = null) => {
  const response = {
    success: false,
    message,
    data: null,
    timestamp: new Date().toISOString()
  };

  if (code !== null) {
    response.code = code;
  }

  if (error && process.env.NODE_ENV === 'development') {
    response.error = error.message;
    response.stack = error.stack;
  }

  return res.status(statusCode).json(response);
};

// 统一的成功响应函数
const successResponse = (res, data, message = '操作成功', code = 20000) => {
  return res.status(200).json({
    success: true,
    data,
    message,
    code,
    timestamp: new Date().toISOString()
  });
};

// 错误处理中间件
app.use((error, req, res, next) => {
  console.error('服务器错误:', error);
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
      process.exit(1);
    }

    // 从数据库加载token
    await loadTokensFromDatabase();

    // 启动服务器
    app.listen(PORT, () => {
      console.log(`🚀 服务器运行在端口 ${PORT}`);
      console.log(`📡 Webhook地址: http://localhost:${PORT}/api/douyin/webhook`);
      console.log(`🔍 健康检查: http://localhost:${PORT}/api/health`);
      console.log(`🔐 用户认证: http://localhost:${PORT}/api/user/login`);
    });

  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

// 启动服务器
startServer();