@echo off
echo 建立SSH隧道连接数据库...
echo 本地端口 5433 -> 远程服务器 47.115.94.203:5432
echo 用户名: root
echo.
echo 请在提示时输入密码: 1qaz1QAZ1qaz
echo.
ssh -L 5433:localhost:5432 root@47.115.94.203 -N
echo.
echo 隧道已断开
pause