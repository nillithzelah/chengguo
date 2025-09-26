#!/bin/bash

# 后端代码更新部署脚本
# 用于部署Token管理系统更新

set -e  # 遇到错误立即退出

echo "🚀 开始部署后端代码更新..."

# 配置变量 - 请根据实际情况修改
SERVER_USER="root"  # 服务器用户名
SERVER_HOST="your-server-ip"  # 服务器IP地址
SERVER_PATH="/root/chengguo"  # 服务器上的项目路径
BACKUP_DIR="/root/backups"  # 备份目录

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查依赖
check_dependencies() {
    log_info "检查本地依赖..."
    if ! command -v rsync &> /dev/null; then
        log_error "rsync 未安装，请先安装 rsync"
        exit 1
    fi

    if ! command -v ssh &> /dev/null; then
        log_error "ssh 未安装，请先安装 openssh-client"
        exit 1
    fi

    log_info "依赖检查完成"
}

# 备份服务器数据
backup_server() {
    log_info "备份服务器数据..."

    ssh ${SERVER_USER}@${SERVER_HOST} "
        mkdir -p ${BACKUP_DIR}
        if [ -f ${SERVER_PATH}/database.sqlite ]; then
            cp ${SERVER_PATH}/database.sqlite ${BACKUP_DIR}/database.sqlite.backup.\$(date +%Y%m%d_%H%M%S)
            echo '数据库备份完成'
        else
            echo '数据库文件不存在，跳过备份'
        fi

        if [ -f ${SERVER_PATH}/token-refresh-history.log ]; then
            cp ${SERVER_PATH}/token-refresh-history.log ${BACKUP_DIR}/token-refresh-history.log.backup.\$(date +%Y%m%d_%H%M%S)
            echo 'Token历史记录备份完成'
        fi
    "

    log_info "服务器数据备份完成"
}

# 同步代码到服务器
sync_code() {
    log_info "同步代码到服务器..."

    # 排除不需要同步的文件
    rsync -avz --delete \
        --exclude='.git/' \
        --exclude='node_modules/' \
        --exclude='logs/' \
        --exclude='*.log' \
        --exclude='database.sqlite' \
        --exclude='.env' \
        --exclude='dist/' \
        --exclude='.DS_Store' \
        --exclude='*.swp' \
        --exclude='*.swo' \
        ./ ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/

    log_info "代码同步完成"
}

# 在服务器上执行部署步骤
deploy_on_server() {
    log_info "在服务器上执行部署步骤..."

    ssh ${SERVER_USER}@${SERVER_HOST} "
        cd ${SERVER_PATH}

        echo '停止当前应用...'
        pm2 stop douyin-admin-api || echo '应用未运行，跳过停止'

        echo '安装新的依赖...'
        npm install --production

        echo '运行数据库迁移...'
        if [ -f scripts/init-tokens.js ]; then
            node scripts/init-tokens.js
        else
            echo '警告: init-tokens.js 脚本不存在'
        fi

        echo '启动应用...'
        pm2 start ecosystem.config.js --env production

        echo '等待应用启动...'
        sleep 5

        echo '检查应用状态...'
        pm2 status

        echo '显示应用日志...'
        pm2 logs douyin-admin-api --lines 10 --nostream
    "

    log_info "服务器部署步骤完成"
}

# 验证部署
verify_deployment() {
    log_info "验证部署结果..."

    # 等待应用完全启动
    sleep 3

    # 测试API是否正常
    if curl -f -s "http://${SERVER_HOST}:3000/api/health" > /dev/null; then
        log_info "✅ 健康检查通过"
    else
        log_error "❌ 健康检查失败"
        exit 1
    fi

    # 测试Token状态API
    if curl -f -s "http://${SERVER_HOST}:3000/api/douyin/token-status" > /dev/null; then
        log_info "✅ Token状态API正常"
    else
        log_error "❌ Token状态API异常"
        exit 1
    fi

    log_info "部署验证完成"
}

# 主函数
main() {
    echo "========================================"
    echo "🔄 后端代码更新部署脚本"
    echo "功能: 部署Token管理系统更新"
    echo "========================================"

    # 检查配置
    if [ "$SERVER_HOST" = "your-server-ip" ]; then
        log_error "请先修改脚本中的服务器配置 (SERVER_USER, SERVER_HOST, SERVER_PATH)"
        exit 1
    fi

    check_dependencies
    backup_server
    sync_code
    deploy_on_server
    verify_deployment

    echo ""
    echo "========================================"
    log_info "🎉 部署完成！"
    echo ""
    log_info "更新的功能:"
    echo "  ✅ Token数据库存储和自动刷新"
    echo "  ✅ Token刷新历史记录"
    echo "  ✅ 每10分钟自动刷新token"
    echo "  ✅ 服务器重启后token持久化"
    echo ""
    log_info "API端点:"
    echo "  📊 Token状态: http://${SERVER_HOST}:3000/api/douyin/token-status"
    echo "  📝 Token历史: http://${SERVER_HOST}:3000/api/douyin/token-history"
    echo "  🔄 手动刷新: http://${SERVER_HOST}:3000/api/douyin/refresh-token"
    echo "========================================"
}

# 执行主函数
main "$@"