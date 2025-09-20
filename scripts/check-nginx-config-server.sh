#!/bin/bash

# Nginx配置文件检查脚本 - 服务器版
# 用于检查当前nginx使用的配置文件和巨量广告监测配置状态

echo "🔍 Nginx配置文件检查工具 (服务器版)"
echo "========================================"

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo "⚠️  建议使用root权限运行此脚本以获取完整信息"
    echo "   可以使用: sudo $0"
    echo ""
fi

# 检查nginx是否安装
if ! command -v nginx &> /dev/null; then
    echo "❌ nginx未安装或不在PATH中"
    exit 1
fi

echo "✅ nginx已安装"

# 检查nginx是否正在运行
if ! pgrep -x "nginx" > /dev/null; then
    echo "❌ nginx服务未运行"
    echo "💡 启动命令: sudo systemctl start nginx"
    exit 1
fi

echo "✅ nginx服务正在运行"

# 获取nginx版本
NGINX_VERSION=$(nginx -v 2>&1 | cut -d'/' -f2)
echo "📋 nginx版本: $NGINX_VERSION"

echo ""
echo "📊 系统信息:"
echo "   操作系统: $(uname -s) $(uname -r)"
echo "   主机名: $(hostname)"
echo "   当前用户: $(whoami)"
echo "   工作目录: $(pwd)"

echo ""
echo "🔧 Nginx进程信息:"
ps aux | grep nginx | grep -v grep | head -5

echo ""
echo "📁 Nginx配置文件位置:"

# 检查常见的nginx配置文件位置
CONFIG_LOCATIONS=(
    "/etc/nginx/nginx.conf"
    "/etc/nginx/sites-enabled/default"
    "/usr/local/nginx/conf/nginx.conf"
    "/usr/local/etc/nginx/nginx.conf"
)

MAIN_CONFIG=""
for config in "${CONFIG_LOCATIONS[@]}"; do
    if [ -f "$config" ]; then
        echo "✅ 主配置文件: $config"
        MAIN_CONFIG="$config"
        break
    fi
done

if [ -z "$MAIN_CONFIG" ]; then
    echo "❌ 未找到nginx主配置文件"
    exit 1
fi

# 检查sites-enabled目录
echo ""
echo "📂 Sites-enabled目录:"
if [ -d "/etc/nginx/sites-enabled" ]; then
    echo "✅ /etc/nginx/sites-enabled 目录存在"
    ls -la /etc/nginx/sites-enabled/ 2>/dev/null || echo "   (无配置文件)"
else
    echo "❌ /etc/nginx/sites-enabled 目录不存在"
fi

# 检查当前加载的配置
echo ""
echo "🔍 当前加载的配置分析:"

# 获取nginx配置测试结果
if nginx -t &>/dev/null; then
    echo "✅ nginx配置语法正确"
else
    echo "❌ nginx配置语法错误"
fi

# 分析当前使用的配置文件
echo ""
echo "📋 当前活动配置:"

# 检查是否有符号链接指向sites-enabled
if [ -L "/etc/nginx/sites-enabled/default" ]; then
    TARGET=$(readlink -f /etc/nginx/sites-enabled/default)
    echo "🔗 默认站点配置指向: $TARGET"
fi

# 查找所有包含server块的配置文件
echo ""
echo "🌐 找到的服务器配置:"

# 搜索所有nginx配置文件中的server块
find /etc/nginx -name "*.conf" -type f 2>/dev/null | while read -r conf_file; do
    if grep -q "server {" "$conf_file" 2>/dev/null; then
        SERVER_NAMES=$(grep -h "server_name" "$conf_file" 2>/dev/null | sed 's/.*server_name//' | tr -d ';' | tr -d ' ')
        if [ -n "$SERVER_NAMES" ]; then
            echo "📄 $conf_file"
            echo "   域名: $SERVER_NAMES"

            # 检查是否包含巨量广告监测配置
            if grep -q "openid/report" "$conf_file" 2>/dev/null; then
                echo "   ✅ 包含巨量广告监测配置"
            else
                echo "   ❌ 缺少巨量广告监测配置"
            fi
            echo ""
        fi
    fi
done

# 检查项目目录中的配置文件
echo ""
echo "📂 项目目录配置检查:"

PROJECT_DIR="/var/www/douyin-admin-master"
if [ -d "$PROJECT_DIR" ]; then
    echo "✅ 项目目录存在: $PROJECT_DIR"

    if [ -d "$PROJECT_DIR/config" ]; then
        echo "📋 项目配置文件:"

        for conf_file in "$PROJECT_DIR"/config/nginx*.conf; do
            if [ -f "$conf_file" ]; then
                basename=$(basename "$conf_file")
                echo "   📄 $basename"

                if grep -q "openid/report" "$conf_file" 2>/dev/null; then
                    echo "      ✅ 包含巨量广告监测配置"
                else
                    echo "      ❌ 缺少巨量广告监测配置"
                fi
            fi
        done
    fi
else
    echo "❌ 项目目录不存在: $PROJECT_DIR"
fi

# 测试巨量广告监测端点
echo ""
echo "🧪 测试巨量广告监测端点:"

# 检查本地服务是否运行
if curl -s http://localhost:3000/api/health &>/dev/null; then
    echo "✅ 本地Node.js服务正在运行 (端口3000)"

    # 测试监测端点
    TEST_URL="http://localhost:3000/openid/report?test=1&timestamp=$(date +%s)"
    if curl -s "$TEST_URL" &>/dev/null; then
        echo "✅ 巨量广告监测端点可访问"
    else
        echo "❌ 巨量广告监测端点无响应"
    fi
else
    echo "❌ 本地Node.js服务未运行 (端口3000)"
fi

# 检查公网访问
echo ""
echo "🌐 公网访问测试:"
if command -v curl &> /dev/null; then
    if curl -s --max-time 5 https://ecpm.game985.vip/api/health &>/dev/null; then
        echo "✅ 公网域名可访问: https://ecpm.game985.vip"

        # 测试公网监测端点
        PUBLIC_TEST_URL="https://ecpm.game985.vip/openid/report?test=1&timestamp=$(date +%s)"
        if curl -s --max-time 5 "$PUBLIC_TEST_URL" &>/dev/null; then
            echo "✅ 公网监测端点可访问"
        else
            echo "❌ 公网监测端点无响应"
        fi
    else
        echo "❌ 公网域名无响应: https://ecpm.game985.vip"
    fi
else
    echo "⚠️  curl命令不可用，跳过公网测试"
fi

echo ""
echo "💡 配置建议:"

# 检查是否需要重新加载配置
if [ -f "/etc/nginx/sites-enabled/douyin-admin" ]; then
    CURRENT_CONFIG=$(readlink -f /etc/nginx/sites-enabled/douyin-admin 2>/dev/null || echo "/etc/nginx/sites-enabled/douyin-admin")

    if [ -f "$PROJECT_DIR/config/nginx.conf" ]; then
        if ! cmp -s "$CURRENT_CONFIG" "$PROJECT_DIR/config/nginx.conf"; then
            echo "⚠️  当前nginx配置与项目配置不一致"
            echo "   建议更新配置: sudo cp $PROJECT_DIR/config/nginx.conf /etc/nginx/sites-enabled/douyin-admin"
            echo "   然后重新加载: sudo nginx -s reload"
        else
            echo "✅ 当前nginx配置与项目配置一致"
        fi
    fi
fi

echo ""
echo "🔧 常用管理命令:"
echo "   查看完整配置: sudo nginx -T"
echo "   检查配置语法: sudo nginx -t"
echo "   重新加载配置: sudo nginx -s reload"
echo "   重启nginx服务: sudo systemctl restart nginx"
echo "   查看nginx状态: sudo systemctl status nginx"
echo "   查看错误日志: sudo tail -f /var/log/nginx/error.log"
echo "   查看访问日志: sudo tail -f /var/log/nginx/access.log"

echo ""
echo "📝 日志文件位置:"
echo "   错误日志: /var/log/nginx/error.log"
echo "   访问日志: /var/log/nginx/access.log"
echo "   广告监测日志: /var/log/nginx/ad-monitor.access.log (如果配置了)"

echo ""
echo "🎯 快速配置命令:"

if [ -d "$PROJECT_DIR/config" ]; then
    echo "# 复制主配置文件:"
    echo "sudo cp $PROJECT_DIR/config/nginx.conf /etc/nginx/sites-enabled/douyin-admin"
    echo ""
    echo "# 复制单域名配置文件:"
    echo "sudo cp $PROJECT_DIR/config/nginx-single-domain.conf /etc/nginx/sites-enabled/douyin-admin"
    echo ""
    echo "# 复制临时配置文件:"
    echo "sudo cp $PROJECT_DIR/config/nginx-temp.conf /etc/nginx/sites-enabled/douyin-admin"
    echo ""
    echo "# 重新加载配置:"
    echo "sudo nginx -s reload"
fi

echo ""
echo "✅ 检查完成！"