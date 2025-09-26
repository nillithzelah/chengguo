@echo off
REM Windows批处理脚本：部署Token数据库功能到服务器

echo 🚀 开始部署Token数据库功能到服务器...
echo 服务器: 47.115.94.203
echo 用户名: root
echo.

REM 需要上传的文件列表
set FILES_TO_UPLOAD=server.js models\Token.js scripts\init-tokens.js config\database.js .gitignore

echo 📁 需要上传的文件:
for %%f in (%FILES_TO_UPLOAD%) do (
    if exist "%%f" (
        echo   ✅ %%f
    ) else (
        echo   ❌ %%f (文件不存在)
    )
)
echo.

echo 🔄 开始上传文件...
echo 请手动执行以下命令上传文件:
echo.
echo scp %FILES_TO_UPLOAD% root@47.115.94.203:/root/chengguo/
echo.
echo 密码: 1qaz1QAZ1qaz
echo.

echo 🔄 上传完成后，在服务器上执行以下命令重启应用:
echo.
echo cd /root/chengguo
echo pkill -f "node server.js"
echo npm install
echo nohup node server.js > server.log 2>&1 &
echo sleep 3
echo ps aux ^| grep "node server.js"
echo curl -s http://localhost:3000/api/health
echo.

echo 🎉 部署准备完成！
echo 请按照上述步骤手动执行部署。

pause