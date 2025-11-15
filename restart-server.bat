@ECHO OFF
ECHO ========================================
ECHO    Douyin Admin 服务器重启脚本
ECHO ========================================

ECHO.
ECHO [1/3] 检查PM2状态...
pm2 list

ECHO.
ECHO [2/3] 重启所有PM2进程...
pm2 restart all

IF %ERRORLEVEL% NEQ 0 (
    ECHO ❌ PM2重启失败，请检查错误信息
    PAUSE
    EXIT /B 1
)

ECHO.
ECHO [3/3] 检查重启结果...
TIMEOUT /T 3 /NOBREAK > NUL
pm2 list

ECHO.
ECHO ========================================
ECHO    服务器重启完成！
ECHO ========================================
ECHO.
ECHO ✅ 所有PM2进程已重启
ECHO.
ECHO 📊 当前进程状态：
pm2 jlist
ECHO.
ECHO 🌐 服务器应该已经在新端口运行
ECHO.
ECHO 如果遇到问题，请检查：
ECHO 1. PM2进程是否正常启动
ECHO 2. 端口是否被占用
ECHO 3. 日志文件是否有错误信息
ECHO.
PAUSE