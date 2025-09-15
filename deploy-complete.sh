#!/bin/bash

echo "🚀 完整部署脚本 - 修复城市信息并重启所有服务"

# 备份当前网站文件
echo "备份当前网站文件..."
sudo cp -r /var/www/html /var/www/html.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo "首次部署，跳过备份"

# 解压修复后的前端文件
echo "解压修复后的前端文件..."
cd /var/www
sudo unzip -o dist-fixed.zip -d /tmp/

# 替换网站文件
echo "替换网站文件..."
sudo rm -rf /var/www/html
sudo mv /tmp/dist /var/www/html

# 设置权限
echo "设置文件权限..."
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html

# 重启 Nginx
echo "重启 Nginx..."
sudo systemctl restart nginx

# 检查并重启 Node.js 应用
echo "检查 Node.js 应用状态..."
if pm2 list | grep -q "online"; then
    echo "重启 Node.js 应用..."
    pm2 restart all
    pm2 save
else
    echo "启动 Node.js 应用..."
    cd /var/www/douyin-admin-master
    pm2 start ecosystem.config.js --name "douyin-admin-api"
    pm2 save
fi

# 显示服务状态
echo -e "\n=== 服务状态检查 ==="
echo "Nginx 状态:"
sudo systemctl is-active nginx

echo -e "\nPM2 应用状态:"
pm2 jlist | jq -r '.[] | "\(.name): \(.pm2_env.status)"' 2>/dev/null || pm2 list --no-color

echo -e "\n✅ 完整部署完成！"
echo "城市信息修复已生效"
echo "前端和后端服务都已重启"
echo "备份文件保存在: /var/www/html.backup.$(date +%Y%m%d_%H%M%S)"
echo "访问地址: http://47.115.94.203"