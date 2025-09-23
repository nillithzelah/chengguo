# 服务器配置文档

## 📋 服务器信息

### 基本信息
- **服务器 IP**: 47.115.94.203
- **服务器用户**: root
- **服务器端口**: 22 (SSH)
- **应用端口**: 80 (HTTP), 3000 (Node.js 后端)
- **域名**: ecpm.game985.vip (Nginx 配置)
- **项目目录**: /var/www/douyin-admin-master
- **静态文件目录**: /var/www/html (Nginx 托管前端)
- **后端服务**: Node.js + Express (端口 3000)
- **前端服务**: Vue 3 静态文件 (Nginx 代理)
- **数据库**: SQLite (database.sqlite 文件)

### 访问凭证
- **SSH 用户名**: root
- **SSH 密码**: 1qaz1QAZ1qaz
- **SSH 命令**:
  ```bash
  ssh root@47.115.94.203
  ```
- **默认登录用户** (应用内):
  - 管理员: username = `admin`, password = `admin123`
  - 测试用户: username = `user`, password = `user123`
  - 其他测试账号见 DATABASE-README.md

⚠️ **安全警告**: 上面的密码用于开发环境。请在生产环境中立即更改 SSH 密码和应用默认密码！建议使用密钥认证。

## 🔧 部署配置

### Nginx 配置
- **配置文件**: /etc/nginx/sites-available/douyin-admin
- **监听端口**: 80
- **静态文件**: /var/www/html (前端构建输出)
- **代理后端**: http://localhost:3000 (Node.js 服务)
- **日志文件**:
  - 访问日志: /var/log/nginx/douyin-admin.access.log
  - 错误日志: /var/log/nginx/douyin-admin.error.log

### Node.js 服务
- **启动脚本**: server.js (端口 3000)
- **进程管理**: PM2 (pm2 start server.js --name "douyin-admin")
- **应用日志**: app.log (项目目录下)
- **环境变量**: .env (项目根目录)

### 数据库配置
- **类型**: SQLite (默认开发环境)
- **文件位置**: /var/www/douyin-admin-master/database.sqlite
- **备份命令**:
  ```bash
  cp database.sqlite database.sqlite.backup.$(date +%Y%m%d_%H%M%S)
  ```
- **权限设置**:
  ```bash
  chown www-data:www-data database.sqlite
  chmod 664 database.sqlite
  ```

### 环境变量 (.env)
```
# 服务器配置
PORT=3000
NODE_ENV=production

# JWT 配置
JWT_SECRET=chengguo-jwt-secret-key-2024-change-in-production

# 数据库配置
DB_TYPE=sqlite

# 抖音 API 配置
VITE_DOUYIN_APP_ID=tt8c62fadf136c334702
VITE_DOUYIN_APP_SECRET=969c80995b1fc13fdbe952d73fb9f8c086706b6b
VITE_DOUYIN_ADVERTISER_ID=your_advertiser_id

# 日志级别
LOG_LEVEL=info
```

## 🚀 常用操作命令

### 登录服务器
```bash
# SSH 登录
ssh root@47.115.94.203

# 或者使用 SCP 上传文件
scp local-file root@47.115.94.203:/path/to/destination
```

### 项目管理
```bash
# 进入项目目录
cd /var/www/douyin-admin-master

# 查看进程状态
pm2 status

# 重启应用
pm2 restart all

# 查看日志
pm2 logs

# 停止应用
pm2 stop all

# 启动应用
pm2 start server.js --name "douyin-admin"

# 初始化数据库
node scripts/init-db.js

# 测试数据库连接
node scripts/test-db-connection.js

# 查看数据库数据
node scripts/query-db.js stats
```

### Nginx 管理
```bash
# 重启 Nginx
sudo systemctl restart nginx

# 检查 Nginx 状态
sudo systemctl status nginx

# 查看 Nginx 日志
tail -f /var/log/nginx/douyin-admin.access.log
tail -f /var/log/nginx/douyin-admin.error.log
```

### 数据库管理
```bash
# 备份数据库
cp database.sqlite database.sqlite.backup.$(date +%Y%m%d_%H%M%S)

# 恢复数据库
cp database.sqlite.backup.20250919_XXXXXX database.sqlite

# 查看数据库数据
node scripts/query-db.js users
node scripts/query-db.js games

# 清理旧数据 (保留最近10个设备记录)
node scripts/cleanup-db.js
```

### 系统监控
```bash
# 检查系统资源
free -h  # 内存使用
df -h    # 磁盘空间
top      # CPU 和进程

# 检查端口占用
netstat -tlnp | grep :80    # Nginx
netstat -tlnp | grep :3000  # Node.js

# 检查日志
tail -f /var/log/nginx/*.log
pm2 logs
```

## 🔒 安全建议

### 立即执行
1. **更改 SSH 密码**:
   ```bash
   passwd root
   ```
   - 使用强密码，包含大小写字母、数字、特殊字符

2. **更改应用默认密码**:
   - 登录应用后，立即修改 admin 用户密码
   - 更改 JWT_SECRET 为更安全的密钥

3. **启用密钥认证** (推荐):
   ```bash
   # 生成密钥对 (本地)
   ssh-keygen -t rsa -b 4096

   # 复制公钥到服务器
   ssh-copy-id root@47.115.94.203

   # 禁用密码登录 (服务器 /etc/ssh/sshd_config)
   PasswordAuthentication no
   ```

### 定期维护
- **数据库备份**: 每周备份 database.sqlite
- **日志清理**: 定期清理 Nginx 和 PM2 日志
- **依赖更新**: 定期运行 `npm update` 检查安全漏洞
- **SSL 证书**: 使用 Let's Encrypt 自动续期 HTTPS 证书

### 防火墙配置
```bash
# 开放必要端口
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS (如果启用)
ufw enable

# 检查状态
ufw status
```

## 📞 故障排除

### 常见问题
1. **无法 SSH 登录**:
   - 检查 IP: 47.115.94.203
   - 验证密码: 1qaz1QAZ1qaz (立即更改！)
   - 检查防火墙: `ufw status`

2. **应用无法访问**:
   - 检查 Nginx: `sudo systemctl status nginx`
   - 检查 Node.js: `pm2 status`
   - 查看日志: `pm2 logs` 和 Nginx 日志

3. **数据库问题**:
   - 验证文件: `ls -la database.sqlite`
   - 测试连接: `node scripts/test-db-connection.js`
   - 权限修复: `chown www-data:www-data database.sqlite`

### 联系支持
- **服务器监控**: 使用 PM2 monit 或第三方工具
- **问题报告**: 查看日志文件，记录错误时间和描述
- **紧急情况**: 联系系统管理员或开发团队

## 📝 更新记录

- **创建日期**: 2025-09-19
- **最后更新**: 2025-09-19
- **版本**: v1.0.0
- **维护者**: 橙果宜牛团队

⚠️ **重要提醒**: 本文档包含敏感信息（如密码）。请在生产环境中删除或加密此文件，并使用安全的凭证管理方式！

---

**橙果宜牛服务器配置文档 - 安全第一，定期更新凭证！**