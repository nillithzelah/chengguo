#!/bin/bash

echo "🔄 简单文件替换脚本"

# 确保解压文件存在
if [ ! -d "/tmp/dist" ]; then
    echo "解压修复文件..."
    cd /var/www
    unzip -o dist-fixed.zip -d /tmp/ 2>/dev/null || {
        echo "❌ 解压失败，请确保 dist-fixed.zip 文件存在"
        exit 1
    }
fi

# 显示当前文件
echo "当前网站文件:"
ls -la /var/www/html/ | head -3

# 备份（可选）
echo "创建快速备份..."
cp -r /var/www/html /var/www/html.quick.backup 2>/dev/null || echo "备份跳过"

# 直接替换文件
echo "替换网站文件..."
rm -rf /var/www/html/*
cp -r /tmp/dist/* /var/www/html/ 2>/dev/null || {
    echo "❌ 文件复制失败"
    exit 1
}

# 设置权限
echo "设置权限..."
chown -R www-data:www-data /var/www/html
chmod -R 755 /var/www/html

# 显示新文件
echo "新网站文件:"
ls -la /var/www/html/ | head -3

# 验证关键文件
if [ -f "/var/www/html/index.html" ]; then
    echo "✅ index.html 存在"
else
    echo "❌ index.html 不存在"
fi

echo "✅ 文件替换完成"
echo "访问: http://47.115.94.203"