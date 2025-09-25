#!/bin/bash

# 游戏网站部署脚本 - 针对Linux服务器
# 使用方法: ./server-deploy.sh

echo "🎮 游戏网站部署脚本"
echo "===================="

# 服务器配置
SERVER_PATH="/var/www/douyin-admin-master"
GAMES_DIR="$SERVER_PATH/games"

echo "📍 目标服务器路径: $SERVER_PATH"
echo "📁 游戏网站目录: $GAMES_DIR"
echo ""

# 检查是否为root用户
if [[ $EUID -eq 0 ]]; then
   echo "❌ 请不要使用root用户运行此脚本"
   exit 1
fi

# 创建游戏目录和图片目录
echo "📁 创建游戏网站目录..."
mkdir -p "$GAMES_DIR"
mkdir -p "$GAMES_DIR/images"

if [ $? -eq 0 ]; then
    echo "✅ 目录创建成功: $GAMES_DIR"
    echo "✅ 图片目录创建成功: $GAMES_DIR/images"
else
    echo "❌ 目录创建失败，请检查权限"
    exit 1
fi

# 设置权限
echo "🔐 设置目录权限..."
chmod 755 "$GAMES_DIR"

echo ""
echo "📋 部署步骤："
echo "=============="
echo ""
echo "1. 📤 上传游戏网站文件到服务器："
echo "   将以下文件上传到: $GAMES_DIR/"
echo "   ├── index.html"
echo "   ├── games.json"
echo "   ├── images/"
echo "   │   ├── top-image.jpg (顶部横幅图片)"
echo "   │   ├── game1-preview.jpg (游戏1预览图)"
echo "   │   ├── game2-preview.jpg (游戏2预览图)"
echo "   │   └── game3-preview.jpg (游戏3预览图)"
echo "   └── games/ (包含所有游戏文件夹)"
echo ""
echo "2. 🖼️ 上传图片文件："
echo "   顶部横幅: $GAMES_DIR/images/top-image.jpg (正方形 400x400px)"
echo "   游戏预览: $GAMES_DIR/images/gameX-preview.jpg (300x200px)"
echo ""
echo "3. 🌐 访问方式："
echo "   游戏网站: https://your-domain.com/games/"
echo "   原网站: https://your-domain.com/"
echo ""
echo "4. 🔧 如果需要调整路径："
echo "   编辑 $GAMES_DIR/games.json 中的图片路径"
echo ""
echo "5. ✅ 测试访问："
echo "   打开浏览器访问: https://your-domain.com/games/"
echo ""
echo "🎉 部署准备完成！"
echo ""
echo "💡 提示："
echo "   - 确保服务器有正确的文件权限"
echo "   - 如果使用HTTPS，确保SSL证书配置正确"
echo "   - 部署后可能需要清理浏览器缓存"