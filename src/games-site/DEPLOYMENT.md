# 服务器部署指南

## 问题描述
你的服务器已经有一个网站，现在要添加游戏网站。有几种解决方案：

## 解决方案

### 方案1：子目录部署（推荐）🌟
将游戏网站部署到现有网站的子目录中。

#### 优点：
- ✅ 最简单，无需额外配置
- ✅ 共享同一个域名
- ✅ SEO友好
- ✅ 容易管理

#### 部署步骤：

1. **上传文件到子目录**：
   ```
   your-server.com/
   ├── index.html (原网站)
   ├── games/ (新文件夹)
   │   ├── index.html
   │   ├── games.json
   │   ├── games/
   │   │   ├── game1/
   │   │   ├── game2/
   │   │   └── game3/
   │   └── ...
   └── ... (其他原网站文件)
   ```

2. **访问方式**：
   - 主网站：`https://your-server.com/`
   - 游戏网站：`https://your-server.com/games/`

3. **更新游戏链接**：
   编辑 `games.json` 中的URL路径：
   ```json
   {
     "url": "games/game1/index.html"
   }
   ```

### 方案2：子域名部署
为游戏网站创建一个子域名。

#### 优点：
- ✅ 独立的管理
- ✅ 更好的SEO分离
- ✅ 可以有独立的SSL证书

#### 部署步骤：

1. **创建子域名**：
   - 在域名服务商处创建子域名：`games.your-server.com`
   - 或者在服务器上配置子域名

2. **上传文件**：
   将游戏网站文件上传到子域名的根目录

3. **访问方式**：
   - 主网站：`https://your-server.com/`
   - 游戏网站：`https://games.your-server.com/`

### 方案3：不同端口部署
使用不同的端口运行游戏网站。

#### 优点：
- ✅ 完全独立
- ✅ 开发测试方便

#### 缺点：
- ❌ 用户需要记住端口号
- ❌ 防火墙可能阻止非标准端口

#### 部署步骤：

1. **使用Node.js服务器**：
   ```bash
   # 安装依赖
   npm install -g http-server

   # 启动服务器
   http-server -p 3000
   ```

2. **访问方式**：
   - 主网站：`https://your-server.com/`
   - 游戏网站：`https://your-server.com:3000/`

### 方案4：反向代理（高级）
使用Nginx或Apache的反向代理功能。

#### 适用于：
- 需要负载均衡
- 需要缓存优化
- 需要SSL终止

#### Nginx配置示例：
```nginx
server {
    listen 80;
    server_name your-server.com;

    # 主网站
    location / {
        root /var/www/html;
        index index.html;
    }

    # 游戏网站代理
    location /games/ {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 推荐方案选择

### 🥇 **推荐：方案1（子目录）**
- 如果你的服务器支持子目录部署
- 如果你想要简单易用的方案

### 🥈 **备选：方案2（子域名）**
- 如果你需要更好的SEO分离
- 如果你想要独立的管理

### 🥉 **备选：方案3（不同端口）**
- 如果你只是临时测试
- 如果你有开发需求

## 针对你的服务器的具体部署方案

### 🎯 你的服务器配置：
- **服务器路径**：`/var/www/douyin-admin-master`
- **原网站**：`https://your-domain.com/`
- **游戏网站**：`https://your-domain.com/games/`

### 📋 具体实施步骤

#### 步骤1：连接到服务器
```bash
# 使用SSH连接到服务器
ssh your-username@your-server-ip
```

#### 步骤2：创建游戏网站目录
```bash
# 进入网站根目录
cd /var/www/douyin-admin-master

# 创建games目录
sudo mkdir -p games

# 设置正确的权限
sudo chown -R www-data:www-data games
sudo chmod -R 755 games
```

#### 步骤3：上传游戏网站文件
将以下文件上传到 `/var/www/douyin-admin-master/games/` 目录：

```
games/
├── index.html
├── games.json
├── images/
│   ├── top-image.jpg (顶部横幅图片)
│   ├── game1-preview.jpg (游戏1预览图)
│   ├── game2-preview.jpg (游戏2预览图)
│   └── game3-preview.jpg (游戏3预览图)
├── games/
│   ├── game1/
│   ├── game2/
│   └── game3/
└── ...
```

#### 步骤3.5：上传图片文件
- **顶部横幅图片**：
  - 文件名：`top-image.jpg`
  - 路径：`/var/www/douyin-admin-master/games/images/top-image.jpg`
  - 规格：正方形，400x400px 或 300x300px

- **游戏预览图片**：
  - 文件名：`game1-preview.jpg`, `game2-preview.jpg`, `game3-preview.jpg`
  - 路径：`/var/www/douyin-admin-master/games/images/`
  - 规格：300x200px 或 400x250px

**重要**：确保所有图片文件都上传到正确的位置，否则网站将显示占位符图片。
- **支持格式**：JPG, PNG, WebP
- **文件大小**：建议小于500KB

#### 步骤4：验证文件结构
```bash
# 检查文件是否上传成功
ls -la /var/www/douyin-admin-master/games/
```

#### 步骤5：测试访问
打开浏览器访问：
- **游戏网站**：`https://your-domain.com/games/`
- **原网站**：`https://your-domain.com/`

#### 步骤6：如果需要调整路径
如果游戏网站在子目录中工作不正常，编辑 `games.json`：
```json
{
  "games": [
    {
      "url": "/games/games/game1/index.html"
    }
  ]
}
```

### 🔧 自动化部署脚本

我已经为你创建了 `server-deploy.sh` 脚本，可以在服务器上运行：

```bash
# 上传脚本到服务器
scp server-deploy.sh your-username@your-server:/var/www/douyin-admin-master/

# 在服务器上运行
cd /var/www/douyin-admin-master
chmod +x server-deploy.sh
./server-deploy.sh
```

### 🚨 重要提醒

1. **备份原网站**：
   ```bash
   cp -r /var/www/douyin-admin-master /var/www/douyin-admin-master-backup
   ```

2. **权限设置**：
   ```bash
   sudo chown -R www-data:www-data /var/www/douyin-admin-master/games
   ```

3. **Web服务器重启**（如果需要）：
   ```bash
   sudo systemctl restart apache2  # Apache
   # 或
   sudo systemctl restart nginx    # Nginx
   ```

4. **防火墙检查**：
   确保服务器防火墙允许HTTP/HTTPS访问

### 🐛 故障排除

如果部署后无法访问，请检查：

1. **文件权限**：`ls -la /var/www/douyin-admin-master/games/`
2. **Web服务器配置**：确保支持子目录访问
3. **域名解析**：确认域名正确指向服务器
4. **SSL证书**：如果使用HTTPS，确保证书配置正确

## 注意事项

1. **路径问题**：确保所有资源文件的路径都是相对路径
2. **权限设置**：确保服务器有读取文件的权限
3. **缓存清理**：部署后可能需要清理浏览器缓存
4. **备份**：部署前备份现有网站

## 技术支持

如果在部署过程中遇到问题，请提供：
- 服务器类型（Apache/Nginx/Node.js等）
- 错误信息
- 访问的URL
- 服务器配置信息