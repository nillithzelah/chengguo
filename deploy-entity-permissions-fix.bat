@echo off
chcp 65001 >nul
echo =========================================
echo   部署实体权限修复到老服务器
echo =========================================

REM 服务器信息
set OLD_SERVER_IP=47.115.94.203
set OLD_SERVER_USER=root

echo.
echo 📋 部署信息:
echo    目标服务器: %OLD_SERVER_IP%
echo    用户名: %OLD_SERVER_USER%
echo    修复内容: 为外部老板添加实体列表访问权限

echo.
echo 🔧 修复内容说明:
echo    1. 在 /api/entity/list API中添加 external_boss 到允许角色列表
echo    2. 外部老板现在可以访问实体列表API

echo.
echo 📦 部署步骤:

REM 步骤1: 创建修复包
echo.
echo 步骤1: 创建修复部署包...
tar -czf entity-permissions-fix-new.tar.gz server.js

if %errorlevel% equ 0 (
    echo ✅ 修复包创建成功: entity-permissions-fix-new.tar.gz
) else (
    echo ❌ 修复包创建失败
    exit /b 1
)

REM 步骤2: 上传到服务器
echo.
echo 步骤2: 上传修复包到服务器...
scp entity-permissions-fix-new.tar.gz %OLD_SERVER_USER%@%OLD_SERVER_IP%:~/

if %errorlevel% equ 0 (
    echo ✅ 修复包上传成功
) else (
    echo ❌ 修复包上传失败
    echo 💡 请手动将 entity-permissions-fix-new.tar.gz 上传到服务器 %OLD_SERVER_IP%
    exit /b 1
)

REM 步骤3: 在服务器上执行部署
echo.
echo 步骤3: 在服务器上执行部署...

ssh %OLD_SERVER_USER%@%OLD_SERVER_IP% "bash -s" << 'EOF'
    echo "🔄 开始在服务器上部署实体权限修复..."

    # 进入项目目录
    cd /var/www/douyin-admin-master

    # 备份当前server.js
    echo "📋 备份当前server.js..."
    cp server.js server.js.backup.$(date +%%Y%%m%%d_%%H%%M%%S)

    # 解压修复包
    echo "📦 解压修复包..."
    tar -xzf ~/entity-permissions-fix-new.tar.gz

    # 检查语法
    echo "🔍 检查JavaScript语法..."
    node -c server.js
    if [ $? -eq 0 ]; then
        echo "✅ 语法检查通过"
    else
        echo "❌ 语法检查失败，恢复备份"
        cp server.js.backup.* server.js 2>/dev/null || true
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
    echo "✅ 实体权限修复部署完成！"
    echo ""
    echo "🌐 请测试以下端点:"
    echo "   健康检查: https://ecpm.game985.vip/api/health"
    echo "   实体列表: https://ecpm.game985.vip/api/entity/list"
    echo ""
    echo "🔐 测试用户:"
    echo "   用户名: 111 (外部老板)"
EOF

if %errorlevel% equ 0 (
    echo.
    echo 🎉 部署成功完成！
    echo.
    echo 📋 后续验证步骤:
    echo 1. 访问 https://ecpm.game985.vip/api/health 检查健康状态
    echo 2. 以用户111身份登录测试实体列表API
    echo 3. 如果仍有问题，检查服务器日志: ssh root@47.115.94.203 "pm2 logs douyin-admin"
) else (
    echo.
    echo ❌ 部署失败，请检查上述错误信息
    exit /b 1
)

REM 清理本地文件
echo.
echo 🧹 清理临时文件...
del entity-permissions-fix-new.tar.gz

echo.
echo =========================================
echo   部署脚本执行完毕
echo =========================================