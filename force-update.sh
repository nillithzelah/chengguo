#!/bin/bash

echo "🔄 强制更新和重启"

# 清除浏览器缓存相关的文件
echo "清除可能存在的缓存文件..."
rm -rf /var/www/html/assets/*.js.map 2>/dev/null || true
rm -rf /var/www/html/assets/*.css.map 2>/dev/null || true

# 强制重启 Nginx
echo "强制重启 Nginx..."
sudo systemctl stop nginx
sleep 2
sudo systemctl start nginx

# 强制重启 Node.js 应用
echo "强制重启 Node.js 应用..."
pm2 delete all 2>/dev/null || true
sleep 2

cd /var/www/douyin-admin-master
pm2 start ecosystem.config.js --name "douyin-admin-api"
pm2 save

# 等待服务启动
echo "等待服务启动..."
sleep 5

# 显示状态
echo -e "\n=== 服务状态 ==="
echo "Nginx: $(sudo systemctl is-active nginx)"
pm2 status

echo -e "\n✅ 强制更新完成"
echo "请尝试刷新浏览器页面（Ctrl+F5 强制刷新）"
echo "如果仍然显示未知，请检查浏览器控制台的错误信息"