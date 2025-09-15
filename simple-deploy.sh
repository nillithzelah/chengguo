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