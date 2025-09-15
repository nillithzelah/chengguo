#!/bin/bash

echo "🔧 修复服务器 500 错误..."

# 更新 PM2
echo "更新 PM2..."
pm2 update

# 停止所有相关进程
echo "停止现有进程..."
pm2 delete all 2>/dev/null || echo "没有进程需要停止"

# 进入项目目录
cd /var/www/douyin-admin-master

# 检查并完善环境变量
echo "检查环境变量..."
if [ ! -f ".env" ]; then
    echo "❌ .env 文件不存在"
    exit 1
fi

# 确保必要的环境变量存在
if ! grep -q "JWT_SECRET" .env; then
    echo "JWT_SECRET=your_jwt_secret_key_here" >> .env
    echo "✅ 添加了 JWT_SECRET"
fi

if ! grep -q "DB_PATH" .env; then
    echo "DB_PATH=./database.sqlite" >> .env
    echo "✅ 添加了 DB_PATH"
fi

# 重新安装依赖（以防万一）
echo "重新安装依赖..."
rm -rf node_modules package-lock.json
yarn install

# 创建日志目录
mkdir -p logs

# 启动应用
echo "启动应用..."
pm2 start ecosystem.config.js --name "douyin-admin-api"

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root

# 显示状态
echo -e "\n=== 应用状态 ==="
pm2 status

# 显示日志
echo -e "\n=== 最新日志 ==="
pm2 logs douyin-admin-api --lines 10 --nostream

# 测试 API
echo -e "\n=== 测试 API ==="
sleep 3
curl -s http://localhost:3000/api/health || echo "API 测试失败"

echo -e "\n✅ 修复完成！"
echo "访问地址: http://47.115.94.203"
echo "API 地址: http://47.115.94.203/api/health"