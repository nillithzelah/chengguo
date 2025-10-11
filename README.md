# 🍊 橙果宜牛 (ChengGuoYiNiu)

一个现代化的Vue 3 + TypeScript全栈应用，提供广告投放管理、用户管理和游戏管理功能。

## 🌟 项目特色

- **现代化技术栈** - Vue 3 + TypeScript + Arco Design
- **全栈架构** - 前后端分离，RESTful API设计
- **响应式设计** - 完美适配桌面和移动端
- **权限管理** - 基于角色的访问控制
- **实时数据** - ECPM数据可视化分析
- **自动化部署** - 一键部署脚本

## 🚀 核心功能

### 👥 用户管理
- ✅ 用户搜索（用户名、姓名、邮箱）
- ✅ 角色筛选和权限控制
- ✅ 批量操作（批量删除、状态修改）
- ✅ 响应式表格设计
- ✅ 用户创建、编辑、删除

### 📊 广告管理 (ECPM)
- ✅ 实时数据可视化
- ✅ 多维度数据分析
- ✅ 导出功能
- ✅ 筛选和搜索

### 🎮 游戏管理
- ✅ 游戏列表管理
- ✅ 用户游戏关联
- ✅ 游戏数据统计

## 🛠️ 技术栈

### 前端
- **Vue 3** - 渐进式JavaScript框架
- **TypeScript** - 类型安全的JavaScript
- **Arco Design Vue** - 企业级UI组件库
- **Vue Router 4** - 官方路由管理器
- **Pinia** - 新一代状态管理
- **Vite** - 下一代前端构建工具
- **ECharts** - 数据可视化

### 后端
- **Node.js** - JavaScript运行时
- **Express.js** - Web应用框架
- **Sequelize** - ORM数据库工具
- **SQLite/PostgreSQL** - 数据库
- **JWT** - 用户认证
- **bcrypt** - 密码加密

### 部署
- **Nginx** - Web服务器和反向代理
- **PM2** - Node.js进程管理
- **Docker** - 容器化部署

## 📁 项目结构

```
chengguo/
├── src/                    # 前端源码
│   ├── api/               # API接口
│   ├── components/        # 公共组件
│   ├── views/            # 页面组件
│   ├── router/           # 路由配置
│   ├── store/            # 状态管理
│   └── utils/            # 工具函数
├── config/               # 构建配置
├── scripts/              # 部署脚本
├── docs/                 # 项目文档
├── server.js             # 后端服务器
├── models/               # 数据库模型
├── routes/               # API路由
└── database/             # 数据库配置
```

## 🚀 快速开始

### 环境要求
- Node.js >= 14.0.0
- npm 或 yarn
- Git

### 安装依赖
```bash
# 克隆项目
git clone https://github.com/nillithzelah/chengguo.git
cd chengguo

# 安装依赖
npm install
```

### 开发环境
```bash
# 启动后端服务器
npm run server:dev

# 启动前端开发服务器
npm run dev

# 访问 http://localhost:5173
```

### 生产构建
```bash
# 构建前端
npm run build

# 启动生产服务器
npm run server
```

## 📦 部署

### 自动化部署
```bash
# 前端部署（推荐）
./deploy-frontend.sh  # Linux
deploy-frontend.bat   # Windows

# 后端部署
./deploy_script.sh
```

### 手动部署
```bash
# 1. 构建项目
npm run build

# 2. 上传dist目录到服务器
scp -r dist/* user@server:/var/www/html/

# 3. 重启Nginx
sudo systemctl reload nginx
```

## 🔧 配置

### 环境变量
创建 `.env` 文件：
```env
PORT=3000
JWT_SECRET=your-secret-key
DATABASE_URL=sqlite://./database.sqlite
NODE_ENV=production
```

### Nginx配置
```nginx
server {
    listen 80;
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## 📊 数据库

### 初始化数据库
```bash
npm run db:init
```

### 数据库迁移
```bash
npm run db:cleanup
npm run db:init
```

## 🎨 界面预览

### 用户管理页面
- 🔍 实时搜索功能
- 🔽 角色筛选
- ⚡ 批量操作
- 📱 响应式设计

### ECPM数据分析
- 📈 实时数据图表
- 📊 多维度分析
- 📤 数据导出

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📝 更新日志

### v1.0.0 (2025-10-11)
- ✨ 完成用户管理页面全面优化
- 🔍 添加用户搜索功能
- ⚡ 实现批量操作功能
- 📱 优化响应式设计
- 🛠️ 修复Vue.js构建问题
- 🚀 完善部署流程

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 👨‍💻 作者

**橙果宜牛团队**

- 项目地址: https://github.com/nillithzelah/chengguo
- 演示地址: https://ecpm.game985.vip

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者！

---

⭐ 如果这个项目对你有帮助，请给它一个星标！