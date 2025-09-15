#!/bin/bash

echo "🎯 部署用户页面调试版本 - 包含页面内调试面板"

# 备份当前文件
echo "备份当前文件..."
sudo cp -r /var/www/html /var/www/html.backup.user.debug.$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo "备份跳过"

# 解压用户调试版本
echo "解压用户调试版本..."
cd /var/www
sudo unzip -o dist-debug-user-final.zip -d /tmp/

# 替换文件
echo "替换网站文件..."
sudo rm -rf /var/www/html/*
sudo cp -r /tmp/dist/* /var/www/html/ 2>/dev/null || {
    echo "❌ 文件复制失败"
    exit 1
}

# 设置权限
echo "设置权限..."
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html

# 重启服务
echo "重启服务..."
sudo systemctl restart nginx
pm2 restart all 2>/dev/null || echo "PM2重启跳过"

echo "✅ 用户调试版本部署完成！"
echo "现在访问网站，你会看到："
echo ""
echo "🔍 页面顶部有一个 '调试城市获取' 按钮"
echo "📊 点击后会显示城市获取的详细调试信息"
echo "🗑️ 可以点击 '清除' 按钮清理调试信息"
echo ""
echo "访问: http://47.115.94.203"
echo ""
echo "💡 调试信息会显示："
echo "- API原始响应数据"
echo "- 城市解析结果"
echo "- 任何错误信息"
echo ""
echo "🎯 现在你可以直接在页面上看到城市获取的完整过程！"