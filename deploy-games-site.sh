#!/bin/bash

echo "部署小游戏展示网站到服务器..."

# 服务器配置 - 请根据实际情况修改
SERVER_HOST="your-server-ip"
SERVER_USER="your-username"
REMOTE_PATH="/var/www/html/games"

# 本地源目录
LOCAL_DIR="src/工作网站"

echo "创建远程目录..."
ssh $SERVER_USER@$SERVER_HOST "sudo mkdir -p $REMOTE_PATH"
ssh $SERVER_USER@$SERVER_HOST "sudo chown -R $SERVER_USER:$SERVER_USER $REMOTE_PATH"

echo "复制主文件..."
scp $LOCAL_DIR/index.html $SERVER_USER@$SERVER_HOST:$REMOTE_PATH/
scp $LOCAL_DIR/games.json $SERVER_USER@$SERVER_HOST:$REMOTE_PATH/

echo "复制图片资源..."
scp -r $LOCAL_DIR/images $SERVER_USER@$SERVER_HOST:$REMOTE_PATH/

echo "复制游戏文件..."
scp -r $LOCAL_DIR/games $SERVER_USER@$SERVER_HOST:$REMOTE_PATH/

echo "设置正确的权限..."
ssh $SERVER_USER@$SERVER_HOST "sudo chown -R www-data:www-data $REMOTE_PATH"
ssh $SERVER_USER@$SERVER_HOST "sudo chmod -R 755 $REMOTE_PATH"

echo "重新加载nginx配置..."
ssh $SERVER_USER@$SERVER_HOST "sudo systemctl reload nginx"

echo "部署完成！"
echo "访问地址: http://ecpm.game985.vip/games/"