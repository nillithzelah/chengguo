#!/bin/bash

echo "🧹 清除设备信息缓存..."

# 备份当前文件
echo "备份当前文件..."
sudo cp -r /var/www/html /var/www/html.backup.clear.$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo "备份跳过"

# 解压缓存修复版本
echo "解压缓存修复版本..."
cd /var/www
sudo unzip -o dist-cache-fix-final.zip -d /tmp/

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

echo "✅ 缓存修复版本部署完成！"
echo ""
echo "🔧 修复内容："
echo "  - 修复了城市获取缓存问题"
echo "  - 添加了页面内缓存清除按钮"
echo "  - 强制重新获取城市信息"
echo ""
echo "🎯 使用方法："
echo "1. 访问网站: http://47.115.94.203"
echo "2. 点击 '调试城市获取' 按钮查看调试信息"
echo "3. 如果城市仍显示'未知'，点击 '清除缓存' 按钮"
echo "4. 刷新页面重新获取设备信息"
echo ""
echo "📊 调试面板会显示："
echo "  - IP获取过程"
echo "  - 城市API调用结果"
echo "  - 任何错误信息"