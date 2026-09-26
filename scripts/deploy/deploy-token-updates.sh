#!/bin/bash

# Token管理系统更新部署脚本
# 服务器: 47.115.94.203
# 用户: root
# 项目路径: /var/www/douyin-admin-master
#
# 功能:
# 1. 上传更新后的server.js
# 2. 重置数据库tokens表（删除旧表，创建新表）
# 3. 重启Node.js服务
# 4. 验证部署结果

echo "🚀 开始部署Token管理系统更新..."

# 服务器信息
SERVER_IP="47.115.94.203"
SERVER_USER="root"
PROJECT_PATH="/var/www/douyin-admin-master"

echo "📡 连接到服务器: $SERVER_IP"

# 上传修改的文件
echo "📤 上传server.js..."
scp server.js $SERVER_USER@$SERVER_IP:$PROJECT_PATH/

echo "📤 上传Token管理脚本..."
scp scripts/reset-tokens-table.js $SERVER_USER@$SERVER_IP:$PROJECT_PATH/scripts/
scp scripts/update-token-sqlite.js $SERVER_USER@$SERVER_IP:$PROJECT_PATH/scripts/
scp scripts/query-db.js $SERVER_USER@$SERVER_IP:$PROJECT_PATH/scripts/
scp scripts/README-token-scripts.md $SERVER_USER@$SERVER_IP:$PROJECT_PATH/scripts/

echo "✅ 文件上传完成"

# 在服务器上执行部署
echo "🔄 在服务器上执行部署..."
ssh $SERVER_USER@$SERVER_IP << 'EOF'
cd /var/www/douyin-admin-master

echo "📦 备份当前版本..."
cp server.js server.js.backup.$(date +%Y%m%d_%H%M%S)

echo "🗑️ 重置数据库tokens表..."
node scripts/reset-tokens-table.js

echo "🔄 重启服务..."
# 停止当前服务
pkill -f "node server.js" || true

# 等待一下
sleep 2

# 启动新服务
nohup node server.js > server.log 2>&1 &
echo $! > server.pid

echo "⏳ 等待服务启动..."
sleep 5

# 检查服务状态
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ 服务启动成功"
else
    echo "❌ 服务启动失败，请检查日志"
    exit 1
fi

echo "🎯 验证Token状态..."
curl -s http://localhost:3000/api/douyin/token-status

echo "🎉 部署完成！"
EOF

echo "🎉 本地部署脚本执行完成！"
echo ""
echo "📋 部署摘要:"
echo "   服务器: $SERVER_IP"
echo "   项目路径: $PROJECT_PATH"
echo "   修改文件: server.js + 5个脚本文件"
echo "   数据库操作: 已重置tokens表"
echo "   服务状态: 已重启并验证"
echo ""
echo "🔍 验证命令:"
echo "   ssh $SERVER_USER@$SERVER_IP 'curl http://localhost:3000/api/health'"
echo "   ssh $SERVER_USER@$SERVER_IP 'curl http://localhost:3000/api/douyin/token-status'"
echo ""
echo "🛠️ 后续Token管理:"
echo "   查看完整Token: ssh $SERVER_USER@$SERVER_IP 'cd /var/www/douyin-admin-master && node scripts/query-db.js'"
echo "   更新Access Token: ssh $SERVER_USER@$SERVER_IP 'cd /var/www/douyin-admin-master && node scripts/update-token-sqlite.js access_token \"新的token值\"'"
echo "   更新Refresh Token: ssh $SERVER_USER@$SERVER_IP 'cd /var/www/douyin-admin-master && node scripts/update-token-sqlite.js refresh_token \"新的token值\"'"