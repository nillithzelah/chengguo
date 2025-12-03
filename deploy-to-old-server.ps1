# 部署到老服务器的脚本 (PowerShell版本)
# 老服务器IP: 47.115.94.203

Write-Host "🚀 开始部署到老服务器 (47.115.94.203)..." -ForegroundColor Green

# 服务器信息
$OLD_SERVER = "47.115.94.203"
$REMOTE_USER = "root"
$REMOTE_PATH = "/var/www/douyin-admin-master"
$SSH_KEY = "~/.ssh/id_rsa_douyin"

Write-Host "📡 连接到老服务器..." -ForegroundColor Yellow

# 1. 上传更新的模型文件
Write-Host "📤 上传模型文件..." -ForegroundColor Cyan
scp -i $SSH_KEY models/*.js ${REMOTE_USER}@${OLD_SERVER}:${REMOTE_PATH}/models/

# 2. 上传更新的服务器文件
Write-Host "📤 上传服务器文件..." -ForegroundColor Cyan
scp -i $SSH_KEY server.js ${REMOTE_USER}@${OLD_SERVER}:${REMOTE_PATH}/

# 3. 上传路由配置
Write-Host "📤 上传路由配置..." -ForegroundColor Cyan
scp -i $SSH_KEY -r src/router/ ${REMOTE_USER}@${OLD_SERVER}:${REMOTE_PATH}/src/

# 4. 上传客户管理页面
Write-Host "📤 上传客户管理页面..." -ForegroundColor Cyan
scp -i $SSH_KEY src/views/user/customer-management/index.vue ${REMOTE_USER}@${OLD_SERVER}:${REMOTE_PATH}/src/views/user/customer-management/

# 5. 上传权限相关文件
Write-Host "📤 上传权限相关文件..." -ForegroundColor Cyan
scp -i $SSH_KEY src/hooks/permission.ts ${REMOTE_USER}@${OLD_SERVER}:${REMOTE_PATH}/src/hooks/

# 6. 上传销售用户创建脚本
Write-Host "📤 上传销售用户创建脚本..." -ForegroundColor Cyan
scp -i $SSH_KEY scripts/database/create-sales-users-for-old-server.js ${REMOTE_USER}@${OLD_SERVER}:${REMOTE_PATH}/scripts/database/

Write-Host "✅ 文件上传完成！" -ForegroundColor Green

# 7. 在服务器上执行数据库迁移和创建销售用户
Write-Host "🔄 在服务器上执行数据库迁移..." -ForegroundColor Yellow

$remoteCommands = @"
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
"@

ssh -i $SSH_KEY ${REMOTE_USER}@${OLD_SERVER} $remoteCommands

Write-Host "🎉 老服务器部署完成！" -ForegroundColor Green
Write-Host ""
Write-Host "📋 销售用户登录信息：" -ForegroundColor White
Write-Host "   用户名: 袁, 密码: yuan123" -ForegroundColor White
Write-Host "   用户名: 赵, 密码: zhao123" -ForegroundColor White
Write-Host ""
Write-Host "🔗 访问地址: http://47.115.94.203" -ForegroundColor White

Read-Host "按任意键退出"