# PostgreSQL 用户数据存储实现

## 📋 概述

本项目已成功实现基于PostgreSQL的用户数据存储系统，替代了原有的硬编码用户数据和IndexedDB存储方案。

## 🏗️ 架构设计

### 1. 数据库配置
- **文件**: `config/database.js`
- **功能**: Sequelize ORM配置，数据库连接管理
- **特性**: 连接池、事务支持、环境变量配置

### 2. 用户模型
- **文件**: `models/User.js`
- **功能**: 用户数据模型定义
- **特性**:
  - 密码bcrypt加密
  - 数据验证
  - 便捷查询方法
  - 前端数据格式转换

### 3. 数据库初始化
- **文件**: `scripts/init-db.js`
- **功能**: 数据库表创建和初始数据填充
- **特性**: 自动创建管理员和测试用户

### 4. API接口
- **文件**: `server.js`
- **功能**: 用户认证和数据管理API
- **特性**:
  - JWT token认证
  - 密码验证
  - 用户信息管理
  - 新用户创建

## 🔐 安全特性

### 密码安全
- 使用bcrypt进行密码哈希
- 盐值轮数: 10
- 密码永不以明文存储

### JWT认证
- Token过期时间: 24小时
- 安全的密钥配置
- 请求头认证中间件

### 数据验证
- 用户名唯一性检查
- 邮箱格式验证
- 密码强度要求

## 👥 用户角色系统

### 角色类型
- **admin**: 管理员 - 可查看所有用户数据，管理所有游戏
- **user**: 普通用户 - 只能查看自己的数据和被分配的游戏
- **moderator**: 审核员 - 具有审核权限
- **viewer**: 查看用户 - 可以查看游戏数据，但不能创建、修改或删除游戏
- **super_viewer**: 超级查看者（老板） - 可以查看所有内容，但不能进行任何修改操作

### 游戏权限角色
- **owner**: 所有者 - 完全控制游戏，可以修改配置
- **editor**: 编辑者 - 可以编辑游戏数据
- **viewer**: 查看者 - 只能查看游戏数据

### 权限控制
- 前端根据用户角色显示不同功能
- 后端API根据角色限制数据访问
- 应用列表按用户角色过滤

## 🚀 使用指南

### 1. 环境配置
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑数据库配置
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=chengguo_db
# DB_USER=postgres
# DB_PASSWORD=your_password
```

### 2. 数据库初始化
```bash
# 初始化数据库和表结构
npm run db:init

# 或者手动运行
node scripts/init-db.js
```

### 3. 数据库清理（可选）
```bash
# 清理不再需要的表（如旧的eCPM数据表）
npm run db:cleanup

# 或者手动运行
node scripts/cleanup-db.js
```

### 3. 启动服务
```bash
# 启动后端服务
npm run server

# 启动前端开发服务器
npm run dev
```

## 👤 默认用户账号

### 系统预设用户
| 用户名 | 密码 | 角色 | 权限 |
|--------|------|------|------|
| admin | admin123 | admin | 管理员，可查看所有数据 |
| user | user123 | user | 普通用户，只能查看自己的数据 |
| moderator | mod123 | moderator | 审核员，具有审核权限 |
| viewer | viewer123 | viewer | 查看用户，可以查看游戏但不能修改 |
| boss | boss123 | super_viewer | 老板，可以查看所有内容但不能修改 |

### 动态创建用户
通过前端界面可以创建新用户，所有新用户都会：
- 密码通过bcrypt加密存储
- 保存到PostgreSQL数据库
- 支持角色分配

## 📊 数据表结构

### users表
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  role ENUM('admin', 'user', 'moderator') DEFAULT 'user',
  avatar TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### games表
```sql
CREATE TABLE games (
  id SERIAL PRIMARY KEY,
  appid VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  app_secret TEXT NOT NULL,
  description TEXT,
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  validated BOOLEAN DEFAULT FALSE,
  validated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### user_games表 (用户-游戏关联表)
```sql
CREATE TABLE user_games (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  role ENUM('owner', 'viewer', 'editor') DEFAULT 'viewer',
  permissions JSON DEFAULT '{}',
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, game_id)
);
```

## 📝 eCPM数据存储策略

### 🎯 为什么不存储eCPM数据？

**经过分析，我们决定不建立eCPM数据表，采用实时查询策略：**

#### ✅ **优势分析**
- **实时性** - 数据每天更新，直接调用API确保数据最新
- **成本效益** - 减少存储成本和维护复杂度
- **准确性** - 避免数据同步延迟问题
- **简单性** - 无需复杂的定时任务和数据清理

#### ❌ **传统存储方案的问题**
- 数据量巨大，每天新增数千条记录
- 需要复杂的同步机制
- 存储成本高
- 数据很快过时

### 🔄 eCPM数据获取流程

```javascript
// 后端API实现
app.get('/api/douyin/ecpm', async (req, res) => {
  const { mp_id, date_hour } = req.query;

  try {
    // 1. 获取access_token
    const tokenData = await fetchDouyinTokenAPI(mp_id);

    // 2. 调用eCPM数据API
    const ecpmData = await fetchDouyinEcpmAPI({
      mp_id,
      date_hour,
      access_token: tokenData.access_token
    });

    // 3. 返回实时数据
    res.json(ecpmData);

  } catch (error) {
    console.error('eCPM数据获取失败:', error);
    res.status(500).json({ error: '获取数据失败' });
  }
});
```

### 💾 可选的缓存策略

```javascript
// 如需性能优化，可添加简单缓存
const ecpmCache = new Map();
const CACHE_DURATION = 60 * 60 * 1000; // 1小时

const getEcpmData = async (gameId, date) => {
  const cacheKey = `${gameId}_${date}`;

  // 检查缓存
  const cached = ecpmCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  // 缓存失效，调用API
  const freshData = await fetchDouyinEcpmAPI(gameId, date);

  // 更新缓存
  ecpmCache.set(cacheKey, {
    data: freshData,
    timestamp: Date.now()
  });

  return freshData;
};
```

### 📊 数据使用场景

#### **当前支持的场景**
- ✅ 实时数据查看
- ✅ 简单数据筛选
- ✅ 基础统计展示
- ✅ 数据导出功能

#### **可选的历史数据存储**
如果将来需要历史数据分析，可以考虑：
- 📈 趋势分析
- 📊 复杂报表
- 💾 数据备份
- 📋 审计合规

## 🔧 API接口列表

### 用户认证
- `POST /api/user/login` - 用户登录
- `POST /api/user/logout` - 用户登出
- `GET /api/user/info` - 获取用户信息
- `POST /api/user/info` - 更新用户信息

### 用户管理
- `POST /api/user/create` - 创建新用户

### 数据查询
- `GET /api/douyin/ecpm` - 获取eCPM数据
- `POST /api/douyin/test-connection` - 测试应用连接

### 游戏管理
- `GET /api/games` - 获取用户可访问的游戏列表
- `POST /api/games` - 创建新游戏 (管理员)
- `PUT /api/games/:id` - 更新游戏信息 (管理员)
- `DELETE /api/games/:id` - 删除游戏 (管理员)

### 用户游戏权限管理
- `POST /api/games/:gameId/users` - 为用户分配游戏权限 (管理员)
- `DELETE /api/games/:gameId/users/:userId` - 移除用户游戏权限 (管理员)
- `PUT /api/games/:gameId/users/:userId/role` - 更新用户游戏角色 (管理员)

## 🎯 核心特性

### 1. 数据持久化
- 所有用户数据存储在PostgreSQL
- 支持ACID事务
- 数据备份和恢复

### 2. 角色权限
- 基于角色的访问控制
- 前端界面根据角色动态调整
- 后端API权限验证

### 3. 密码安全
- bcrypt哈希算法
- 防止彩虹表攻击
- 安全的密码重置流程

### 4. 可扩展性
- Sequelize ORM支持
- 易于添加新字段
- 支持数据库迁移

## 🐛 故障排除

### 数据库连接问题
```bash
# 检查PostgreSQL服务状态
sudo systemctl status postgresql

# 测试数据库连接
npm run db:test
```

### 用户登录问题
```bash
# 检查用户是否存在
node -e "require('./models/User').findAll().then(users => console.log(users))"

# 重置数据库
npm run db:init -- --force
```

### 数据库清理问题
```bash
# 清理不再需要的表
npm run db:cleanup

# 检查数据库表结构
node -e "require('./config/database').sequelize.getQueryInterface().showAllTables().then(tables => console.log(tables))"
```

### 权限问题
- 确保用户角色正确设置
- 检查前端权限控制逻辑
- 验证JWT token有效性

## 📈 性能优化

### 数据库索引
- username字段唯一索引
- email字段唯一索引
- role字段普通索引
- is_active字段普通索引

### 查询优化
- 使用Sequelize查询构建器
- 支持分页查询
- 缓存常用数据

## 🔄 迁移指南

### 从IndexedDB迁移
1. 导出IndexedDB数据
2. 转换为PostgreSQL格式
3. 使用初始化脚本导入

### 从Mock数据迁移
1. 运行数据库初始化
2. 手动创建用户账号
3. 更新前端配置

## 📝 开发说明

### 添加新字段
1. 修改User模型
2. 运行数据库迁移
3. 更新前端类型定义

### 添加新角色
1. 更新RoleType类型
2. 修改权限控制逻辑
3. 更新前端界面

### 密码策略
- 最小长度: 6字符
- 支持特殊字符
- 定期更换建议

---

## ✅ 实现状态

- ✅ PostgreSQL数据库配置
- ✅ 用户模型和验证
- ✅ 密码加密存储
- ✅ JWT认证系统
- ✅ 角色权限控制
- ✅ 游戏模型和关联表
- ✅ 用户-游戏多对多关系
- ✅ 游戏权限管理
- ✅ eCPM数据实时查询策略（不存储）
- ✅ 前后端数据同步
- ✅ 数据库初始化脚本
- ✅ API接口实现
- ✅ 错误处理和日志
- ✅ 安全配置和验证

## 🎯 优化亮点

### 🚀 **架构优化**
- **eCPM数据** - 采用实时查询，减少存储成本
- **缓存策略** - 可选的内存缓存提升性能
- **权限管理** - 精细化的用户游戏权限控制

### 💰 **成本效益**
- **存储成本** - 减少不必要的数据存储
- **维护成本** - 简化数据同步和清理逻辑
- **开发效率** - 专注于核心业务逻辑

### 📈 **性能提升**
- **实时性** - 确保数据始终是最新的
- **响应速度** - 减少数据库查询开销
- **可扩展性** - 支持未来功能扩展

 **PostgreSQL用户数据存储系统已优化完成，采用更高效的数据处理策略！**