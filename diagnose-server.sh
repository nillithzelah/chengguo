#!/bin/bash

echo "🔍 诊断服务器问题..."

# 检查 Nginx 状态
echo "=== Nginx 状态 ==="
sudo systemctl status nginx --no-pager -l

# 检查应用进程
echo -e "\n=== 应用进程状态 ==="
ps aux | grep node | grep -v grep

# 检查 PM2 状态
echo -e "\n=== PM2 状态 ==="
pm2 list 2>/dev/null || echo "PM2 未安装或未运行"

# 检查端口占用
echo -e "\n=== 端口 3000 占用情况 ==="
sudo netstat -tlnp | grep :3000 || echo "端口 3000 未被占用"

# 检查应用日志
echo -e "\n=== 应用日志 ==="
if [ -f "/var/www/douyin-admin-master/logs/combined-0.log" ]; then
    tail -20 /var/www/douyin-admin-master/logs/combined-0.log
else
    echo "应用日志文件不存在"
fi

# 检查错误日志
echo -e "\n=== 错误日志 ==="
if [ -f "/var/www/douyin-admin-master/logs/err-0.log" ]; then
    tail -20 /var/www/douyin-admin-master/logs/err-0.log
else
    echo "错误日志文件不存在"
fi

# 检查项目目录
echo -e "\n=== 项目目录结构 ==="
ls -la /var/www/douyin-admin-master/

# 检查环境变量
echo -e "\n=== 环境变量检查 ==="
if [ -f "/var/www/douyin-admin-master/.env" ]; then
    echo "✅ .env 文件存在"
    cat /var/www/douyin-admin-master/.env | grep -v PASSWORD | grep -v SECRET
else
    echo "❌ .env 文件不存在"
fi

# 检查 Node.js 版本
echo -e "\n=== Node.js 版本 ==="
node --version

# 检查 yarn 版本
echo -e "\n=== Yarn 版本 ==="
yarn --version 2>/dev/null || echo "Yarn 未安装"

echo -e "\n🔧 诊断完成"