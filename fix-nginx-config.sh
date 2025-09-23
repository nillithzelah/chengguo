#!/bin/bash

# 修复nginx配置脚本
# 用于解决巨量广告监测链接不工作的问题

echo "🔧 修复nginx配置 - 巨量广告监测链接"
echo "========================================"

# 检查nginx状态
echo "📋 检查nginx状态..."
if systemctl is-active --quiet nginx; then
    echo "✅ nginx正在运行"
else
    echo "❌ nginx未运行，正在启动..."
    sudo systemctl start nginx
fi

# 备份当前配置
echo "💾 备份当前nginx配置..."
sudo cp /etc/nginx/sites-available/douyin-admin /etc/nginx/sites-available/douyin-admin.backup.$(date +%Y%m%d_%H%M%S)

# 检查配置文件语法
echo "🔍 检查nginx配置语法..."
sudo nginx -t
if [ $? -ne 0 ]; then
    echo "❌ nginx配置语法错误，请检查配置文件"
    exit 1
fi

# 重新加载nginx配置
echo "🔄 重新加载nginx配置..."
sudo systemctl reload nginx
if [ $? -eq 0 ]; then
    echo "✅ nginx配置重新加载成功"
else
    echo "❌ nginx配置重新加载失败"
    exit 1
fi

# 测试监测端点
echo "🧪 测试监测端点..."
sleep 2

response=$(curl -s -w "%{http_code}" "https://ecpm.game985.vip/openid/report?promotionid=test&imei=test&callback=test" | tail -c 3)
content_type=$(curl -s -I "https://ecpm.game985.vip/openid/report?test=1" | grep -i "content-type" | cut -d: -f2 | tr -d ' ')

if [ "$response" = "200" ] && [[ "$content_type" == *"application/javascript"* ]]; then
    echo "✅ 监测端点测试成功"
    echo "🎉 修复完成！巨量广告监测链接现在应该可以正常工作了"
else
    echo "❌ 监测端点测试失败"
    echo "📄 响应状态: $response"
    echo "📋 内容类型: $content_type"
    echo "💡 可能需要手动检查nginx配置"
fi

echo ""
echo "📝 手动测试命令："
echo "curl 'https://ecpm.game985.vip/openid/report?promotionid=test&imei=test&callback=test'"