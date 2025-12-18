#!/bin/bash

# 部署test-connection API修复脚本
# 用法: ./deploy-test-connection-fix.sh

echo "========================================="
echo "  修复test-connection API 500错误部署脚本"
echo "========================================="

# 服务器信息
SERVER_IP="47.115.94.203"
SERVER_USER="root"

echo ""
echo "📋 部署信息:"
echo "   目标服务器: $SERVER_IP"
echo "   用户名: $SERVER_USER"
echo "   修复内容: 修复 /api/douyin/test-connection API错误响应格式"

echo ""
echo "🔧 修复内容说明:"
echo "   1. 修改test-connection API错误处理逻辑"
echo "   2. 从返回500错误改为返回200状态码+错误代码"
echo "   3. 确保前端能正确处理API响应"

echo ""
echo "📦 部署步骤:"

# 步骤1: 创建修复包
echo ""
echo "步骤1: 创建修复部署包..."
tar -czf test-connection-fix.tar.gz \
    server.js \
    package.json

if [ $? -eq 0 ]; then
    echo "✅ 修复包创建成功: test-connection-fix.tar.gz"
else
    echo "❌ 修复包创建失败"
    exit 1
fi

# 步骤2: 上传到服务器
echo ""
echo "步骤2: 上传修复包到服务器..."
scp test-connection-fix.tar.gz $SERVER_USER@$SERVER_IP:~/

if [ $? -eq 0 ]; then
    echo "✅ 修复包上传成功"
else
    echo "❌ 修复包上传失败"
    echo "💡 请手动将 test-connection-fix.tar.gz 上传到服务器 $SERVER_IP"
    exit 1
fi

# 步骤3: 在服务器上执行部署
echo ""
echo "步骤3: 在服务器上执行部署..."

ssh $SERVER_USER@$SERVER_IP << 'EOF'
    echo "🔄 开始在服务器上部署修复..."

    # 进入项目目录
    cd /var/www/douyin-admin-master

    # 备份当前server.js
    echo "📋 备份当前server.js..."
    cp server.js server.js.backup.$(date +%Y%m%d_%H%M%S)

    # 解压修复包
    echo "📦 解压修复包..."
    tar -xzf ~/test-connection-fix.tar.gz

    # 检查语法
    echo "🔍 检查JavaScript语法..."
    node -c server.js
    if [ $? -eq 0 ]; then
        echo "✅ 语法检查通过"
    else
        echo "❌ 语法检查失败，恢复备份"
        cp server.js.backup.* server.js
        exit 1
    fi

    # 重启服务
    echo "🚀 重启Node.js服务..."
    pm2 restart douyin-admin || pm2 start server.js --name douyin-admin

    # 等待服务启动
    echo "⏳ 等待服务启动..."
    sleep 5

    # 检查服务状态
    echo "📊 检查服务状态..."
    pm2 list | grep douyin-admin

    # 测试API
    echo "🧪 测试修复后的API..."
    curl -s -X POST http://localhost:3000/api/douyin/test-connection \
         -H "Content-Type: application/json" \
         -d '{"appid":"test","secret":"test"}' | head -3

    echo ""
    echo "✅ 部署完成！"
    echo ""
    echo "🌐 请测试以下端点:"
    echo "   健康检查: https://ecpm.game985.vip/api/health"
    echo "   测试连接: https://ecpm.game985.vip/api/douyin/test-connection"
    echo ""
    echo "🔧 测试方法:"
    echo "   curl -X POST https://ecpm.game985.vip/api/douyin/test-connection \\"
    echo "        -H 'Content-Type: application/json' \\"
    echo "        -d '{\"appid\":\"test\",\"secret\":\"test\"}'"
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 部署成功完成！"
    echo ""
    echo "📋 后续验证步骤:"
    echo "1. 访问 https://ecpm.game985.vip/api/health 检查健康状态"
    echo "2. 测试test-connection API是否返回200状态码而不是500"
    echo "3. 在前端游戏管理页面测试连接功能"
    echo "4. 如果仍有问题，检查服务器日志: pm2 logs douyin-admin"
else
    echo ""
    echo "❌ 部署失败，请检查上述错误信息"
    exit 1
fi

# 清理本地文件
echo ""
echo "🧹 清理临时文件..."
rm -f test-connection-fix.tar.gz

echo ""
echo "========================================="
echo "  部署脚本执行完毕"
echo "========================================="