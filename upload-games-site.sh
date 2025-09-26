#!/bin/bash

echo "上传小游戏展示网站文件到服务器..."

# 服务器配置 - 请修改为你的实际服务器信息
SERVER_HOST="your-server-ip"
SERVER_USER="your-username"
REMOTE_PATH="/var/www/douyin-admin-master/games"

echo "创建远程目录..."
ssh $SERVER_USER@$SERVER_HOST "sudo mkdir -p $REMOTE_PATH"

echo "上传主文件..."
scp src/工作网站/index.html $SERVER_USER@$SERVER_HOST:$REMOTE_PATH/
scp src/工作网站/games.json $SERVER_USER@$SERVER_HOST:$REMOTE_PATH/

echo "上传图片资源..."
scp -r src/工作网站/images $SERVER_USER@$SERVER_HOST:$REMOTE_PATH/

echo "上传游戏文件..."
scp -r src/工作网站/games $SERVER_USER@$SERVER_HOST:$REMOTE_PATH/

echo "设置权限..."
ssh $SERVER_USER@$SERVER_HOST "sudo chown -R www-data:www-data $REMOTE_PATH"
ssh $SERVER_USER@$SERVER_HOST "sudo chmod -R 755 $REMOTE_PATH"

echo "上传nginx配置文件..."
scp config/nginx.conf $SERVER_USER@$SERVER_HOST:/etc/nginx/sites-available/douyin-admin

echo "测试nginx配置..."
ssh $SERVER_USER@$SERVER_HOST "sudo nginx -t"

if [ $? -eq 0 ]; then
    echo "nginx配置测试通过，重载nginx..."
    ssh $SERVER_USER@$SERVER_HOST "sudo systemctl reload nginx"
    echo "✅ 部署完成！"
    echo "访问地址: http://m.game985.vip/"
else
    echo "❌ nginx配置有误，请检查配置"
fi