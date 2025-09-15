#!/bin/bash

echo "🔄 重启所有服务"

# 重启 Nginx
echo "重启 Nginx..."
sudo systemctl restart nginx

# 检查并重启 Node.js 应用
echo "检查 Node.js 应用..."
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

# 显示状态
echo -e "\n=== 服务状态 ==="
echo "Nginx: $(sudo systemctl is-active nginx)"
echo "Node.js 应用:"
pm2 jlist | jq -r '.[] | "\(.name): \(.pm2_env.status)"' 2>/dev/null || pm2 list --no-color

echo -e "\n✅ 服务重启完成！"
echo "访问地址: http://47.115.94.203"