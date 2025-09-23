# 在服务器上执行的nginx修复命令
# 复制这些命令到服务器终端执行

# 1. 备份当前配置
sudo cp /etc/nginx/sites-available/douyin-admin /etc/nginx/sites-available/douyin-admin.backup.$(date +%Y%m%d_%H%M%S)

# 2. 创建修复配置
sudo tee /etc/nginx/sites-available/douyin-admin > /dev/null << 'EOF'
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

# 3. 检查配置语法
sudo nginx -t

# 4. 重新加载nginx
sudo systemctl reload nginx

# 5. 测试修复效果
echo "测试API健康检查..."
curl -s https://ecpm.game985.vip/api/health

echo ""
echo "测试监测端点..."
curl -s "https://ecpm.game985.vip/openid/report?promotionid=test&imei=test&callback=test"

echo ""
echo "修复完成！"