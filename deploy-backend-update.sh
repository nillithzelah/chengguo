#!/bin/bash

# 部署脚本：上传Token数据库功能到服务器
# 服务器信息
SERVER_IP="47.115.94.203"
USERNAME="root"
PASSWORD="1qaz1QAZ1qaz"
REMOTE_PATH="/var/www/douyin-admin-master"

echo "🚀 开始部署Token数据库功能到服务器..."
echo "服务器: $SERVER_IP"
echo "远程路径: $REMOTE_PATH"
echo ""

# 需要上传的文件列表
FILES_TO_UPLOAD=(
    "server.js"
    "models/Token.js"
    "scripts/init-tokens.js"
    "config/database.js"
    ".gitignore"
)

echo "📁 需要上传的文件:"
for file in "${FILES_TO_UPLOAD[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file (文件不存在)"
    fi
done
echo ""

# 检查expect是否安装
if ! command -v expect &> /dev/null; then
    echo "❌ 需要安装expect工具"
    echo "请运行: apt-get update && apt-get install -y expect"
    exit 1
fi

echo "🔄 开始上传文件..."

# 使用expect自动处理SCP上传
expect << EOF
spawn scp -r "${FILES_TO_UPLOAD[@]}" $USERNAME@$SERVER_IP:$REMOTE_PATH/
expect {
    "password:" {
        send "$PASSWORD\r"
        exp_continue
    }
    "yes/no" {
        send "yes\r"
        exp_continue
    }
    eof
}
EOF

if [ $? -eq 0 ]; then
    echo "✅ 文件上传成功！"
    echo ""
    echo "🔄 在服务器上重启应用..."
    echo ""

    # 在服务器上重启应用
    expect << EOF
spawn ssh $USERNAME@$SERVER_IP
expect {
    "password:" {
        send "$PASSWORD\r"
        exp_continue
    }
    "yes/no" {
        send "yes\r"
        exp_continue
    }
    "*#" {
        send "cd /var/www/douyin-admin-master\r"
        send "pkill -f 'node server.js'\r"
        send "sleep 2\r"
        send "npm install\r"
        send "node server.js > server.log 2>&1 &\r"
        send "sleep 3\r"
        send "ps aux | grep 'node server.js'\r"
        send "curl -s http://localhost:3000/api/health\r"
        send "exit\r"
    }
}
EOF

    echo ""
    echo "🎉 部署完成！"
    echo "请检查服务器上的应用是否正常运行"
else
    echo "❌ 文件上传失败"
    exit 1
fi