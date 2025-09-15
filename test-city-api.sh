#!/bin/bash

echo "🧪 测试城市API访问情况"

# 测试主要API
echo "=== 测试 ip-api.com ==="
curl -s "http://ip-api.com/json/" | head -10

echo -e "\n=== 测试 ipapi.co ==="
curl -s "https://ipapi.co/json/" | head -10

echo -e "\n=== 测试备用API ==="
curl -s "https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=39.9042&longitude=116.4074&localityLanguage=zh" | head -5

# 测试网络连接
echo -e "\n=== 测试网络连接 ==="
ping -c 2 8.8.8.8 >/dev/null 2>&1 && echo "✅ 网络连接正常" || echo "❌ 网络连接失败"

# 检查防火墙
echo -e "\n=== 检查防火墙 ==="
sudo ufw status | grep -E "(80|443)" || echo "无相关防火墙规则"

echo -e "\n🔍 测试完成"