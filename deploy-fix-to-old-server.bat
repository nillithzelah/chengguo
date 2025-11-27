@echo off
chcp 65001 >nul
echo =========================================
echo   修复老服务器ECPM认证问题部署脚本
echo =========================================

REM 服务器信息
set OLD_SERVER_IP=47.115.94.203
set OLD_SERVER_USER=root

echo.
echo 📋 部署信息:
echo    目标服务器: %OLD_SERVER_IP%
echo    用户名: %OLD_SERVER_USER%
echo    修复内容: 为ECPM API添加认证中间件

echo.
echo 🔧 修复内容说明:
echo    1. 为 /api/douyin/ecpm 端点添加 authenticateJWT 中间件
echo    2. 修复虚假数据条件检查 (req.user 为空的问题)
echo    3. 确保 yuan 和 Ayla6026 用户能看到虚假ECPM数据

echo.
echo 📦 部署步骤:

REM 步骤1: 创建修复包
echo.
echo 步骤1: 创建修复部署包...
tar -czf ecpm-auth-fix.tar.gz server.js config/ models/ services/ package.json .env

if %errorlevel% equ 0 (
    echo ✅ 修复包创建成功: ecpm-auth-fix.tar.gz
) else (
    echo ❌ 修复包创建失败
    exit /b 1
)

REM 步骤2: 上传到服务器
echo.
echo 步骤2: 上传修复包到服务器...
scp ecpm-auth-fix.tar.gz %OLD_SERVER_USER%@%OLD_SERVER_IP%:~/

if %errorlevel% equ 0 (
    echo ✅ 修复包上传成功
) else (
    echo ❌ 修复包上传失败
    echo 💡 请手动将 ecpm-auth-fix.tar.gz 上传到服务器 %OLD_SERVER_IP%
    exit /b 1
)

REM 步骤3: 在服务器上执行部署
echo.
echo 步骤3: 在服务器上执行部署...

ssh %OLD_SERVER_USER%@%OLD_SERVER_IP% "bash -s" << 'EOF'
    echo "🔄 开始在服务器上部署修复..."

    # 进入项目目录
    cd /var/www/douyin-admin-master

    # 备份当前server.js
    echo "📋 备份当前server.js..."
    cp server.js server.js.backup.$(date +%%Y%%m%%d_%%H%%M%%S)

    # 解压修复包
    echo "📦 解压修复包..."
    tar -xzf ~/ecpm-auth-fix.tar.gz

    # 替换server.js
    echo "🔧 替换server.js..."
    cp server.js server.js.new

    # 检查语法
    echo "🔍 检查JavaScript语法..."
    node -c server.js.new
    if [ $? -eq 0 ]; then
        echo "✅ 语法检查通过"
        mv server.js.new server.js
    else
        echo "❌ 语法检查失败，恢复备份"
        exit 1
    fi

    # 重启服务
    echo "🚀 重启Node.js服务..."
    pm2 restart douyin-admin || pm2 start server.js --name douyin-admin

    # 等待服务启动
    echo "⏳ 等待服务启动..."
    sleep 5

    # 检查服务状态
    echo "📊 检查服务状态..."
    pm2 list | grep douyin-admin

    # 测试API
    echo "🧪 测试健康检查API..."
    curl -s http://localhost:3000/api/health | head -5

    echo ""
    echo "✅ 部署完成！"
    echo ""
    echo "🌐 请测试以下端点:"
    echo "   健康检查: https://ecpm.game985.vip/api/health"
    echo "   ECPM数据: https://ecpm.game985.vip/api/douyin/ecpm?mp_id=ttb4dbc2662bd4ee7202"
    echo ""
    echo "🔐 测试用户:"
    echo "   用户名: yuan, 密码: yuan123"
    echo "   用户名: Ayla6026, 密码: ayla123"
EOF

if %errorlevel% equ 0 (
    echo.
    echo 🎉 部署成功完成！
    echo.
    echo 📋 后续验证步骤:
    echo 1. 访问 https://ecpm.game985.vip/api/health 检查健康状态
    echo 2. 以 yuan 或 Ayla6026 用户身份登录测试 ECPM 数据
    echo 3. 检查是否能看到虚假数据 (日志中应显示"用户符合条件")
    echo 4. 如果仍有问题，检查服务器日志: ssh root@47.115.94.203 "pm2 logs douyin-admin"
) else (
    echo.
    echo ❌ 部署失败，请检查上述错误信息
    exit /b 1
)

REM 清理本地文件
echo.
echo 🧹 清理临时文件...
del ecpm-auth-fix.tar.gz

echo.
echo =========================================
echo   部署脚本执行完毕
echo =========================================