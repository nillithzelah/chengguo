#!/bin/bash

# 部署脚本：将本地修改的文件上传到服务器
# 支持增量同步，只上传修改过的文件

# 配置参数
REMOTE_HOST="47.115.94.203"  # 替换为你的服务器IP
REMOTE_USER="root"            # 替换为你的服务器用户名
REMOTE_PATH="/var/www/douyin-admin-master"  # 服务器上的项目路径
LOCAL_PATH="./"               # 本地项目路径（当前目录）

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印带颜色的信息
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查依赖
check_dependencies() {
    if ! command -v rsync &> /dev/null; then
        print_error "rsync 未安装，请先安装 rsync"
        exit 1
    fi

    if ! command -v ssh &> /dev/null; then
        print_error "ssh 未安装，请先安装 openssh-client"
        exit 1
    fi
}

# 测试服务器连接
test_connection() {
    print_info "测试服务器连接..."
    if ssh -o ConnectTimeout=5 -o BatchMode=yes ${REMOTE_USER}@${REMOTE_HOST} "echo '连接成功'" &> /dev/null; then
        print_info "服务器连接正常"
        return 0
    else
        print_error "无法连接到服务器，请检查："
        echo "  1. 服务器IP和用户名是否正确"
        echo "  2. SSH密钥是否已配置"
        echo "  3. 服务器是否在线"
        exit 1
    fi
}

# 备份远程文件
backup_remote() {
    print_info "创建远程备份..."
    ssh ${REMOTE_USER}@${REMOTE_HOST} "
        if [ -d '${REMOTE_PATH}' ]; then
            TIMESTAMP=\$(date +'%Y%m%d_%H%M%S')
            BACKUP_NAME='douyin-admin-master.backup.\${TIMESTAMP}.tar.gz'
            echo '创建备份: \${BACKUP_NAME}'
            cd /var/www && tar -czf \${BACKUP_NAME} douyin-admin-master 2>/dev/null || echo '备份失败，但继续部署...'
        else
            echo '远程目录不存在，将创建新目录'
        fi
    "
}

# 同步文件
sync_files() {
    print_info "开始同步文件..."

    # 排除不需要同步的文件
    EXCLUDE_OPTIONS=(
        --exclude='.git/'
        --exclude='node_modules/'
        --exclude='.DS_Store'
        --exclude='*.log'
        --exclude='.env.local'
        --exclude='dist/'
        --exclude='backup_script.sh'
        --exclude='deploy_script.sh'
    )

    # 使用rsync进行增量同步
    rsync -avz --delete \
        "${EXCLUDE_OPTIONS[@]}" \
        -e "ssh" \
        ${LOCAL_PATH} \
        ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}

    if [ $? -eq 0 ]; then
        print_info "文件同步完成"
    else
        print_error "文件同步失败"
        exit 1
    fi
}

# 重启服务（如果需要）
restart_service() {
    print_info "检查是否需要重启服务..."
    ssh ${REMOTE_USER}@${REMOTE_HOST} "
        # 检查是否有PM2进程
            if command -v pm2 &> /dev/null; then
                if pm2 list | grep -q 'douyin-admin-api'; then
                    echo '重启PM2服务...'
                    pm2 restart douyin-admin-api || echo 'PM2重启失败，请手动检查'
                else
                    echo '未找到相关PM2进程'
                fi
            fi

        # 检查是否有systemd服务
        if [ -f '/etc/systemd/system/douyin-admin.service' ]; then
            echo '重启systemd服务...'
            systemctl restart douyin-admin || echo 'systemd重启失败，请手动检查'
        fi
    "
}

# 主函数
main() {
    echo "======================================="
    echo "    Douyin Admin 部署脚本"
    echo "======================================="

    # 检查配置
    if [ "$REMOTE_HOST" = "your-server-ip" ]; then
        print_error "请先配置脚本中的服务器信息："
        echo "  REMOTE_HOST='你的服务器IP'"
        echo "  REMOTE_USER='服务器用户名'"
        exit 1
    fi

    check_dependencies
    test_connection
    backup_remote
    sync_files
    restart_service

    print_info "部署完成！"
    echo "======================================="
}

# 参数处理
case "${1:-}" in
    "test")
        test_connection
        ;;
    "backup")
        backup_remote
        ;;
    "sync")
        sync_files
        ;;
    "restart")
        restart_service
        ;;
    *)
        main
        ;;
esac