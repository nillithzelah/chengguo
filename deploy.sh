#!/bin/bash

# 阿里云部署脚本
# 使用方法: ./deploy.sh

echo "🚀 开始部署抖音广告管理系统到阿里云..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置变量
DOMAIN="ecpm.game985.vip"  # 替换为你的域名
SERVER_IP="http://47.115.94.203/"  # 替换为你的服务器IP
SERVER_USER="root"  # 服务器用户名
PROJECT_PATH="/var/www/douyin-admin-master"

echo -e "${YELLOW}请确保已完成以下准备工作:${NC}"
echo "1. 购买阿里云ECS服务器"
echo "2. 购买并配置域名DNS解析"
echo "3. 服务器已安装Node.js、Nginx、PM2"
echo ""

read -p "是否继续部署? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "部署已取消"
    exit 1
fi

# 1. 构建项目
echo -e "${YELLOW}📦 构建前端项目...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 构建失败!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 构建完成${NC}"

# 2. 上传文件到服务器
echo -e "${YELLOW}📤 上传文件到服务器...${NC}"

# 创建目录
ssh $SERVER_USER@$SERVER_IP "mkdir -p $PROJECT_PATH"

# 上传dist目录
scp -r dist $SERVER_USER@$SERVER_IP:$PROJECT_PATH/

# 上传服务器文件
scp server.js $SERVER_USER@$SERVER_IP:$PROJECT_PATH/
scp ecosystem.config.js $SERVER_USER@$SERVER_IP:$PROJECT_PATH/
scp package.json $SERVER_USER@$SERVER_IP:$PROJECT_PATH/
scp .env.production $SERVER_USER@$SERVER_IP:$PROJECT_PATH/.env

# 上传nginx配置
scp config/nginx.conf $SERVER_USER@$SERVER_IP:/tmp/douyin-admin.conf

echo -e "${GREEN}✅ 文件上传完成${NC}"

# 3. 服务器端配置
echo -e "${YELLOW}⚙️ 配置服务器...${NC}"

ssh -t $SERVER_USER@$SERVER_IP << 'EOF'
    # 进入项目目录
    cd $PROJECT_PATH
    
    # 安装依赖
    npm install --production
    
    # 创建日志目录
    mkdir -p logs
    
    # 配置nginx
    sudo mv /tmp/douyin-admin.conf /etc/nginx/sites-available/douyin-admin
    sudo ln -sf /etc/nginx/sites-available/douyin-admin /etc/nginx/sites-enabled/
    
    # 测试nginx配置
    sudo nginx -t
    
    # 重启nginx
    sudo systemctl restart nginx
    
    # 启动应用
    pm2 delete douyin-admin-api 2>/dev/null || true
    pm2 start ecosystem.config.js
    pm2 save
    
    echo "✅ 服务器配置完成"
EOF

# 4. SSL证书申请
echo -e "${YELLOW}🔒 申请SSL证书...${NC}"

ssh -t $SERVER_USER@$SERVER_IP << 'EOF'
    # 申请SSL证书
    sudo certbot --nginx --force-renewal -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email nillithzelah@gmail.com
    
    # 设置自动续期
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
    
    echo "✅ SSL证书配置完成"
EOF

# 5. 验证部署
echo -e "${YELLOW}🔍 验证部署状态...${NC}"

echo "检查服务状态..."
ssh $SERVER_USER@$SERVER_IP "pm2 status"

echo ""
echo -e "${GREEN}🎉 部署完成!${NC}"
echo ""
echo "访问地址:"
echo "  前端: https://$DOMAIN"
echo "  Webhook: https://$DOMAIN/api/douyin/webhook"
echo "  健康检查: https://$DOMAIN/api/health"
echo ""
echo "下一步:"
echo "1. 在抖音开放平台更新webhook地址为: https://$DOMAIN/api/douyin/webhook"
echo "2. 测试webhook验证是否正常"
echo "3. 监控服务运行状态"
echo ""
echo -e "${YELLOW}监控命令:${NC}"
echo "  服务日志: ssh $SERVER_USER@$SERVER_IP 'pm2 logs'"
echo "  重启服务: ssh $SERVER_USER@$SERVER_IP 'pm2 restart douyin-admin-api'"