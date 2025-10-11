#!/bin/bash

# 备份脚本：将 /var/www/douyin-admin-master 压缩为带时间戳的备份文件
# 生成的文件名格式：douyin-admin-master.backup.YYYYMMDD_HHMMSS.tar.gz

# 设置变量
SOURCE_DIR="/var/www/douyin-admin-master"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="douyin-admin-master.backup.${TIMESTAMP}"
BACKUP_FILE="${BACKUP_NAME}.tar.gz"

# 检查源目录是否存在
if [ ! -d "$SOURCE_DIR" ]; then
    echo "错误：源目录 $SOURCE_DIR 不存在！"
    exit 1
fi

echo "开始备份..."
echo "源目录：$SOURCE_DIR"
echo "备份文件名：$BACKUP_FILE"

# 创建压缩文件
tar -czf "$BACKUP_FILE" -C /var/www douyin-admin-master

# 检查压缩是否成功
if [ $? -eq 0 ]; then
    echo "备份成功完成！"
    echo "备份文件：$(pwd)/$BACKUP_FILE"
    echo "文件大小：$(du -h "$BACKUP_FILE" | cut -f1)"
else
    echo "备份失败！"
    exit 1
fi

echo "备份脚本执行完毕。"