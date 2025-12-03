#!/bin/bash

# 部署到老服务器的脚本
# 老服务器IP: 47.115.94.203

echo "🚀 开始部署到老服务器 (47.115.94.203)..."

# 服务器信息
OLD_SERVER="47.115.94.203"
REMOTE_USER="root"
REMOTE_PATH="/var/www/douyin-admin-master"

echo "📡 连接到老服务器..."

# 1. 上传更新的模型文件
echo "📤 上传模型文件..."
scp -i ~/.ssh/id_rsa_douyin models/*.js ${REMOTE_USER}@${OLD_SERVER}:${REMOTE_PATH}/models/

# 2. 上传更新的服务器文件
echo "📤 上传服务器文件..."
scp -i ~/.ssh/id_rsa_douyin server.js ${REMOTE_USER}@${OLD_SERVER}:${REMOTE_PATH}/

# 3. 上传路由配置
echo "📤 上传路由配置..."
scp -i ~/.ssh/id_rsa_douyin -r src/router/ ${REMOTE_USER}@${OLD_SERVER}:${REMOTE_PATH}/src/

# 4. 上传客户管理页面
echo "📤 上传客户管理页面..."
scp -i ~/.ssh/id_rsa_douyin src/views/user/customer-management/index.vue ${REMOTE_USER}@${OLD_SERVER}:${REMOTE_PATH}/src/views/user/customer-management/

# 5. 上传权限相关文件
echo "📤 上传权限相关文件..."
scp -i ~/.ssh/id_rsa_douyin src/hooks/permission.ts ${REMOTE_USER}@${OLD_SERVER}:${REMOTE_PATH}/src/hooks/

# 6. 上传销售用户创建脚本
echo "📤 上传销售用户创建脚本..."
scp -i ~/.ssh/id_rsa_douyin scripts/database/create-sales-users-for-old-server.js ${REMOTE_USER}@${OLD_SERVER}:${REMOTE_PATH}/scripts/database/

echo "✅ 文件上传完成！"

# 7. 在服务器上执行数据库迁移和创建销售用户
echo "🔄 在服务器上执行数据库迁移..."
ssh -i ~/.ssh/id_rsa_douyin ${REMOTE_USER}@${OLD_SERVER} << 'EOF'
cd /var/www/douyin-admin-master

echo "📊 检查数据库表结构..."
node scripts/database/check-table-structure.js

echo "🔄 同步数据库表结构..."
node scripts/database/sync-customers-table.js

echo "👥 创建销售用户..."
node scripts/database/create-sales-users-for-old-server.js

echo "🔄 重启服务..."
pm2 restart douyin-admin

echo "✅ 部署完成！"
EOF

echo "🎉 老服务器部署完成！"
echo ""
echo "📋 销售用户登录信息："
echo "   用户名: 袁, 密码: yuan123"
echo "   用户名: 赵, 密码: zhao123"
echo ""
echo "🔗 访问地址: http://47.115.94.203"