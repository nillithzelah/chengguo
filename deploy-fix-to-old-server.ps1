# 修复老服务器ECPM认证问题部署脚本
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  修复老服务器ECPM认证问题部署脚本" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 服务器信息
$OLD_SERVER_IP = "47.115.94.203"
$OLD_SERVER_USER = "root"

Write-Host ""
Write-Host "📋 部署信息:" -ForegroundColor Yellow
Write-Host "   目标服务器: $OLD_SERVER_IP"
Write-Host "   用户名: $OLD_SERVER_USER"
Write-Host "   修复内容: 为ECPM API添加认证中间件"

Write-Host ""
Write-Host "🔧 修复内容说明:" -ForegroundColor Green
Write-Host "   1. 为 /api/douyin/ecpm 端点添加 authenticateJWT 中间件"
Write-Host "   2. 修复虚假数据条件检查 (req.user 为空的问题)"
Write-Host "   3. 确保 yuan 和 Ayla6026 用户能看到虚假ECPM数据"

Write-Host ""
Write-Host "📦 部署步骤:" -ForegroundColor Magenta

# 步骤1: 创建修复包
Write-Host ""
Write-Host "步骤1: 创建修复部署包..." -ForegroundColor White

try {
    # 使用PowerShell压缩
    $filesToCompress = @(
        "server.js",
        "config/",
        "models/",
        "services/",
        "package.json",
        ".env"
    )

    # 检查文件是否存在
    $missingFiles = @()
    foreach ($file in $filesToCompress) {
        if (-not (Test-Path $file)) {
            $missingFiles += $file
        }
    }

    if ($missingFiles.Count -gt 0) {
        Write-Host "❌ 以下文件不存在:" -ForegroundColor Red
        $missingFiles | ForEach-Object { Write-Host "   $_" -ForegroundColor Red }
        exit 1
    }

    # 创建压缩包
    Compress-Archive -Path $filesToCompress -DestinationPath "ecpm-auth-fix.zip" -Force
    Write-Host "✅ 修复包创建成功: ecpm-auth-fix.zip" -ForegroundColor Green
} catch {
    Write-Host "❌ 修复包创建失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 步骤2: 上传到服务器
Write-Host ""
Write-Host "步骤2: 上传修复包到服务器..." -ForegroundColor White

try {
    # 使用scp上传文件 (需要安装OpenSSH)
    $scpCommand = "scp ecpm-auth-fix.zip ${OLD_SERVER_USER}@${OLD_SERVER_IP}:~/"
    Invoke-Expression $scpCommand

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ 修复包上传成功" -ForegroundColor Green
    } else {
        Write-Host "❌ 修复包上传失败" -ForegroundColor Red
        Write-Host "💡 请手动将 ecpm-auth-fix.zip 上传到服务器 $OLD_SERVER_IP" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ 修复包上传失败: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 请手动将 ecpm-auth-fix.zip 上传到服务器 $OLD_SERVER_IP" -ForegroundColor Yellow
    exit 1
}

# 步骤3: 在服务器上执行部署
Write-Host ""
Write-Host "步骤3: 在服务器上执行部署..." -ForegroundColor White

$remoteCommands = @"
echo "🔄 开始在服务器上部署修复..."

# 进入项目目录
cd /var/www/douyin-admin-master

# 备份当前server.js
echo "📋 备份当前server.js..."
cp server.js server.js.backup.`$(date +%Y%m%d_%H%M%S)

# 解压修复包
echo "📦 解压修复包..."
unzip -o ~/ecpm-auth-fix.zip

# 检查语法
echo "🔍 检查JavaScript语法..."
node -c server.js
if [ `$? -eq 0 ]; then
    echo "✅ 语法检查通过"
else
    echo "❌ 语法检查失败，恢复备份"
    cp server.js.backup.* server.js
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
"@

try {
    # 使用ssh执行远程命令
    $sshCommand = "ssh ${OLD_SERVER_USER}@${OLD_SERVER_IP} `"$remoteCommands`""
    Invoke-Expression $sshCommand

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "🎉 部署成功完成！" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 后续验证步骤:" -ForegroundColor Yellow
        Write-Host "1. 访问 https://ecpm.game985.vip/api/health 检查健康状态" -ForegroundColor White
        Write-Host "2. 以 yuan 或 Ayla6026 用户身份登录测试 ECPM 数据" -ForegroundColor White
        Write-Host "3. 检查是否能看到虚假数据 (日志中应显示`"用户符合条件`")" -ForegroundColor White
        Write-Host "4. 如果仍有问题，检查服务器日志: ssh root@47.115.94.203 `"pm2 logs douyin-admin`"" -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "❌ 部署失败，请检查上述错误信息" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "❌ 部署失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 清理本地文件
Write-Host ""
Write-Host "🧹 清理临时文件..." -ForegroundColor White
Remove-Item "ecpm-auth-fix.zip" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  部署脚本执行完毕" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan