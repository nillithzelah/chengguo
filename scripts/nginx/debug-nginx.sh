#!/bin/bash

# nginx配置调试脚本
echo "🔍 nginx配置调试工具"
echo "===================="

# 检查nginx状态
echo "📋 检查nginx状态..."
sudo systemctl status nginx --no-pager -l

echo ""
echo "📄 检查当前nginx配置..."
sudo nginx -T | grep -A 20 -B 5 "openid/report"

echo ""
echo "🧪 测试本地后端连接..."
curl -v http://localhost:3000/openid/report?test=1 2>&1 | head -20

echo ""
echo "🌐 测试公网连接..."
timeout 10 curl -v "https://ecpm.game985.vip/openid/report?promotionid=test&imei=test&callback=test" 2>&1 | head -30

echo ""
echo "📊 检查nginx错误日志..."
sudo tail -20 /var/log/nginx/error.log

echo ""
echo "🔍 检查nginx访问日志..."
sudo tail -10 /var/log/nginx/access.log