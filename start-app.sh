#!/bin/bash

echo "🚀 启动 Node.js 应用..."

# 进入项目目录
cd /var/www/douyin-admin-master

# 检查是否已有 PM2 进程在运行
echo "检查现有 PM2 进程..."
pm2 delete douyin-admin-api 2>/dev/null || echo "没有找到现有进程"

# 确保日志目录存在
mkdir -p logs

# 启动应用
echo "启动应用..."
pm2 start ecosystem.config.js

# 保存 PM2 配置
pm2 save

# 显示状态
echo -e "\n=== 应用状态 ==="
pm2 status

# 显示日志
echo -e "\n=== 最新日志 ==="
pm2 logs douyin-admin-api --lines 10 --nostream

echo -e "\n✅ 应用启动完成！"
echo "访问地址: http://47.115.94.203"
echo "API 地址: http://47.115.94.203/api/"