@ECHO OFF
ECHO ========================================
ECHO    Douyin Admin 前端部署脚本
ECHO ========================================

ECHO.
ECHO [1/4] 清理旧的构建文件...
IF EXIST dist (
    rmdir /s /q dist
    ECHO 清理完成
) ELSE (
    ECHO 无需清理
)

ECHO.
ECHO [2/4] 执行前端构建...
CALL npm run build

IF %ERRORLEVEL% NEQ 0 (
    ECHO ❌ 构建失败，请检查错误信息
    PAUSE
    EXIT /B 1
)

ECHO.
ECHO [3/4] 检查构建结果...
IF NOT EXIST dist (
    ECHO ❌ 构建目录不存在，构建可能失败
    PAUSE
    EXIT /B 1
)

ECHO.
ECHO [4/4] 上传前端文件到服务器...
ECHO 正在上传 dist 目录到 /var/www/html...

REM 使用SCP上传整个dist目录
scp -i ~/.ssh/id_rsa_douyin -r dist/* root@47.115.94.203:/var/www/html/

IF %ERRORLEVEL% NEQ 0 (
    ECHO ❌ 上传失败，请检查网络连接和SSH配置
    PAUSE
    EXIT /B 1
)

ECHO.
ECHO ========================================
ECHO    前端部署完成！
ECHO ========================================
ECHO.
ECHO ✅ 构建成功
ECHO ✅ 文件上传成功
ECHO.
ECHO 🌐 访问地址: http://你的域名或IP
ECHO.
ECHO 如果需要重启Web服务器，请在服务器上执行：
ECHO sudo systemctl restart nginx  # 或 apache2
ECHO.
PAUSE