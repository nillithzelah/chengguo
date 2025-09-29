# 🚀 Token数据库功能部署指南

## 📋 部署概述

本次更新实现了抖音API Token的数据库存储和自动刷新功能，主要改进包括：

- ✅ Token持久化存储（重启服务器不丢失）
- ✅ 自动刷新机制（每10分钟自动刷新）
- ✅ Token历史记录（记录每次刷新事件）
- ✅ 数据库自动创建（无需手动建表）

## 📁 需要上传的文件

```
server.js                    # 主服务器文件（已更新）
models/Token.js             # Token数据库模型
scripts/init-tokens.js      # Token初始化脚本
config/database.js          # 数据库配置（已更新）
.gitignore                  # Git忽略文件（已更新）
```

## 🔧 部署步骤

### 1. 上传文件到服务器

在本地项目目录执行：

```bash
scp server.js models/Token.js scripts/init-tokens.js config/database.js .gitignore root@47.115.94.203:/var/www/douyin-admin-master/
```

**服务器信息：**
- IP: `47.115.94.203`
- 用户名: `root`
- 项目路径: `/var/www/douyin-admin-master`

⚠️ **安全提醒**: 请勿在文档中存储密码信息。使用环境变量或密钥管理工具。

### 2. 在服务器上重启应用

连接到服务器后执行：

```bash
# 进入项目目录
cd /var/www/douyin-admin-master

# 停止当前运行的服务器
pkill -f "node server.js"

# 安装依赖（如果有新依赖）
npm install

# 启动服务器
nohup node server.js > server.log 2>&1 &

# 等待3秒
sleep 3

# 检查服务器是否启动成功
ps aux | grep "node server.js"

# 测试健康检查
curl -s http://localhost:3000/api/health
```

### 3. 验证部署成功

```bash
# 检查Token状态
curl -s "http://localhost:3000/api/douyin/token-status"

# 检查Token历史记录（需要管理员权限）
curl -s -H "Authorization: Bearer YOUR_JWT_TOKEN" "http://localhost:3000/api/douyin/token-history"
```

## 🔍 功能验证

### 自动刷新测试
- 系统会每10分钟自动刷新一次Token
- 查看 `server.log` 文件确认自动刷新日志
- 检查 `token-refresh-history.log` 文件确认历史记录

### API测试
- `GET /api/douyin/token-status` - 查看Token状态
- `POST /api/douyin/refresh-token` - 手动刷新Token
- `GET /api/douyin/tokens` - 查看所有Token记录（管理员）
- `GET /api/douyin/token-history` - 查看Token历史（管理员）

## 📊 数据库表结构

系统会自动创建 `tokens` 表：

```sql
CREATE TABLE tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_type ENUM('access_token', 'refresh_token'),
  token_value TEXT NOT NULL,
  expires_at DATETIME,
  last_refresh_at DATETIME,
  is_active BOOLEAN DEFAULT 1,
  app_id VARCHAR(50),
  app_secret VARCHAR(100),
  description VARCHAR(255),
  created_at DATETIME,
  updated_at DATETIME
);
```

## ⚠️ 注意事项

1. **备份重要文件**：部署前建议备份服务器上的重要文件
2. **数据库兼容性**：系统支持SQLite和PostgreSQL
3. **自动初始化**：首次启动时会自动创建表和初始化数据
4. **日志文件**：`token-refresh-history.log` 包含敏感信息，请妥善保管

## 🎯 部署完成标志

- ✅ 服务器成功启动（端口3000）
- ✅ 健康检查返回 `{"status":"ok"}`
- ✅ Token状态API正常响应
- ✅ 自动刷新定时器启动（每10分钟）
- ✅ 数据库表自动创建

## 🔧 故障排除

### 如果服务器启动失败
```bash
# 查看错误日志
tail -f server.log

# 检查端口占用
netstat -tlnp | grep :3000

# 强制停止进程
pkill -9 -f "node server.js"
```

### 如果数据库连接失败
```bash
# 检查数据库文件权限
ls -la database.sqlite

# 重新初始化数据库
node scripts/init-db.js --force
```

---

**部署完成后，Token管理系统将完全自动化运行，无需手动干预！** 🎉