@echo off
echo 部署小游戏展示网站到服务器...

REM 创建目标目录
if not exist "\\server\var\www\html\games" mkdir "\\server\var\www\html\games"

REM 复制工作网站文件
echo 复制主文件...
copy "src\工作网站\index.html" "\\server\var\www\html\games\"
copy "src\工作网站\games.json" "\\server\var\www\html\games\"

echo 复制图片资源...
if not exist "\\server\var\www\html\games\images" mkdir "\\server\var\www\html\games\images"
xcopy "src\工作网站\images\*.*" "\\server\var\www\html\games\images\" /E /I /H /Y

echo 复制游戏文件...
if not exist "\\server\var\www\html\games\games" mkdir "\\server\var\www\html\games\games"
xcopy "src\工作网站\games\*.*" "\\server\var\www\html\games\games\" /E /I /H /Y

echo 重新加载nginx配置...
REM 这里需要根据你的服务器配置调整命令
REM ssh user@server "sudo systemctl reload nginx"

echo 部署完成！
echo 访问地址: http://ecpm.game985.vip/games/
pause