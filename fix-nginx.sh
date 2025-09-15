#!/bin/bash

echo "🔧 修复 Nginx 配置问题..."

# 停止 Nginx 服务
echo "停止 Nginx 服务..."
sudo systemctl stop nginx

# 备份当前的配置文件
echo "备份当前配置文件..."
sudo cp /etc/nginx/sites-enabled/ecpm-app.save.3 /etc/nginx/sites-enabled/ecpm-app.save.3.backup 2>/dev/null || true

# 删除损坏的配置文件
echo "删除损坏的配置文件..."
sudo rm -f /etc/nginx/sites-enabled/ecpm-app.save.3

# 检查并删除其他可能损坏的配置文件
echo "清理可能损坏的配置文件..."
sudo find /etc/nginx/sites-enabled/ -name "*.save*" -delete

# 确保默认配置文件存在
echo "确保默认配置文件存在..."
if [ ! -f /etc/nginx/sites-enabled/default ]; then
    sudo ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/ 2>/dev/null || true
fi

# 测试 Nginx 配置
echo "测试 Nginx 配置..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx 配置测试通过"
    echo "启动 Nginx 服务..."
    sudo systemctl start nginx
    echo "✅ Nginx 服务已启动"
else
    echo "❌ Nginx 配置仍有问题，请检查配置文件"
    exit 1
fi

echo "🎉 Nginx 配置修复完成！"