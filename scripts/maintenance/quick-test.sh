#!/bin/bash

echo "🚀 快速诊断脚本"
echo "==============="

echo "1️⃣ 检查nginx状态..."
sudo systemctl is-active nginx && echo "✅ nginx运行正常" || echo "❌ nginx未运行"

echo ""
echo "2️⃣ 检查后端服务..."
if curl -s --max-time 5 http://localhost:3000/api/health > /dev/null; then
    echo "✅ 后端服务运行正常"
else
    echo "❌ 后端服务无响应"
fi

echo ""
echo "3️⃣ 测试nginx配置..."
sudo nginx -t && echo "✅ nginx配置语法正确" || echo "❌ nginx配置有语法错误"

echo ""
echo "4️⃣ 测试公网访问..."
response=$(timeout 10 curl -s -w "%{http_code}" "https://ecpm.game985.vip/openid/report?test=1" 2>/dev/null)
if [ "$response" = "200" ]; then
    echo "✅ 公网访问正常"
else
    echo "❌ 公网访问失败 (HTTP $response)"
fi

echo ""
echo "5️⃣ 检查当前nginx配置中的openid/report规则..."
sudo nginx -T 2>/dev/null | grep -A 10 -B 2 "openid/report" || echo "❌ 未找到openid/report配置"