# 数据库操作指南

## 📋 概述

本项目默认使用 SQLite 数据库（开发环境），支持切换到 PostgreSQL（生产环境），通过 Sequelize ORM 进行数据操作。本文档提供常用的数据库操作命令和脚本使用指南。

## 🔧 数据库配置

### 环境变量设置
```bash
# 复制环境变量模板
cp .env.example .env

# SQLite 配置（默认，开发环境推荐）
# DB_TYPE=sqlite  # 默认值，无需设置

# PostgreSQL 配置（生产环境可选）
# DB_TYPE=postgres
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=chengguo_db
# DB_USER=postgres
# DB_PASSWORD=your_password
```

### 测试连接
```bash
# 测试数据库连接
node scripts/test-db-connection.js
```

## 📊 数据表结构

### users表
- id: 主键
- username: 用户名（唯一）
- password_hash: 密码哈希
- name: 姓名
- email: 邮箱（唯一）
- role: 角色（admin/user/moderator）
- is_active: 是否活跃
- last_login_at: 最后登录时间
- created_at: 创建时间

### games表
- id: 主键
- appid: 应用ID（唯一）
- name: 游戏名称
- app_secret: 应用密钥
- description: 描述
- status: 状态（active/inactive/suspended）
- validated: 是否验证
- validated_at: 验证时间
- created_at: 创建时间

### user_games表
- id: 主键
- user_id: 用户ID
- game_id: 游戏ID
- role: 权限角色（owner/editor/viewer）
- permissions: 权限JSON
- assigned_at: 分配时间
- assigned_by: 分配人ID

### user_devices表
- id: 主键
- user_id: 用户ID
- device_id: 设备唯一标识
- device_brand: 设备品牌
- device_model: 设备型号
- friendly_model: 友好型号名称
- platform: 平台
- browser_name: 浏览器名称
- browser_version: 浏览器版本
- os_name: 操作系统名称
- os_version: 操作系统版本
- device_type: 设备类型
- screen_width: 屏幕宽度
- screen_height: 屏幕高度
- screen_pixel_ratio: 屏幕像素比
- viewport_width: 视窗宽度
- viewport_height: 视窗高度
- language: 语言
- timezone: 时区
- user_agent: User-Agent字符串
- ip_address: IP地址
- is_current_device: 是否为当前使用的设备
- last_login_at: 最后登录时间
- login_count: 登录次数
- environment: 运行环境
- created_at: 创建时间
- updated_at: 更新时间

## 🚀 常用脚本

### 数据库初始化
```bash
# 初始化数据库和表结构
npm run db:init
# 或
node scripts/init-db.js
```

### 查看数据库数据
```bash
# 显示所有表的数据
node scripts/show-db-data.js
```

### 命令行查询工具
```bash
# 显示帮助信息
node scripts/query-db.js help

# 查询所有用户
node scripts/query-db.js users

# 查询特定用户
node scripts/query-db.js user <user_id>

# 查询所有游戏
node scripts/query-db.js games

# 查询特定游戏
node scripts/query-db.js game <appid>

# 删除游戏（危险操作！）
node scripts/query-db.js delete-game <game_id或appid>

# 查询用户游戏关联
node scripts/query-db.js user-games

# 显示统计信息
node scripts/query-db.js stats
```

### 初始化用户游戏关联
```bash
# 初始化用户和游戏的关联关系
node scripts/init-user-games.js
```

### 数据库清理
```bash
# 清理不再需要的表
npm run db:cleanup
# 或
node scripts/cleanup-db.js
```

## 🔍 数据查询操作

### 查看用户数据
```javascript
// 获取所有用户
const users = await User.findAll();

// 根据ID查找用户
const user = await User.findByPk(userId);

// 根据用户名查找
const user = await User.findOne({ where: { username: 'admin' } });
```

### 查看游戏数据
```javascript
// 获取所有游戏
const games = await Game.findAll();

// 获取活跃游戏
const activeGames = await Game.findAll({
  where: { status: 'active' }
});

// 根据应用ID查找游戏
const game = await Game.findOne({ where: { appid: 'tt8c62fadf136c334702' } });
```

### 查看用户游戏关联
```javascript
// 获取用户的所有游戏
const userGames = await UserGame.findAll({
  where: { user_id: userId },
  include: [Game]
});

// 获取游戏的所有用户
const gameUsers = await UserGame.findAll({
  where: { game_id: gameId },
  include: [User]
});
```

### 查看用户设备信息
```javascript
// 获取用户的所有设备
const userDevices = await UserDevice.findAll({
  where: { user_id: userId },
  order: [['last_login_at', 'DESC']]
});

// 获取用户的当前设备
const currentDevice = await UserDevice.findOne({
  where: {
    user_id: userId,
    is_current_device: true
  }
});

// 根据设备ID查找设备
const device = await UserDevice.findOne({
  where: { device_id: 'device123' }
});
```

## ✏️ 数据修改操作

### 创建用户
```javascript
const newUser = await User.create({
  username: 'newuser',
  password_hash: hashedPassword,
  name: '新用户',
  email: 'newuser@example.com',
  role: 'user'
});
```

### 创建游戏
```javascript
const newGame = await Game.create({
  appid: 'tt123456789',
  name: '新游戏',
  app_secret: 'secret_key',
  description: '游戏描述',
  status: 'active'
});
```

### 分配用户游戏权限
```javascript
const userGame = await UserGame.create({
  user_id: userId,
  game_id: gameId,
  role: 'viewer',
  assigned_by: adminId
});
```

### 创建设备记录
```javascript
const deviceInfo = {
  device_id: 'device123',
  device_brand: 'Apple',
  device_model: 'iPhone 12',
  platform: 'iOS',
  browser_name: 'Safari',
  os_name: 'iOS',
  device_type: 'mobile',
  screen_width: 375,
  screen_height: 812,
  ip_address: '192.168.1.1'
};

const device = await UserDevice.findOrCreateDevice(userId, deviceInfo);
```

### 设置当前设备
```javascript
await UserDevice.setCurrentDevice(userId, 'device123');
```

### 更新数据
```javascript
// 更新用户信息
await User.update(
  { name: '新姓名' },
  { where: { id: userId } }
);

// 更新游戏状态
await Game.update(
  { status: 'inactive' },
  { where: { id: gameId } }
);
```

### 删除数据
```javascript
// 删除用户游戏关联
await UserGame.destroy({
  where: { user_id: userId, game_id: gameId }
});

// 删除游戏（谨慎操作）
await Game.destroy({
  where: { id: gameId }
});
```

## 🔐 用户认证操作

### 用户登录验证
```javascript
const user = await User.findOne({ where: { username } });
if (user && await bcrypt.compare(password, user.password_hash)) {
  // 登录成功
  const token = jwt.sign({ id: user.id, role: user.role }, secret);
}
```

### 密码重置
```javascript
const hashedPassword = await bcrypt.hash(newPassword, 10);
await User.update(
  { password_hash: hashedPassword },
  { where: { id: userId } }
);
```

## 📈 统计查询

### 用户统计
```javascript
// 总用户数
const totalUsers = await User.count();

// 活跃用户数
const activeUsers = await User.count({
  where: { is_active: true }
});

// 按角色统计
const roleStats = await User.findAll({
  attributes: [
    'role',
    [sequelize.fn('COUNT', sequelize.col('role')), 'count']
  ],
  group: 'role'
});
```

### 游戏统计
```javascript
// 总游戏数
const totalGames = await Game.count();

// 活跃游戏数
const activeGames = await Game.count({
  where: { status: 'active' }
});

// 已验证游戏数
const validatedGames = await Game.count({
  where: { validated: true }
});
```

### 设备统计
```javascript
// 用户设备总数
const totalDevices = await UserDevice.count();

// 某用户的设备数
const userDeviceCount = await UserDevice.count({
  where: { user_id: userId }
});

// 按设备品牌统计
const brandStats = await UserDevice.findAll({
  attributes: [
    'device_brand',
    [sequelize.fn('COUNT', sequelize.col('device_brand')), 'count']
  ],
  group: 'device_brand',
  order: [[sequelize.fn('COUNT', sequelize.col('device_brand')), 'DESC']]
});

// 按设备类型统计
const typeStats = await UserDevice.findAll({
  attributes: [
    'device_type',
    [sequelize.fn('COUNT', sequelize.col('device_type')), 'count']
  ],
  group: 'device_type'
});
```

## 🔗 关联查询

### 获取用户及其游戏
```javascript
const userWithGames = await User.findOne({
  where: { id: userId },
  include: [{
    model: Game,
    through: { attributes: ['role', 'assigned_at'] }
  }]
});
```

### 获取游戏及其用户
```javascript
const gameWithUsers = await Game.findOne({
  where: { id: gameId },
  include: [{
    model: User,
    through: { attributes: ['role', 'assigned_at'] }
  }]
});
```

## 🛠️ 维护操作

### 数据库备份
```bash
# SQLite 备份（推荐，简单快速）
cp database.sqlite database_backup_$(date +%Y%m%d_%H%M%S).sqlite

# PostgreSQL 备份（如果使用 PostgreSQL）
# pg_dump -h localhost -U postgres -d chengguo_db > backup.sql
```

### 数据库恢复
```bash
# SQLite 恢复
cp database_backup_YYYYMMDD_HHMMSS.sqlite database.sqlite

# PostgreSQL 恢复（如果使用 PostgreSQL）
# psql -h localhost -U postgres -d chengguo_db < backup.sql
```

### 清理过期数据
```javascript
// 删除非活跃用户（谨慎操作）
await User.destroy({
  where: {
    is_active: false,
    created_at: {
      [Op.lt]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30天前
    }
  }
});

// 清理用户的旧设备记录（保留最近10个）
await UserDevice.cleanupOldDevices(userId, 10);

// 清理所有用户的旧设备记录
const users = await User.findAll({ attributes: ['id'] });
for (const user of users) {
  await UserDevice.cleanupOldDevices(user.id, 10);
}
```

## ⚠️ 注意事项

1. **密码安全**: 密码必须通过bcrypt哈希后存储
2. **外键约束**: 删除用户时会自动删除关联的user_games和user_devices记录
3. **事务**: 重要操作建议使用事务保证数据一致性
4. **权限检查**: 修改操作前检查用户权限
5. **数据验证**: 插入数据前进行必要的验证
6. **设备信息**: 用户设备信息应定期更新，保留最近的设备记录以节省存储空间
7. **隐私保护**: 设备信息包含敏感数据，需遵守隐私政策和数据保护法规

## 🐛 常见问题

### 连接失败
- **SQLite**: 检查 `database.sqlite` 文件是否存在和权限
- **PostgreSQL**: 检查服务是否启动（`systemctl status postgresql`）
- 验证环境变量配置（`cat .env | grep DB_`）
- 运行测试命令：`node scripts/test-db-connection.js`

### 权限错误
- 检查用户角色设置
- 验证JWT token有效性
- 确认API权限控制

### 数据不一致
- 使用事务保证操作原子性
- 检查外键约束
- 验证数据完整性

---

**数据库操作时请谨慎，确保有备份后再进行重要修改操作。**