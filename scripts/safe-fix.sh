#!/bin/bash

# 安全修复脚本 - 逐步应用nginx配置修复
echo "🛡️ 安全修复nginx配置"
echo "===================="

# 步骤1: 检查当前状态
echo "📋 步骤1: 检查当前状态..."
sudo systemctl status nginx --no-pager | head -3

# 步骤2: 备份当前配置
echo ""
echo "💾 步骤2: 备份当前配置..."
backup_file="/etc/nginx/sites-available/douyin-admin.backup.$(date +%Y%m%d_%H%M%S)"
sudo cp /etc/nginx/sites-available/douyin-admin "$backup_file"
echo "✅ 备份已保存到: $backup_file"

# 步骤3: 读取当前配置并修改
echo ""
echo "🔧 步骤3: 修改配置..."

# 创建临时修复配置
cat > /tmp/nginx_temp.conf << 'EOF'
server {
    listen 80;
    server_name ecpm.game985.vip www.ecpm.game985.vip;

    root /var/www/html;
    index index.html index.htm;

    # 巨量广告监测链接 - 精确匹配，放在最前面
    location = /openid/report {
        proxy_pass http://localhost:3000/openid/report;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        access_log /var/log/nginx/ad-monitor.access.log;
    }

    # API代理
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 前端路由
    location / {
        try_files $uri $uri/ /index.html;
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    access_log /var/log/nginx/douyin-admin.access.log;
    error_log /var/log/nginx/douyin-admin.error.log;
}
EOF

# 应用配置
sudo cp /tmp/nginx_temp.conf /etc/nginx/sites-available/douyin-admin

# 步骤4: 检查配置语法
echo ""
echo "🔍 步骤4: 检查配置语法..."
if sudo nginx -t; then
    echo "✅ 配置语法正确"
else
    echo "❌ 配置语法错误，正在恢复备份..."
    sudo cp "$backup_file" /etc/nginx/sites-available/douyin-admin
    exit 1
fi

# 步骤5: 重新加载nginx
echo ""
echo "🔄 步骤5: 重新加载nginx..."
if sudo systemctl reload nginx; then
    echo "✅ nginx重新加载成功"
else
    echo "❌ nginx重新加载失败，正在恢复备份..."
    sudo cp "$backup_file" /etc/nginx/sites-available/douyin-admin
    sudo systemctl reload nginx
    exit 1
fi

# 步骤6: 测试修复效果
echo ""
echo "🧪 步骤6: 测试修复效果..."
sleep 3

echo "测试API健康检查..."
if curl -s --max-time 5 https://ecpm.game985.vip/api/health > /dev/null; then
    echo "✅ API代理正常"
else
    echo "❌ API代理异常"
fi

echo "测试监测端点..."
response=$(timeout 10 curl -s -w "%{http_code}" "https://ecpm.game985.vip/openid/report?promotionid=test&imei=test&callback=test" 2>/dev/null | tail -c 3)
if [ "$response" = "200" ]; then
    echo "✅ 监测端点正常 (HTTP 200)"
else
    echo "❌ 监测端点异常 (HTTP $response)"
fi

echo ""
echo "🎉 修复完成！"
echo "📝 如果仍有问题，请运行: sudo nginx -T | grep openid"
echo "🔄 如需恢复，请运行: sudo cp $backup_file /etc/nginx/sites-available/douyin-admin && sudo systemctl reload nginx"