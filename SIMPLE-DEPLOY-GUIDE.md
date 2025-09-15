# 简单部署指南

## 📋 部署流程

### 1. 本地构建项目
```bash
# 安装依赖
yarn install

# 构建项目
yarn build
```

### 2. 打包 dist 文件夹
```bash
# 压缩 dist 文件夹
powershell -Command "Compress-Archive -Path dist -DestinationPath dist.zip -Force"
```

### 3. 上传到服务器
```bash
# 上传 dist.zip 和部署脚本
scp dist.zip root@47.115.94.203:/var/www/
scp simple-deploy.sh root@47.115.94.203:/var/www/
```

### 4. 服务器端部署
```bash
# 连接到服务器
ssh root@47.115.94.203

# 进入部署目录
cd /var/www

# 给脚本执行权限
chmod +x simple-deploy.sh

# 执行部署
./simple-deploy.sh
```

## 📁 文件说明

- `dist.zip` - 构建后的前端文件压缩包
- `simple-deploy.sh` - 服务器端部署脚本

## 🔧 部署脚本内容

```bash
#!/bin/bash

echo "🚀 简单部署脚本 - 上传 dist 并重启服务"

# 备份当前网站文件
echo "备份当前网站文件..."
sudo cp -r /var/www/html /var/www/html.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo "首次部署，跳过备份"

# 解压新的 dist 文件
echo "解压新的 dist 文件..."
cd /var/www
sudo unzip -o dist.zip -d /tmp/

# 替换网站文件
echo "替换网站文件..."
sudo rm -rf /var/www/html
sudo mv /tmp/dist /var/www/html

# 设置权限
echo "设置文件权限..."
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html

# 重启 Nginx 服务
echo "重启 Nginx 服务..."
sudo systemctl restart nginx

echo "✅ 部署完成！"
echo "备份文件保存在: /var/www/html.backup.$(date +%Y%m%d_%H%M%S)"
echo "访问地址: http://47.115.94.203"
```

## ✅ 验证部署

部署完成后，访问网站：
- **地址**: `http://47.115.94.203`
- **应该显示最新的前端界面**

## 📝 记录

- 创建时间: 2025-09-15
- 最后更新: 2025-09-15
- 部署方式: 上传 dist.zip + 重启服务
- 目标目录: `/var/www/html`
- 备份策略: 自动备份到带时间戳的目录
- 包管理器: Yarn
- 服务器: 47.115.94.203

## 📋 故障排除

如果部署遇到问题，可以使用以下脚本：

- `diagnose-server.sh` - 诊断服务器状态
- `fix-nginx.sh` - 修复 Nginx 配置问题
- `fix-server.sh` - 修复服务器应用问题
- `start-app.sh` - 启动 Node.js 应用
- `test-server.sh` - 测试服务器状态

## 🔧 快速命令

```bash
# 上传最新文件
scp dist.zip root@47.115.94.203:/var/www/
scp simple-deploy.sh root@47.115.94.203:/var/www/

# 服务器部署
ssh root@47.115.94.203
cd /var/www && chmod +x simple-deploy.sh && ./simple-deploy.sh
```