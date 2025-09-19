#!/bin/bash

# 服务器连接信息
SERVER_IP="47.115.94.203"
USERNAME="root"
PASSWORD="1qaz1QAZ1qaz"

echo "连接到服务器 $SERVER_IP..."
echo "用户名: $USERNAME"
echo "密码: $PASSWORD"

# SSH连接命令（需要手动输入密码）
ssh $USERNAME@$SERVER_IP

# 或者使用expect自动输入密码（如果安装了expect）
# expect -c "
# spawn ssh $USERNAME@$SERVER_IP
# expect \"password:\"
# send \"$PASSWORD\r\"
# interact
# "