# Douyin Admin 部署指南

## 📋 概述

本指南介绍如何将本地开发环境中的代码部署到生产服务器。

## 🔑 SSH 配置

### 1. 生成SSH密钥（已在服务器完成）

服务器已生成SSH密钥对：
- 私钥：`/root/.ssh/id_rsa_douyin`
- 公钥：`/root/.ssh/id_rsa_douyin.pub`

### 2. 下载私钥到本地

```powershell
# 在Windows PowerShell中执行
scp root@47.115.94.203:~/.ssh/id_rsa_douyin $env:USERPROFILE\.ssh\
scp root@47.115.94.203:~/.ssh/id_rsa_douyin.pub $env:USERPROFILE\.ssh\
```

### 3. 配置SSH客户端

创建或编辑 `~/.ssh/config` 文件：

```
Host douyin-server
    HostName 47.115.94.203
    User root
    IdentityFile ~/.ssh/id_rsa_douyin
    IdentitiesOnly yes
```

### 4. 测试连接

```bash
# 使用Git Bash测试连接
ssh douyin-server

# 应该显示：
# Welcome to Ubuntu 20.04.6 LTS...
# root@iZwz985ddhar8km30lcu4nZ:~#
```

## 🚀 部署方法

### 方法1：使用部署脚本（推荐）

#### **后端部署：**
```bash
# 在项目根目录执行
./deploy_script.sh
```

#### **前端部署：**
```bash
# Windows环境
./deploy-frontend.bat

# Linux/Mac环境
./deploy-frontend.sh
```

### 方法2：手动SCP上传

#### **后端文件：**
```bash
# 上传核心文件
scp -i ~/.ssh/id_rsa_douyin src/views/user/management/index.vue root@47.115.94.203:/var/www/douyin-admin-master/src/views/user/management/

# 上传脚本
scp -i ~/.ssh/id_rsa_douyin backup_script.sh root@47.115.94.203:/var/www/
scp -i ~/.ssh/id_rsa_douyin deploy_script.sh root@47.115.94.203:/var/www/
```

#### **前端文件：**
```bash
# 构建前端
npm run build

# 上传dist目录
scp -i ~/.ssh/id_rsa_douyin -r dist/* root@47.115.94.203:/var/www/html/
```

### 方法3：使用rsync增量同步

```bash
rsync -avz -e "ssh -i ~/.ssh/id_rsa_douyin" \
  --exclude='.git/' \
  --exclude='node_modules/' \
  --exclude='*.log' \
  ./ \
  root@47.115.94.203:/var/www/douyin-admin-master/
```

## 🔧 服务器端操作

### 设置脚本权限

```bash
# 在服务器上执行
cd /var/www/douyin-admin-master
chmod +x backup_script.sh
chmod +x deploy_script.sh
```

### 重启服务

```bash
# PM2重启
pm2 restart douyin-admin

# 或systemd重启
systemctl restart douyin-admin

# 检查状态
pm2 status
```

## 📁 项目结构

```
/var/www/douyin-admin-master/
├── src/
│   └── views/
│       └── user/
│           └── management/
│               └── index.vue          # 用户管理页面（已优化）
├── backup_script.sh                   # 备份脚本
├── deploy_script.sh                   # 部署脚本
└── ...其他文件
```

## 🎯 已完成的优化

### 用户管理页面优化
- ✅ 修复角色筛选bug
- ✅ 添加用户搜索功能（用户名、姓名）
- ✅ 优化表格响应式设计
- ✅ 改进错误处理和用户反馈
- ✅ 优化空状态显示
- ✅ 移除不必要的UI元素

### 部署工具
- ✅ 自动化部署脚本
- ✅ 服务器备份脚本
- ✅ SSH无密码配置

## 🔍 故障排除

### SSH连接问题
```bash
# 测试连接
ssh -v douyin-server

# 检查密钥权限
ls -la ~/.ssh/id_rsa_douyin
chmod 600 ~/.ssh/id_rsa_douyin
```

### 部署脚本问题
```bash
# 检查脚本权限
ls -la deploy_script.sh

# 直接运行
bash deploy_script.sh
```

### 服务重启问题
```bash
# 检查PM2状态
pm2 list

# 查看日志
pm2 logs douyin-admin --lines 20
```

## 📊 验证部署

### 检查文件
```bash
# 服务器上检查
ls -la /var/www/douyin-admin-master/src/views/user/management/index.vue
stat /var/www/douyin-admin-master/src/views/user/management/index.vue
```

### 检查服务
```bash
# 检查端口
netstat -tlnp | grep :端口号

# 测试API
curl http://localhost:端口号/api/health
```

## 📝 更新日志

### v1.0.0 - 2025-10-11
- 初始部署配置完成
- 用户管理页面全面优化
- SSH自动化部署配置

## 📞 技术支持

如遇问题，请检查：
1. SSH密钥配置是否正确
2. 服务器权限是否充足
3. 服务是否正常运行
4. 日志是否有错误信息