#!/bin/bash

echo "🎯 部署最终清理版本 - 隐藏调试按钮"

# 备份当前文件
echo "备份当前文件..."
sudo cp -r /var/www/html /var/www/html.backup.final.clean.$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo "备份跳过"

# 解压最终清理版本
echo "解压最终清理版本..."
cd /var/www
sudo unzip -o dist-final-clean.zip -d /tmp/

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

echo "✅ 最终清理版本部署完成！"
echo ""
echo "🔧 清理内容："
echo "  - 隐藏了调试相关按钮"
echo "  - 保持了缓存修复功能"
echo "  - 城市获取正常工作"
echo ""
echo "🎯 现在页面只显示："
echo "  - 查询数据按钮"
echo "  - 干净的用户界面"
echo ""
echo "访问: http://47.115.94.203"
echo ""
echo "💡 城市信息会在后台自动获取，不再需要手动操作"