# 橙果宜牛 - 抖音广告管理系统

## 📋 项目简介

这是一个基于 Vue.js + Node.js 的抖音广告管理系统，支持 eCPM 数据管理、用户管理、游戏管理等功能。

## 🚀 最新更新 (2025-09-15)

### ✅ 已修复的问题
- **城市获取缓存问题** - 修复了城市信息显示"未知"的缓存问题
- **设备信息获取优化** - 改进了IP和城市信息的获取逻辑
- **用户界面优化** - 隐藏了调试按钮，界面更加整洁

### 🎯 核心功能
- 用户登录注册系统
- eCPM 数据统计和管理
- 游戏应用管理
- 设备信息自动获取
- 权限管理系统

## 🛠️ 技术栈

- **前端**: Vue 3 + TypeScript + Arco Design
- **后端**: Node.js + Express + Sequelize
- **数据库**: SQLite
- **部署**: Nginx + PM2

## 📦 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/nillithzelah/chengguo.git
cd chengguo
```

### 2. 安装依赖
```bash
npm install
```

### 3. 启动开发服务器
```bash
# 前端开发
npm run dev

# 后端服务器
npm run server
```

### 4. 构建生产版本
```bash
npm run build
```

## 🚀 部署到服务器

### 自动部署脚本
```bash
# 上传最终清理版本（推荐）
scp dist-final-clean.zip root@47.115.94.203:/var/www/
scp deploy-final-clean.sh root@47.115.94.203:/var/www/

# 部署到服务器
ssh root@47.115.94.203
cd /var/www
chmod +x deploy-final-clean.sh
./deploy-final-clean.sh
```

### 手动部署步骤
1. 构建项目: `npm run build`
2. 上传 `dist/` 目录到服务器
3. 配置 Nginx 代理
4. 启动 Node.js 服务

## 🔧 环境配置

### 生产环境配置
复制 `.env.example` 到 `.env.production` 并配置：

```env
# 数据库配置
DB_PATH=./database.sqlite

# 服务器配置
PORT=3000
NODE_ENV=production

# 抖音API配置
DOUYIN_APP_ID=your_app_id
DOUYIN_APP_SECRET=your_app_secret
```

## 📊 功能特性

### 用户管理
- 用户注册登录
- 权限控制
- 个人信息管理

### 数据管理
- eCPM 数据统计
- 广告收益分析
- 数据可视化

### 游戏管理
- 游戏应用配置
- API 密钥管理
- 应用状态监控

### 设备信息
- 自动获取IP地址
- 城市信息识别
- 设备类型检测

## 🔍 调试功能

### 页面内调试
项目包含页面内调试功能，可以查看：
- IP获取过程
- 城市API调用结果
- 设备信息解析

### 部署调试版本
如果需要调试功能：
```bash
# 部署包含调试功能的版本
scp dist-debug-user-final.zip root@47.115.94.203:/var/www/
scp deploy-user-debug-final.sh root@47.115.94.203:/var/www/
```

## 📁 项目结构

```
chengguo/
├── src/                    # 前端源码
│   ├── api/               # API接口
│   ├── components/        # 组件
│   ├── views/            # 页面
│   ├── store/            # 状态管理
│   └── utils/            # 工具函数
├── config/                # 配置文件
├── scripts/               # 脚本文件
├── dist/                  # 构建输出
├── deploy-*.sh           # 部署脚本
└── README.md             # 项目文档
```

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支: `git checkout -b feature/AmazingFeature`
3. 提交更改: `git commit -m 'Add some AmazingFeature'`
4. 推送到分支: `git push origin feature/AmazingFeature`
5. 提交 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

项目维护者: nillithzelah

---

**最后更新**: 2025-09-15
**版本**: v1.0.0