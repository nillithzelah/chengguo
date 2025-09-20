# 简单部署指南

## 🚀 快速开始

本指南将帮助你在5分钟内完成项目的部署。

## 📋 前置要求

### 系统要求
- **操作系统**: Ubuntu 18.04+ / CentOS 7+ / macOS 10.15+
- **Node.js**: v14.0.0 或更高版本
- **内存**: 至少1GB RAM
- **存储**: 至少2GB可用空间

### 网络要求
- 稳定的互联网连接
- 能够访问抖音开放平台API
- 能够访问IP地理位置服务

## ⚡ 一键部署

### 1. 下载项目
```bash
# 克隆项目
git clone https://github.com/nillithzelah/chengguo.git
cd chengguo
```

### 2. 安装依赖
```bash
# 安装项目依赖
npm install

# 如果网络较慢，可以使用国内镜像
npm install --registry=https://registry.npmmirror.com
```

### 3. 配置环境
```bash
# 复制环境配置文件
cp .env.example .env.production

# 编辑配置文件
nano .env.production
```

**配置文件内容**:
```env
# 数据库配置
DB_PATH=./database.sqlite

# 服务器配置
PORT=3000
NODE_ENV=production

# 抖音API配置（需要从抖音开放平台获取）
DOUYIN_APP_ID=your_app_id_here
DOUYIN_APP_SECRET=your_app_secret_here
```

### 4. 初始化数据库
```bash
# 初始化数据库
npm run db:init

# 创建测试用户（可选）
npm run db:test
```

### 5. 构建项目
```bash
# 构建前端项目
npm run build
```

### 6. 启动服务
```bash
# 开发模式启动
npm run dev

# 生产模式启动
npm run server
```

## 🌐 访问应用

### 本地访问
- **前端界面**: http://localhost:5173
- **后端API**: http://localhost:3000

### 服务器部署
```bash
# 使用PM2管理进程
npm install -g pm2
pm2 start server.js --name "chengguo-app"
pm2 save
pm2 startup
```

## 🔧 配置抖音API

### 1. 注册抖音开放平台
1. 访问 [抖音开放平台](https://open.douyin.com/)
2. 注册开发者账号
3. 创建小游戏应用

### 2. 获取API密钥
1. 在应用管理页面获取 **App ID**
2. 获取 **App Secret**
3. 配置webhook地址（如果需要）

### 3. 配置权限
确保应用具有以下权限：
- 设备信息读取
- 数据统计访问
- 用户信息获取

## 📊 验证部署

### 1. 检查服务状态
```bash
# 检查端口占用
netstat -tlnp | grep :3000

# 检查进程状态
ps aux | grep node
```

### 2. 测试API接口
```bash
# 测试健康检查
curl http://localhost:3000/api/health

# 测试数据库连接
curl http://localhost:3000/api/db/test
```

### 3. 测试前端界面
1. 打开浏览器访问 http://localhost:5173
2. 尝试登录系统
3. 测试设备信息收集功能

## 🐛 常见问题

### 端口被占用
```bash
# 查找占用端口的进程
lsof -i :3000

# 杀死进程
kill -9 <PID>

# 或者使用其他端口
PORT=3001 npm run server
```

### 依赖安装失败
```bash
# 清理缓存
npm cache clean --force

# 使用国内镜像
npm install --registry=https://registry.npmmirror.com

# 如果仍有问题，尝试删除node_modules
rm -rf node_modules package-lock.json
npm install
```

### 数据库连接失败
```bash
# 检查数据库文件权限
ls -la database.sqlite

# 修复权限
chmod 666 database.sqlite

# 重新初始化数据库
npm run db:init
```

### 抖音API调用失败
```bash
# 检查网络连接
ping open.douyin.com

# 验证API配置
curl "https://open.douyin.com/api/test?app_id=YOUR_APP_ID"
```

## 📈 性能优化

### 生产环境配置
```bash
# 使用PM2集群模式
pm2 start server.js -i max --name "chengguo-cluster"

# 配置Nginx反向代理
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 监控和日志
```bash
# 查看PM2日志
pm2 logs chengguo-app

# 监控系统资源
pm2 monit

# 重启服务
pm2 restart chengguo-app
```

## 🔒 安全配置

### HTTPS配置
```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        # ... 其他配置
    }
}
```

### 防火墙配置
```bash
# 开放必要端口
ufw allow 80
ufw allow 443
ufw allow 3000

# 启用防火墙
ufw enable
```

## 📞 获取帮助

### 技术支持
- **项目地址**: https://github.com/nillithzelah/chengguo
- **问题反馈**: 提交GitHub Issue
- **技术文档**: 查看项目Wiki

### 社区资源
- **抖音开放平台文档**: https://open.douyin.com/docs/
- **Node.js官方文档**: https://nodejs.org/docs/
- **Vue.js官方文档**: https://vuejs.org/guide/

## 🎯 下一步

### 功能扩展
1. **数据可视化** - 添加更多图表类型
2. **用户管理** - 完善用户权限系统
3. **API监控** - 添加API调用监控
4. **数据导出** - 支持多种数据导出格式

### 部署优化
1. **Docker化** - 创建Docker镜像
2. **CI/CD** - 配置自动化部署
3. **负载均衡** - 支持多服务器部署
4. **备份策略** - 配置数据备份

---

**部署完成！** 🎉

现在你可以开始使用抖音小游戏设备信息收集系统了。如有问题，请查看常见问题部分或提交Issue。