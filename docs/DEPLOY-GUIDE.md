# 🚀 服务器部署指南

## 📋 部署前准备

### 1. 本地构建
```bash
# 构建前端代码
npm run build

# 构建结果在 dist/ 目录中
```

### 2. 备份服务器数据
```bash
# 在服务器上备份
cp database.sqlite database.sqlite.backup.$(date +%Y%m%d_%H%M%S)

# 如果使用 PostgreSQL，也备份数据库
# pg_dump -h localhost -U postgres -d chengguo_db > postgres_backup_$(date +%Y%m%d_%H%M%S).sql
```

## 🔧 服务器部署步骤

### 步骤1: 上传代码到服务器
```bash
# 上传构建文件
scp -r dist/* user@your-server:/var/www/html/

# 上传数据库文件（SQLite）
scp database.sqlite user@your-server:/path/to/your/app/database.sqlite

# 上传数据库迁移脚本
scp scripts/add-ad-fields.js user@your-server:/path/to/your/app/scripts/
```

### 步骤2: 在服务器上运行数据库迁移
```bash
# 连接到服务器
ssh user@your-server

# 进入项目目录
cd /path/to/your/app

# 设置数据库文件权限
chown www-data:www-data database.sqlite
chmod 664 database.sqlite

# 运行数据库迁移脚本
node scripts/add-ad-fields.js
```

### 步骤3: 重启服务
```bash
# 重启Nginx
sudo systemctl restart nginx

# 重启Node.js应用
pm2 restart all
```

## 📊 数据库迁移详情

### 新增字段
- `advertiser_id`: VARCHAR(50) NULL - 广告主ID，用于广告预览二维码
- `promotion_id`: VARCHAR(50) NULL - 广告ID，用于广告预览二维码

### 迁移脚本功能
1. ✅ 检查数据库连接
2. ✅ 验证games表是否存在
3. ✅ 检查字段是否已存在
4. ✅ 添加缺失的字段
5. ✅ 验证迁移结果
6. ✅ 显示迁移后的数据

## 🔍 验证部署成功

### 1. 检查网站访问
```bash
curl -I http://your-server.com
# 应该返回200状态码
```

### 2. 检查数据库字段
```bash
# SQLite 检查
sqlite3 database.sqlite "PRAGMA table_info(games);"

# PostgreSQL 检查（如果使用）
# psql -h localhost -U postgres -d chengguo_db -c "\d games"
```

### 3. 验证功能
- ✅ 用户登录正常
- ✅ 游戏管理页面正常
- ✅ 广告预览二维码功能正常

## 🛠️ 故障排除

### 如果迁移失败
```bash
# 检查数据库文件权限
ls -la database.sqlite

# 检查Node.js版本
node --version

# SQLite 手动执行SQL
sqlite3 database.sqlite "ALTER TABLE games ADD advertiser_id VARCHAR(50);"
sqlite3 database.sqlite "ALTER TABLE games ADD promotion_id VARCHAR(50);"

# PostgreSQL 手动执行SQL（如果使用）
# psql -h localhost -U postgres -d chengguo_db -c "ALTER TABLE games ADD COLUMN IF NOT EXISTS advertiser_id VARCHAR(50);"
# psql -h localhost -U postgres -d chengguo_db -c "ALTER TABLE games ADD COLUMN IF NOT EXISTS promotion_id VARCHAR(50);"
```

### 如果网站无法访问
```bash
# 检查Nginx状态
sudo systemctl status nginx

# 检查PM2状态
pm2 status

# 查看日志
pm2 logs
```

## 📞 技术支持

如果部署过程中遇到问题，请：
1. 检查服务器日志
2. 确认数据库文件权限
3. 验证网络连接
4. 联系技术支持团队

---

**最后更新**: 2025-09-18
**版本**: v1.0.0