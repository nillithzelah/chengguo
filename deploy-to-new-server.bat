@echo off
echo =========================================
echo   部署到新服务器脚本
echo =========================================

REM 服务器信息
set NEW_SERVER_HOST=new-server
set SERVER_IP=112.74.163.102

echo.
echo 📋 部署信息:
echo    目标服务器: %SERVER_IP% (%NEW_SERVER_HOST%)
echo    SSH密钥认证: 已配置
echo    后端目录: /var/www/douyin-admin-master/
echo    前端目录: /var/www/html/

echo.
echo 📦 部署步骤:

REM 步骤1: 构建前端
echo.
echo 步骤1: 构建前端应用...
if exist "dist" (
    rmdir /s /q dist
    echo 清理旧构建文件完成
)

call npm run build

if %errorlevel% neq 0 (
    echo ❌ 前端构建失败
    pause
    exit /b 1
)

echo ✅ 前端构建成功

REM 步骤2: 创建后端部署包
echo.
echo 步骤2: 创建后端部署包...

REM 检查必要文件
if not exist "server.js" (
    echo ❌ server.js 文件不存在
    exit /b 1
)

if not exist "package.json" (
    echo ❌ package.json 文件不存在
    exit /b 1
)

REM 创建后端部署包
powershell "Compress-Archive -Path 'server.js','config','models','services','scripts','package.json','.env','ecosystem.config.js' -DestinationPath 'backend-deploy.zip' -Force"

if %errorlevel% equ 0 (
    echo ✅ 后端部署包创建成功: backend-deploy.zip
) else (
    echo ❌ 后端部署包创建失败
    exit /b 1
)

REM 步骤3: 上传文件到服务器
echo.
echo 步骤3: 上传文件到服务器...

echo 上传后端文件...
scp backend-deploy.zip %NEW_SERVER_HOST%:~/

if %errorlevel% neq 0 (
    echo ❌ 后端文件上传失败
    exit /b 1
)

echo 上传前端文件...
scp -r dist/* %NEW_SERVER_HOST%:/var/www/html/

if %errorlevel% neq 0 (
    echo ❌ 前端文件上传失败
    exit /b 1
)

echo ✅ 文件上传成功

REM 步骤4: 在服务器上部署
echo.
echo 步骤4: 在服务器上执行部署...

ssh %NEW_SERVER_HOST% bash -c "
echo '🔄 开始在服务器上部署...'

# 进入后端项目目录
cd /var/www/douyin-admin-master

# 备份当前文件
echo '📋 备份当前文件...'
cp server.js server.js.backup.\$(date +%%Y%%m%%d_%%H%%M%%S) 2>/dev/null || true

# 解压后端部署包
echo '📦 解压后端部署包...'
unzip -o ~/backend-deploy.zip

# 检查语法
echo '🔍 检查JavaScript语法...'
node -c server.js
if [ \$? -eq 0 ]; then
    echo '✅ 语法检查通过'
else
    echo '❌ 语法检查失败，恢复备份'
    ls -la server.js.backup.* | head -1 | xargs -I {} cp {} server.js 2>/dev/null || true
    exit 1
fi

# 重启后端服务
echo '🚀 重启后端服务...'
pm2 restart douyin-admin-api || pm2 start ecosystem.config.js || pm2 start server.js --name douyin-admin-api

# 等待服务启动
echo '⏳ 等待服务启动...'
sleep 5

# 检查服务状态
echo '📊 检查服务状态...'
pm2 list | grep douyin-admin-api

# 重启Nginx
echo '🔄 重启Nginx...'
sudo systemctl reload nginx

# 测试API
echo '🧪 测试健康检查API...'
curl -s -k https://www.wubug.cc/api/health | head -5

echo ''
echo '✅ 部署完成！'
echo ''
echo '🌐 访问地址:'
echo '   HTTPS: https://www.wubug.cc'
echo '   HTTP: http://112.74.163.102 (会自动重定向到HTTPS)'
echo ''
echo '🔍 测试端点:'
echo '   健康检查: https://www.wubug.cc/api/health'
echo '   用户登录: https://www.wubug.cc'
"

if %errorlevel% equ 0 (
    echo.
    echo 🎉 部署成功完成！
    echo.
    echo 📋 验证步骤:
    echo 1. 访问 https://www.wubug.cc 检查网站是否正常
    echo 2. 测试登录功能
    echo 3. 检查主体管理功能中的程序员和管家字段是否为可选
    echo 4. 如果有问题，检查服务器日志: ssh %NEW_SERVER_HOST% "pm2 logs douyin-admin-api"
) else (
    echo.
    echo ❌ 部署失败，请检查上述错误信息
    exit /b 1
)

REM 清理本地文件
echo.
echo 🧹 清理临时文件...
del backend-deploy.zip

echo.
echo =========================================
echo   部署脚本执行完毕
echo =========================================

pause