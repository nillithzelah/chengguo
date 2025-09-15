# 抖音小游戏设备信息收集系统

## 📋 项目概述

这是一个专门为抖音小游戏开发的设备信息收集系统，能够自动收集用户的设备信息并上报到抖音开放平台。

## 🎯 核心功能

### 设备信息收集
- **IP地址获取** - 自动获取用户真实IP地址
- **地理位置信息** - 获取城市、地区等地理位置数据
- **设备品牌识别** - 识别设备品牌（iPhone、Android、Windows等）
- **设备型号检测** - 获取具体的设备型号信息

### 数据上报
- **抖音API集成** - 与抖音开放平台API无缝对接
- **实时数据同步** - 实时上报设备信息到抖音服务器
- **错误处理机制** - 完善的错误处理和重试机制

### 用户体验
- **无感知收集** - 在后台自动收集，不影响用户体验
- **隐私保护** - 符合隐私政策要求的数据收集
- **性能优化** - 轻量级实现，不影响游戏性能

## 🛠️ 技术实现

### 前端技术栈
- **Vue 3** - 现代化的前端框架
- **TypeScript** - 类型安全的开发体验
- **Arco Design** - 企业级UI组件库

### 后端技术栈
- **Node.js** - 高性能后端运行环境
- **Express** - 轻量级Web框架
- **SQLite** - 轻量级数据库

### API集成
- **抖音开放平台API** - 官方设备信息上报接口
- **IP地理位置API** - 多源IP定位服务
- **设备检测API** - 浏览器设备信息检测

## 📊 数据流程

```
用户访问游戏
    ↓
设备信息收集
    ↓
地理位置解析
    ↓
数据格式化
    ↓
上报到抖音API
    ↓
数据存储和分析
```

## 🔧 配置说明

### 环境变量配置
```env
# 抖音API配置
DOUYIN_APP_ID=your_app_id
DOUYIN_APP_SECRET=your_app_secret

# 数据库配置
DB_PATH=./database.sqlite

# 服务器配置
PORT=3000
NODE_ENV=production
```

### 抖音开放平台配置
1. 登录抖音开放平台
2. 创建小游戏应用
3. 获取App ID和App Secret
4. 配置webhook地址
5. 设置数据上报权限

## 🚀 部署指南

### 服务器要求
- **操作系统**: Ubuntu 18.04+ / CentOS 7+
- **内存**: 至少1GB RAM
- **存储**: 至少5GB可用空间
- **网络**: 稳定的网络连接

### 快速部署
```bash
# 1. 克隆项目
git clone https://github.com/nillithzelah/chengguo.git
cd chengguo

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env.production
# 编辑 .env.production 文件

# 4. 构建项目
npm run build

# 5. 启动服务
npm run server
```

### Docker部署
```dockerfile
FROM node:16-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "server"]
```

## 📈 监控和维护

### 日志监控
- **访问日志** - 记录所有API访问
- **错误日志** - 记录系统错误和异常
- **上报日志** - 记录数据上报状态

### 性能监控
- **响应时间** - API响应时间监控
- **成功率** - 数据上报成功率统计
- **错误率** - 系统错误率监控

### 数据质量
- **数据完整性** - 确保收集的数据完整
- **数据准确性** - 验证地理位置信息的准确性
- **重复数据检测** - 避免重复数据上报

## 🔒 安全考虑

### 数据隐私
- **最小化收集** - 只收集必要的数据
- **数据加密** - 敏感数据加密存储
- **访问控制** - 严格的API访问权限控制

### 系统安全
- **HTTPS加密** - 所有通信使用HTTPS
- **API密钥保护** - 安全的密钥存储和管理
- **访问频率限制** - 防止API滥用

## 📚 API文档

### 设备信息收集API
```javascript
// 获取设备信息
GET /api/device/info

// 上报设备信息
POST /api/douyin/device/report
```

### 数据查询API
```javascript
// 查询设备统计
GET /api/device/stats

// 查询地理位置分布
GET /api/device/location/stats
```

## 🐛 故障排除

### 常见问题

**Q: 地理位置获取失败**
A: 检查网络连接和API密钥配置

**Q: 数据上报失败**
A: 验证抖音API配置和权限设置

**Q: 设备信息不准确**
A: 更新浏览器或检查User-Agent解析逻辑

### 调试模式
```javascript
// 启用调试模式
localStorage.setItem('debug_mode', 'true');

// 查看调试信息
console.log('设备信息:', deviceInfo);
```

## 📞 技术支持

- **项目维护者**: nillithzelah
- **技术文档**: [GitHub Wiki](https://github.com/nillithzelah/chengguo/wiki)
- **问题反馈**: [GitHub Issues](https://github.com/nillithzelah/chengguo/issues)

## 📄 更新日志

### v1.0.0 (2025-09-15)
- ✅ 初始版本发布
- ✅ 设备信息收集功能
- ✅ 抖音API集成
- ✅ 地理位置解析
- ✅ 数据上报机制

---

**最后更新**: 2025-09-15
**版本**: v1.0.0