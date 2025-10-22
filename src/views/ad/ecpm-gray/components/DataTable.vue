<template>
  <div class="table-section">
    <div class="table-header">
      <h3>ECPM数据明细</h3>
      <div class="table-info">
        <div>共 {{ total }} 条记录</div>
      </div>
    </div>

    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>事件时间</th>
            <th>应用</th>
            <th>来源</th>
            <th>用户名</th>
            <th>用户ID</th>
            <th>绑定操作</th>
            <th>收益</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td :colspan="columns.length" class="loading-cell">
              <div class="loading-container">
                <div class="loading-spinner"></div>
                <span>加载中...</span>
              </div>
            </td>
          </tr>
          <tr v-else-if="data.length === 0">
            <td :colspan="columns.length" class="empty-cell">
              <div class="empty-container">
                <div class="empty-icon">📊</div>
                <div class="empty-text">暂无数据</div>
                <div class="empty-hint">请先选择应用并点击查询</div>
              </div>
            </td>
          </tr>
          <tr v-else v-for="item in data" :key="item.id" class="data-row">
            <td class="event-time-cell">{{ formatDateTime(item.event_time) }}</td>
            <td class="app-name-cell">{{ item.app_name || getCurrentAppName() }}</td>
            <td>{{ item.source || '未知' }}</td>
            <td class="username-cell" :title="item.username">
              {{ item.username }}
            </td>
            <td class="user-id-cell">{{ item.open_id }}</td>
            <td>
              <div class="bind-action-cell">
                <button
                  v-if="canManageUsers && item.isBound"
                  @click="$emit('unbind-user', item)"
                  class="btn btn-small btn-danger"
                  :disabled="unbinding"
                >
                  {{ unbinding ? '解绑中...' : '解绑用户' }}
                </button>
                <button
                  v-else-if="!item.isBound"
                  @click="$emit('bind-user', item)"
                  class="btn btn-small btn-success"
                  :disabled="binding"
                >
                  {{ binding ? '绑定中...' : '绑定用户' }}
                </button>
                <button
                  v-else
                  class="btn btn-small btn-secondary"
                  disabled
                >
                  已被绑定
                </button>
              </div>
            </td>
            <td class="revenue-cell">¥{{ item.revenue }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页组件 -->
    <div v-if="showPagination && total > 0" class="pagination-container">
      <div class="pagination-info">
        显示 {{ startRecord }}-{{ endRecord }} 条，共 {{ total }} 条记录
      </div>
      <div class="pagination-controls">
        <button
          @click="$emit('page-change', currentPage - 1)"
          :disabled="currentPage <= 1"
          class="btn btn-small btn-secondary"
        >
          上一页
        </button>

        <div class="page-numbers">
          <button
            v-for="page in visiblePages"
            :key="page"
            @click="$emit('page-change', page)"
            :class="[
              'btn btn-small',
              page === currentPage ? 'btn-primary' : 'btn-secondary'
            ]"
          >
            {{ page }}
          </button>
        </div>

        <button
          @click="$emit('page-change', currentPage + 1)"
          :disabled="currentPage >= totalPages"
          class="btn btn-small btn-secondary"
        >
          下一页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { dateUtils } from '@/utils/helpers';

interface TableItem {
  id: string;
  event_time: string;
  source: string;
  username: string;
  open_id: string;
  aid: string;
  revenue: number;
  isBound: boolean;
  app_name?: string; // 添加应用名称字段
}

interface Props {
  data: TableItem[];
  loading: boolean;
  binding: boolean;
  unbinding: boolean;
  canManageUsers: boolean;
  currentAppName: string;
  // 分页相关
  currentPage?: number;
  pageSize?: number;
  total?: number;
  showPagination?: boolean;
}

interface Emits {
  'bind-user': [item: TableItem];
  'unbind-user': [item: TableItem];
  'page-change': [page: number];
}

const props = withDefaults(defineProps<Props>(), {
  currentPage: 1,
  pageSize: 10,
  total: 0,
  showPagination: false,
});

const emit = defineEmits<Emits>();

// 表格列配置
const columns = [
  { key: 'event_time', label: '事件时间' },
  { key: 'app', label: '应用' },
  { key: 'source', label: '来源' },
  { key: 'username', label: '用户名' },
  { key: 'open_id', label: '用户ID' },
  { key: 'actions', label: '绑定操作' },
  { key: 'revenue', label: '收益' },
];

// 格式化日期时间
const formatDateTime = (dateTimeStr: string): string => {
  return dateUtils.formatDateTime(dateTimeStr);
};

// 获取当前应用名称
const getCurrentAppName = (): string => {
  return props.currentAppName || '未选择应用';
};

// 计算分页信息
const totalPages = computed(() => {
  return Math.ceil(props.total / props.pageSize);
});

const startRecord = computed(() => {
  return (props.currentPage - 1) * props.pageSize + 1;
});

const endRecord = computed(() => {
  return Math.min(props.currentPage * props.pageSize, props.total);
});

// 计算显示的页码
const visiblePages = computed(() => {
  const pages: number[] = [];
  const total = totalPages.value;
  const current = props.currentPage;

  if (total <= 7) {
    // 总页数小于等于7，显示所有页码
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    // 总页数大于7，显示部分页码
    if (current <= 4) {
      // 当前页靠近开始
      pages.push(1, 2, 3, 4, 5, 6, 7);
    } else if (current >= total - 3) {
      // 当前页靠近结尾
      pages.push(total - 6, total - 5, total - 4, total - 3, total - 2, total - 1, total);
    } else {
      // 当前页在中间
      pages.push(current - 3, current - 2, current - 1, current, current + 1, current + 2, current + 3);
    }
  }

  return pages;
});
</script>

<style scoped>
.table-section {
  background: linear-gradient(135deg, #fff 0%, #f8f9ff 100%);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  border: 1px solid rgba(102, 126, 234, 0.1);
}

.table-header {
  padding: 24px;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%);
}

.table-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1d2129;
  display: flex;
  align-items: center;
  gap: 8px;
}

.table-header h3::before {
  content: "📋";
  font-size: 20px;
}

.table-info {
  color: #86909c;
  font-size: 14px;
  font-weight: 500;
}

.table-container {
  overflow-x: auto;
  max-height: 600px;
  overflow-y: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 16px 20px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
}

.data-table th {
  background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%);
  font-weight: 600;
  color: #1d2129;
  white-space: nowrap;
  border-bottom: 2px solid #e8e8e8;
  position: sticky;
  top: 0;
  z-index: 10;
}

.data-table td {
  color: #4e5969;
  transition: background-color 0.2s ease;
}


.loading-cell,
.empty-cell {
  text-align: center;
  color: #86909c;
  font-style: italic;
  padding: 40px !important;
}

.loading-container,
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.loading-spinner {
  display: inline-block;
  width: 24px;
  height: 24px;
  border: 3px solid #f0f0f0;
  border-top: 3px solid #165dff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.empty-icon {
  font-size: 48px;
  opacity: 0.6;
}

.empty-text {
  font-size: 16px;
  font-weight: 500;
  color: #86909c;
}

.empty-hint {
  font-size: 14px;
  color: #c9cdd4;
}

.data-row {
  /* 移除了鼠标悬停效果 */
}

/* 单元格样式 */
.event-time-cell {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.username-cell {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-name-cell,
.user-id-cell {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-id-cell {
  max-width: 250px;
  font-weight: 600;
  color: #1d2129;
}

.revenue-cell {
  font-weight: 600;
  color: #52c41a;
}

.bind-action-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 按钮样式 */
.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.4);
}

.btn-success {
  background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: linear-gradient(135deg, #389e0d 0%, #237804 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(82, 196, 26, 0.4);
}

.btn-danger {
  background: linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: linear-gradient(135deg, #cf1322 0%, #a8071a 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(255, 77, 79, 0.4);
}

.btn-secondary {
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
  color: #1d2129;
  border: 1px solid #d9d9d9;
}

.btn-secondary:hover:not(:disabled) {
  background: linear-gradient(135deg, #e8e8e8 0%, #d0d0d0 100%);
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
}

/* 分页样式 */
.pagination-container {
  padding: 20px 24px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%);
}

.pagination-info {
  color: #86909c;
  font-size: 14px;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-numbers {
  display: flex;
  gap: 4px;
  margin: 0 12px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .table-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .pagination-container {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .pagination-controls {
    justify-content: center;
  }

  .data-table th,
  .data-table td {
    padding: 8px 12px;
    font-size: 12px;
  }

  .btn {
    padding: 4px 8px;
    font-size: 11px;
  }
}
</style>