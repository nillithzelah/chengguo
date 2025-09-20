#!/bin/bash

# 检查当前nginx使用的配置文件
# 用于确定巨量广告监测链接配置是否生效

echo "🔍 检查nginx配置状态..."
echo "========================================"

# 检查nginx是否正在运行
if ! pgrep -x "nginx" > /dev/null; then
    echo "❌ nginx服务未运行"
    echo "💡 请先启动nginx服务: sudo systemctl start nginx"
    exit 1
fi

echo "✅ nginx服务正在运行"

# 检查nginx进程信息
echo ""
echo "📋 nginx进程信息:"
ps aux | grep nginx | grep -v grep

# 检查当前加载的配置文件
echo ""
echo "📄 当前nginx配置文件:"
nginx -T 2>/dev/null | grep -E "(server_name|include|config file)" | head -10

# 检查sites-enabled目录
echo ""
echo "📁 sites-enabled目录内容:"
if [ -d "/etc/nginx/sites-enabled" ]; then
    ls -la /etc/nginx/sites-enabled/
else
    echo "❌ /etc/nginx/sites-enabled 目录不存在"
fi

# 检查可能的配置文件位置
echo ""
echo "🔍 检查可能的配置文件位置:"

CONFIG_FILES=(
    "/etc/nginx/sites-enabled/douyin-admin"
    "/etc/nginx/sites-enabled/default"
    "/etc/nginx/nginx.conf"
    "/usr/local/nginx/conf/nginx.conf"
)

for config_file in "${CONFIG_FILES[@]}"; do
    if [ -f "$config_file" ]; then
        echo "✅ 找到配置文件: $config_file"
        # 检查是否包含openid/report配置
        if grep -q "openid/report" "$config_file"; then
            echo "   ✅ 包含巨量广告监测配置"
        else
            echo "   ❌ 不包含巨量广告监测配置"
        fi
    fi
done

# 检查项目中的配置文件
echo ""
echo "📂 项目中的nginx配置文件:"
PROJECT_CONFIGS=(
    "config/nginx.conf"
    "config/nginx-single-domain.conf"
    "config/nginx-temp.conf"
)

for config_file in "${PROJECT_CONFIGS[@]}"; do
    if [ -f "$config_file" ]; then
        echo "✅ 项目配置文件: $config_file"
        if grep -q "openid/report" "$config_file"; then
            echo "   ✅ 包含巨量广告监测配置"
        else
            echo "   ❌ 不包含巨量广告监测配置"
        fi
    fi
done

echo ""
echo "💡 使用说明:"
echo "1. 如果需要切换配置文件，请复制相应的配置文件到 /etc/nginx/sites-enabled/"
echo "2. 然后重新加载nginx配置: sudo nginx -s reload"
echo "3. 测试监测链接: curl 'http://localhost/openid/report?test=1'"

echo ""
echo "🔧 常用命令:"
echo "   查看当前配置: sudo nginx -T"
echo "   重新加载配置: sudo nginx -s reload"
echo "   检查语法: sudo nginx -t"
echo "   重启服务: sudo systemctl restart nginx"