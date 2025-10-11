#!/bin/bash

echo "========================================"
echo "   Douyin Admin 前端部署脚本"
echo "========================================"

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    exit 1
fi

echo ""
echo "[1/4] 清理旧的构建文件..."
if [ -d "dist" ]; then
    rm -rf dist
    echo "✅ 清理完成"
else
    echo "ℹ️ 无需清理"
fi

echo ""
echo "[2/4] 执行前端构建..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 构建失败，请检查错误信息"
    exit 1
fi

echo ""
echo "[3/4] 检查构建结果..."
if [ ! -d "dist" ]; then
    echo "❌ 构建目录不存在，构建可能失败"
    exit 1
fi

echo ""
echo "[4/4] 上传前端文件到服务器..."
echo "正在上传 dist 目录到 /var/www/html..."

# 使用SCP上传整个dist目录
scp -i ~/.ssh/id_rsa_douyin -r dist/* root@47.115.94.203:/var/www/html/

if [ $? -ne 0 ]; then
    echo "❌ 上传失败，请检查网络连接和SSH配置"
    exit 1
fi

echo ""
echo "========================================"
echo "   前端部署完成！"
echo "========================================"
echo ""
echo "✅ 构建成功"
echo "✅ 文件上传成功"
echo ""
echo "🌐 访问地址: http://你的域名或IP"
echo ""
echo "如果需要重启Web服务器，请在服务器上执行："
echo "sudo systemctl restart nginx  # 或 apache2"
echo ""
echo "📋 部署摘要："
echo "- 构建时间: $(date)"
echo "- 上传文件数: $(find dist -type f | wc -l)"
echo "- 目标目录: /var/www/html/"