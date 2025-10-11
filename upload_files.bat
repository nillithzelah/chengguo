@ECHO OFF
ECHO ========================================
ECHO    Douyin Admin 文件上传脚本
ECHO ========================================

ECHO 正在上传修改的文件到服务器...

ECHO.
ECHO [1/15] 上传 server.js...
scp -i ~/.ssh/id_rsa_douyin server.js root@47.115.94.203:/var/www/douyin-admin-master/ || ECHO 失败: server.js

ECHO.
ECHO [2/15] 上传路由文件...
scp -i ~/.ssh/id_rsa_douyin src/router/index.ts root@47.115.94.203:/var/www/douyin-admin-master/src/router/ || ECHO 失败: router/index.ts
scp -i ~/.ssh/id_rsa_douyin src/router/routes/modules/ad.ts root@47.115.94.203:/var/www/douyin-admin-master/src/router/routes/modules/ || ECHO 失败: router/routes/modules/ad.ts
scp -i ~/.ssh/id_rsa_douyin src/router/routes/modules/user.ts root@47.115.94.203:/var/www/douyin-admin-master/src/router/routes/modules/ || ECHO 失败: router/routes/modules/user.ts

ECHO.
ECHO [3/15] 上传用户管理页面...
scp -i ~/.ssh/id_rsa_douyin src/views/user/management/index.vue root@47.115.94.203:/var/www/douyin-admin-master/src/views/user/management/ || ECHO 失败: user/management/index.vue

ECHO.
ECHO [4/15] 上传登录页面...
scp -i ~/.ssh/id_rsa_douyin src/views/login/index.vue root@47.115.94.203:/var/www/douyin-admin-master/src/views/login/ || ECHO 失败: login/index.vue
scp -i ~/.ssh/id_rsa_douyin src/views/login/components/login-form.vue root@47.115.94.203:/var/www/douyin-admin-master/src/views/login/components/ || ECHO 失败: login/components/login-form.vue

ECHO.
ECHO [5/15] 上传广告页面...
scp -i ~/.ssh/id_rsa_douyin src/views/ad/ecpm-user/index.vue root@47.115.94.203:/var/www/douyin-admin-master/src/views/ad/ecpm-user/ || ECHO 失败: ad/ecpm-user/index.vue
scp -i ~/.ssh/id_rsa_douyin src/views/ad/ecpm-user/components/DataTable.vue root@47.115.94.203:/var/www/douyin-admin-master/src/views/ad/ecpm-user/components/ || ECHO 失败: ad/ecpm-user/components/DataTable.vue

ECHO.
ECHO [6/15] 上传用户游戏管理页面...
scp -i ~/.ssh/id_rsa_douyin src/views/user/game-management/index.vue root@47.115.94.203:/var/www/douyin-admin-master/src/views/user/ || ECHO 失败: user/game-management/index.vue

ECHO.
ECHO [7/15] 上传新增的用户游戏管理目录...
scp -r -i ~/.ssh/id_rsa_douyin src/views/user/user-game-management root@47.115.94.203:/var/www/douyin-admin-master/src/views/user/ || ECHO 失败: user/user-game-management/

ECHO.
ECHO [8/15] 上传组件...
scp -i ~/.ssh/id_rsa_douyin src/components/breadcrumb/index.vue root@47.115.94.203:/var/www/douyin-admin-master/src/components/breadcrumb/ || ECHO 失败: components/breadcrumb/index.vue

ECHO.
ECHO [9/15] 上传脚本文件...
scp -i ~/.ssh/id_rsa_douyin backup_script.sh root@47.115.94.203:/var/www/ || ECHO 失败: backup_script.sh
scp -i ~/.ssh/id_rsa_douyin deploy_script.sh root@47.115.94.203:/var/www/ || ECHO 失败: deploy_script.sh

ECHO.
ECHO [10/15] 上传文档...
scp -i ~/.ssh/id_rsa_douyin docs/ARCO-DESIGN-ICONS.md root@47.115.94.203:/var/www/douyin-admin-master/docs/ || ECHO 失败: docs/ARCO-DESIGN-ICONS.md
scp -i ~/.ssh/id_rsa_douyin DEPLOYMENT-GUIDE.md root@47.115.94.203:/var/www/douyin-admin-master/ || ECHO 失败: DEPLOYMENT-GUIDE.md

ECHO.
ECHO ========================================
ECHO    所有文件上传完成！
ECHO ========================================
ECHO.
ECHO 接下来需要重启服务...
ECHO.
ECHO 在Git Bash中运行：
ECHO ssh douyin-server "pm2 restart douyin-admin-api && pm2 status"
ECHO.
ECHO 或者在PowerShell中运行：
ECHO ssh douyin-server "pm2 restart douyin-admin-api && pm2 status"
ECHO.
PAUSE