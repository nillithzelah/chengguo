#!/bin/bash

echo "🔍 部署调试版本 - 包含城市获取调试信息"

# 备份当前文件
echo "备份当前文件..."
sudo cp -r /var/www/html /var/www/html.backup.debug.$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo "备份跳过"

# 解压调试版本
echo "解压调试版本..."
cd /var/www
sudo unzip -o dist-debug.zip -d /tmp/

# 替换文件
echo "替换网站文件..."
sudo rm -rf /var/www/html/*
sudo cp -r /tmp/dist/* /var/www/html/

# 设置权限
echo "设置权限..."
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html

# 重启服务
echo "重启服务..."
sudo systemctl restart nginx
pm2 restart all 2>/dev/null || echo "PM2重启跳过"

echo "✅ 调试版本部署完成！"
echo "现在打开浏览器控制台查看城市获取的详细调试信息"
echo "访问: http://47.115.94.203"
echo ""
echo "在浏览器控制台中查找以下信息："
echo "- 🔍 ip-api.com 原始数据:"
echo "- 🔍 ipapi.co 原始数据:"
echo "- 🔍 解析城市:"