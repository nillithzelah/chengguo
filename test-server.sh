#!/bin/bash

echo "🧪 测试服务器状态..."

# 测试前端
echo "=== 测试前端 ==="
curl -s -o /dev/null -w "HTTP 状态码: %{http_code}\n" http://47.115.94.203/

# 测试 API 健康检查
echo -e "\n=== 测试 API 健康检查 ==="
curl -s http://47.115.94.203/api/health || echo "API 健康检查失败"

# 测试 API 根路径
echo -e "\n=== 测试 API 根路径 ==="
curl -s http://47.115.94.203/api/ || echo "API 根路径测试失败"

# 检查应用进程
echo -e "\n=== 应用进程状态 ==="
ps aux | grep node | grep -v grep

# 检查 PM2 状态
echo -e "\n=== PM2 状态 ==="
pm2 jlist | jq -r '.[] | "\(.name): \(.pm2_env.status) - PID: \(.pid)"' 2>/dev/null || pm2 list --no-color

# 检查端口
echo -e "\n=== 端口状态 ==="
sudo netstat -tlnp | grep :3000 || echo "端口 3000 未监听"

# 检查最近的日志
echo -e "\n=== 最近的应用日志 ==="
pm2 logs douyin-admin-api --lines 5 --nostream 2>/dev/null || echo "无法获取 PM2 日志"

echo -e "\n✅ 测试完成"