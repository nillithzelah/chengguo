# 项目部署指南

本指南详细说明如何将本项目（Vue.js 前端 + Node.js 后端）部署到 Linux 服务器（假设 Ubuntu/Debian，使用 Nginx 作为前端静态文件服务器，Node.js 作为后端），直到可以从外部访问。假设服务器已安装 Node.js、npm、Nginx、unzip 和 sudo 权限。

## 前提条件
- 服务器 IP: `YOUR_SERVER_IP`（替换为实际 IP）
- 域名（可选）: `your-domain.com`（需配置 DNS 解析到服务器 IP）
- 项目文件: `project.zip`（包含所有源代码）
- 已上传 `project.zip` 到服务器的 `/var/www/` 目录（或调整路径）

## 步骤 1: 备份现有项目（可选但推荐）
如果服务器已有项目，备份以防万一。
```
sudo cp -r /var/www/douyin-admin-master /var/www/douyin-admin-master.backup.$(date +%Y%m%d_%H%M%S)
```

## 步骤 2: 解压项目
进入 `/var/www/` 目录，解压覆盖现有项目。
```
cd /var/www
sudo unzip -o project.zip -d douyin-admin-master/
```
- 这会将项目解压到 `/var/www/douyin-admin-master/`。

## 步骤 3: 安装依赖
进入项目目录，安装 Node.js 依赖。
```
cd /var/www/douyin-admin-master
npm install
```
- 如果是首次部署，确保 Node.js 版本 >= 14。

## 步骤 4: 构建前端项目
构建 Vue 项目，生成静态文件到 `dist/` 目录。
```
npm run build
```
- 输出: `/var/www/douyin-admin-master/dist/` 包含构建后的前端文件。

## 步骤 5: 设置文件权限
确保 Nginx 可以读取文件（www-data 是 Nginx 默认用户）。
```
sudo chown -R www-data:www-data /var/www/douyin-admin-master
sudo chmod -R 755 /var/www/douyin-admin-master
```

## 步骤 6: 配置 Nginx（前端静态文件）
编辑 Nginx 配置（假设站点配置文件在 `/etc/nginx/sites-available/default` 或创建新文件）。
```
sudo nano /etc/nginx/sites-available/default
```
添加/替换以下配置（假设前端端口 80，后端 API 端口 3000）：
```
server {
    listen 80;
    server_name your-domain.com YOUR_SERVER_IP;  # 替换为域名或 IP

    # 前端静态文件
    location / {
        root /var/www/douyin-admin-master/dist;
        index index.html;
        try_files $uri $uri/ /index.html;  # 支持 Vue Router 的 history 模式
    }

    # 代理后端 API（假设 API 前缀 /api）
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```
- 测试配置: `sudo nginx -t`
- 如果使用域名，启用站点: `sudo ln -s /etc/nginx/sites-available/default /etc/nginx/sites-enabled/`

## 步骤 7: 启动后端服务（Node.js）
项目有 `server.js`，使用 PM2（推荐）或 nohup 启动后端。
- 先安装 PM2（全局）: `sudo npm install -g pm2`
- 启动: `pm2 start server.js --name "douyin-backend"`
- 保存 PM2 配置: `pm2 save`
- 开机自启: `pm2 startup`

或者使用 nohup:
```
nohup node server.js > server.log 2>&1 &
```
- 确保 `server.js` 监听端口 3000（或调整 Nginx 配置）。

## 步骤 8: 重启 Nginx
```
sudo systemctl restart nginx
```
- 检查状态: `sudo systemctl status nginx`

## 步骤 9: 配置防火墙允许外部访问
使用 UFW（Ubuntu 默认防火墙）:
```
sudo ufw allow 'Nginx Full'  # 允许 80/443 端口
sudo ufw allow 3000  # 如果后端直接暴露（不推荐，使用 Nginx 代理）
sudo ufw reload
sudo ufw enable  # 如果未启用
```
- 检查: `sudo ufw status`

## 步骤 10: 测试访问
- 从浏览器访问: `http://YOUR_SERVER_IP` 或 `http://your-domain.com`
- 检查前端是否加载，API 是否响应（例如访问 `/api/` 端点）。
- 查看日志:
  - Nginx: `sudo tail -f /var/log/nginx/error.log`
  - PM2: `pm2 logs douyin-backend`
  - 后端: `tail -f server.log`

## 常见问题排查
- **构建失败**: 检查 Node 版本和依赖冲突，重试 `npm install --force`。
- **权限错误**: 确保 www-data 用户有读权限。
- **API 不可达**: 确认后端启动，端口正确，Nginx 代理配置无误。
- **HTTPS**: 使用 Certbot 配置 SSL: `sudo apt install certbot python3-certbot-nginx`，然后 `sudo certbot --nginx`。
- **备份恢复**: 如果出错，恢复备份: `sudo cp -r /var/www/douyin-admin-master.backup.* /var/www/douyin-admin-master`。

部署完成后，网站即可从外部访问。如果有自定义配置（如 .env 文件），在解压后调整。

最后更新: 2025-09-10