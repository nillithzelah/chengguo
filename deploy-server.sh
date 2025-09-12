#!/bin/bash

# 服务器部署脚本 - 直接覆盖现有目录
echo "开始部署网站到现有目录..."

# 备份当前网站（可选）
echo "创建备份..."
sudo cp -r /var/www/douyin-admin-master /var/www/douyin-admin-master.backup.$(date +%Y%m%d_%H%M%S)

# 解压新项目到现有目录
echo "解压项目到 /var/www/douyin-admin-master..."
cd /var/www
sudo unzip -o project.zip -d douyin-admin-master/

# 进入项目目录
cd douyin-admin-master

# 安装依赖
echo "安装项目依赖..."
npm install

# 构建项目
echo "构建项目..."
npm run build

# 设置权限
echo "设置文件权限..."
sudo chown -R www-data:www-data /var/www/douyin-admin-master
sudo chmod -R 755 /var/www/douyin-admin-master

# 重启web服务器
echo "重启web服务器..."
sudo systemctl restart nginx

echo "✅ 部署完成！"
echo "网站已更新到最新版本"
echo "备份文件保存在: /var/www/douyin-admin-master.backup.$(date +%Y%m%d_%H%M%S)"