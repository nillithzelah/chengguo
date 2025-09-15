#!/bin/bash

echo "🧪 测试服务器上的IP和地理位置API可访问性..."

# 测试IP获取API
echo -e "\n=== 测试IP获取API ==="

apis=(
    "https://api.ipify.org?format=json"
    "https://httpbin.org/ip"
    "https://api64.ipify.org?format=json"
)

for api in "${apis[@]}"; do
    echo "测试 $api..."
    response=$(curl -s -w "HTTPSTATUS:%{http_code};" --max-time 5 "$api" 2>/dev/null)
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo $response | sed -e 's/HTTPSTATUS:.*//g')

    if [ "$http_code" = "200" ]; then
        echo "✅ $api - 成功 (HTTP $http_code)"
        echo "   响应: $body"
    else
        echo "❌ $api - 失败 (HTTP $http_code)"
    fi
done

# 测试地理位置API
echo -e "\n=== 测试地理位置API ==="

geo_apis=(
    "https://ipapi.co/json/"
    "http://ip-api.com/json/"
)

for api in "${geo_apis[@]}"; do
    echo "测试 $api..."
    response=$(curl -s -w "HTTPSTATUS:%{http_code};" --max-time 5 "$api" 2>/dev/null)
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo $response | sed -e 's/HTTPSTATUS:.*//g')

    if [ "$http_code" = "200" ]; then
        echo "✅ $api - 成功 (HTTP $http_code)"
        # 提取城市信息
        city=$(echo $body | grep -o '"city":"[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "N/A")
        echo "   城市: $city"
    else
        echo "❌ $api - 失败 (HTTP $http_code)"
    fi
done

# 测试网络连接
echo -e "\n=== 测试网络连接 ==="
echo "ping 测试..."
ping -c 2 8.8.8.8 >/dev/null 2>&1 && echo "✅ 外部网络连接正常" || echo "❌ 外部网络连接失败"

# 检查防火墙状态
echo -e "\n=== 检查防火墙状态 ==="
if command -v ufw >/dev/null 2>&1; then
    echo "UFW 状态:"
    sudo ufw status | head -10
elif command -v firewall-cmd >/dev/null 2>&1; then
    echo "Firewalld 状态:"
    sudo firewall-cmd --state
else
    echo "未检测到常见的防火墙管理工具"
fi

echo -e "\n🔧 测试完成"
echo "如果API测试失败，可能是网络限制或防火墙问题"