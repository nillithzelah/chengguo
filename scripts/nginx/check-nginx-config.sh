#!/bin/bash

echo "🔍 nginx配置诊断脚本"
echo "===================="

# 检查nginx状态
echo "1. nginx状态："
sudo systemctl status nginx --no-pager | head -3

echo ""
echo "2. 检查当前生效的配置："
sudo nginx -T 2>/dev/null | grep -A 10 -B 2 "openid/report" || echo "❌ 未找到openid/report规则"

echo ""
echo "3. 检查API规则："
sudo nginx -T 2>/dev/null | grep -A 5 -B 2 "location /api" || echo "❌ 未找到API规则"

echo ""
echo "4. 检查配置文件语法："
sudo nginx -t

echo ""
echo "5. 显示ecpm-app配置的server块："
sudo grep -A 50 "server {" /etc/nginx/sites-enabled/ecpm-app | head -60

echo ""
echo "6. 测试本地后端："
curl -s --max-time 3 http://localhost:3000/openid/report?test=1 2>/dev/null | head -5 || echo "❌ 后端无响应"

echo ""
echo "7. 测试公网访问："
timeout 5 curl -s -I "https://ecpm.game985.vip/openid/report?test=1" 2>/dev/null | head -5 || echo "❌ 公网访问失败"

echo ""
echo "诊断完成！"