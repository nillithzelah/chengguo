<template>
  <div class="ecpm-page">
    <div class="page-header">
      <div class="header-content">
        <div>
           <h1>用户ECPM数据查看</h1>
           <p>查看当前用户的小游戏广告eCPM数据统计</p>
         </div>
      </div>
    </div>

    <!-- 查询表单 -->
    <div class="query-section">
      <div class="form-grid">
        <div class="form-item">
          <label>选择应用</label>
          <select
            v-model="selectedAppId"
            @change="onAppChange"
            class="form-input"
          >
            <option value="">请选择应用</option>
            <option
              v-for="app in appList"
              :key="app.appid"
              :value="app.appid"
            >
              {{ app.name }} ({{ app.appid }})
            </option>
          </select>
        </div>
        <div class="form-item">
          <label>查询日期</label>
          <input
            v-model="queryParams.date_hour"
            type="date"
            class="form-input"
          />
        </div>
      </div>

      <div class="form-actions">
        <button
          @click="loadData"
          :disabled="loading"
          class="btn btn-primary"
        >
          {{ loading ? '加载中...' : '查询数据' }}
        </button>
        <button
          @click="resetQuery"
          class="btn btn-secondary"
        >
          重置
        </button>
        <button
          @click="exportData"
          :disabled="tableData.length === 0"
          class="btn btn-success"
        >
          导出数据
        </button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-section" v-if="stats">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ stats.totalRecords }}</div>
          <div class="stat-label">总记录数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">¥{{ stats.totalRevenue }}</div>
          <div class="stat-label">总收益</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">¥{{ stats.avgEcpm }}</div>
          <div class="stat-label">平均eCPM</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.totalUsers }}</div>
          <div class="stat-label">活跃用户</div>
        </div>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="table-section">
      <div class="table-header">
        <h3>eCPM数据明细</h3>
        <div class="table-info">
          共 {{ tableData.length }} 条记录
        </div>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>事件时间</th>
              <th>事件类型</th>
              <th>用户ID</th>
              <th>广告ID</th>
              <th>消耗(分)</th>
              <th>收益(元)</th>
              <th>eCPM(元)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="loading-cell">
                <div class="loading-spinner"></div>
                加载中...
              </td>
            </tr>
            <tr v-else-if="tableData.length === 0">
              <td colspan="7" class="empty-cell">
                暂无数据
              </td>
            </tr>
            <tr v-else v-for="item in tableData" :key="item.id">
              <td>{{ formatDateTime(item.event_time) }}</td>
              <td>{{ item.event_name }}</td>
              <td>{{ item.open_id }}</td>
              <td>{{ item.aid }}</td>
              <td>{{ item.cost }}</td>
              <td>¥{{ item.revenue }}</td>
              <td>¥{{ item.ecpm }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="error-section">
      <div class="error-message">
        <strong>错误：</strong>{{ error }}
      </div>
      <button @click="error = null" class="btn btn-small">关闭</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';
import useUserStore from '@/store/modules/user';

// 获取用户Store实例
const userStore = useUserStore();

// 响应式数据
const loading = ref(false);
const error = ref(null);
const tableData = ref([]);

// 查询参数
const queryParams = reactive({
  mp_id: '',
  date_hour: '',
  page_no: 1,
  page_size: 50
});

// 统计数据
const stats = ref(null);

// 应用列表管理
const appList = ref([]);

// 选中的应用ID
const selectedAppId = ref('');

// 工具函数
const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return '-';
  return dateTimeStr.replace('T', ' ').substring(0, 19);
};

// 应用列表管理函数（从数据库获取当前用户的应用）
const loadAppList = async () => {
  try {
    console.log('🔄 加载应用列表...');

    // 获取当前用户信息
    const userStore = useUserStore();
    const currentUser = userStore.userInfo;
    console.log('👤 当前用户:', currentUser);

    const allApps = [];

    // 从数据库获取游戏列表（API已经根据用户权限过滤）
    try {
      console.log('📡 从数据库获取游戏列表...');

      // 获取游戏列表
      const gameResponse = await fetch('/api/game/list', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (gameResponse.ok) {
        const gameResult = await gameResponse.json();
        if (gameResult.code === 20000 && gameResult.data?.games) {
          console.log('✅ 从数据库获取游戏成功:', gameResult.data.games.length, '个游戏');

          // API已经根据用户权限过滤，直接使用返回的游戏列表
          for (const game of gameResult.data.games) {
            allApps.push({
              appid: game.appid,
              appSecret: game.appSecret || game.app_secret || '',
              name: game.name,
              owner: currentUser?.name || 'unknown',
              validated: game.validated,
              validatedAt: game.validated_at,
              created_at: game.created_at
            });
          }
        }
      } else {
        console.log('⚠️ 从数据库获取游戏失败，使用localStorage备用方案');
      }
    } catch (dbError) {
      console.error('❌ 从数据库获取游戏出错:', dbError);
    }

    // 所有用户都只能查看自己拥有的应用
    console.log('👤 加载当前用户拥有的应用');

    // 从数据库获取当前用户拥有的应用
    if (allApps.length === 0) {
      console.log('📦 数据库中没有找到用户应用，尝试从localStorage加载...');

      // 获取当前用户的token来查找对应的应用
      const userToken = localStorage.getItem('userToken') || '54321'; // 默认使用user的token

      const userKey = `douyin_apps_${userToken}`;
      const savedApps = localStorage.getItem(userKey);
      if (savedApps) {
        const userApps = JSON.parse(savedApps);
        allApps.push(...userApps);
        console.log(`✅ 从localStorage加载了 ${userApps.length} 个应用`);
      } else {
        console.log('⚠️ localStorage中也没有找到用户应用');
      }
    }

    // 如果仍然没有应用，显示提示但不添加默认应用
    if (allApps.length === 0) {
      console.log('📝 用户暂无应用，请通过用户管理页面添加应用');
    }

    console.log('📋 最终加载的应用列表:', allApps);
    appList.value = allApps;
  } catch (err) {
    console.error('❌ 加载应用列表失败:', err);
    appList.value = [{
      appid: 'tt8c62fadf136c334702',
      appSecret: '56808246ee49c052ecc7be8be79551859837409e',
      name: '默认应用',
      owner: 'admin'
    }];
  }
};

// 监听用户状态变化，重新加载应用列表
watch(() => userStore.userInfo, async (newUser, oldUser) => {
  if (newUser && (!oldUser || newUser.name !== oldUser.name || newUser.role !== oldUser.role)) {
    console.log('👤 用户状态变化，重新加载应用列表');
    await loadAppList();

    // 重新设置默认应用
    if (appList.value.length > 0) {
      selectedAppId.value = appList.value[0].appid;
      queryParams.mp_id = appList.value[0].appid;
      console.log('✅ 重新设置默认应用:', appList.value[0].name, appList.value[0].appid);
    }
  }
}, { immediate: false });

// 应用选择变化处理
const onAppChange = () => {
  const selectedApp = appList.value.find(app => app.appid === selectedAppId.value);
  if (selectedApp) {
    queryParams.mp_id = selectedApp.appid;
    console.log('🔄 切换应用:', selectedApp.name, selectedApp.appid);
  } else {
    queryParams.mp_id = '';
  }
};

// 加载数据
const loadData = async () => {
  loading.value = true;
  error.value = null;

  try {
    console.log('🔄 开始加载eCPM数据...');

    // 获取当前选中的应用配置
    const selectedApp = appList.value.find(app => app.appid === selectedAppId.value);
    if (!selectedApp) {
      throw new Error('未选择有效的应用');
    }

    // 获取access_token - 通过后端代理调用
    console.log('🔑 获取access_token...');
    const tokenResponse = await fetch('/api/douyin/test-connection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        appid: selectedApp.appid,
        secret: selectedApp.appSecret
      })
    });

    const tokenResult = await tokenResponse.json();
    if (!tokenResponse.ok || tokenResult.code !== 0) {
      throw new Error('获取access_token失败: ' + (tokenResult.message || tokenResult.error));
    }

    const accessToken = tokenResult.data?.access_token;
    if (!accessToken) {
      throw new Error('获取到的access_token为空');
    }

    console.log('✅ 获取access_token成功');

    // 通过后端代理调用eCPM API
    const params = new URLSearchParams();

    // 添加前端传递的参数
    params.append('mp_id', queryParams.mp_id);
    params.append('date_hour', queryParams.date_hour || new Date().toISOString().split('T')[0]);
    params.append('page_no', queryParams.page_no?.toString() || '1');
    params.append('page_size', queryParams.page_size?.toString() || '50');

    // 添加App Secret到查询参数
    params.append('app_secret', selectedApp.appSecret);

    // 调用后端eCPM代理接口
    const response = await fetch(`/api/douyin/ecpm?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ API响应:', result);

    // 处理响应数据
    if (result.code === 0 && result.data) {
      // 检查是否有错误信息
      if (result.err_no && result.err_no !== 0) {
        throw new Error(result.err_msg || result.err_tips || 'API返回错误');
      }

      const records = result.data.data ? result.data.data.records : result.data.records || [];

      // 确保records是数组
      if (!Array.isArray(records)) {
        console.warn('⚠️ records不是数组:', records);
        tableData.value = [];
        stats.value = {
          totalRecords: 0,
          totalRevenue: '0.00',
          avgEcpm: '0.00',
          totalUsers: 0
        };
        return;
      }

      // 处理数据
      tableData.value = records.map((item, index) => ({
        id: index + 1,
        event_time: item.event_time,
        event_name: item.event_name,
        open_id: item.open_id,
        aid: item.aid,
        cost: item.cost,
        revenue: (item.cost || 0) / 10000,  // 修正：收益 = cost/10000 (1%分成)
        ecpm: (item.cost || 0) / 10000      // 修正：暂时使用修正后的revenue作为eCPM
      }));

      // 计算统计数据
      const totalRecords = tableData.value.length;
      const totalRevenue = tableData.value.reduce((sum, item) => sum + item.revenue, 0);
      const avgEcpm = totalRecords > 0 ? totalRevenue / totalRecords : 0;
      const uniqueUsers = new Set(tableData.value.map(item => item.open_id)).size;

      stats.value = {
        totalRecords,
        totalRevenue: totalRevenue.toFixed(2),
        avgEcpm: avgEcpm.toFixed(2),
        totalUsers: uniqueUsers
      };

      console.log('✅ 数据处理完成');
    } else {
      // 处理API错误
      if (result.err_no && result.err_no !== 0) {
        throw new Error(result.err_msg || result.err_tips || 'API返回错误');
      }
      throw new Error(result.message || '获取数据失败');
    }

  } catch (err) {
    console.error('❌ 加载数据失败:', err);
    error.value = err.message || '加载数据失败，请稍后重试';
  } finally {
    loading.value = false;
  }
};

// 重置查询
const resetQuery = () => {
  // 重置为默认应用
  if (appList.value.length > 0) {
    selectedAppId.value = appList.value[0].appid;
    queryParams.mp_id = appList.value[0].appid;
  } else {
    selectedAppId.value = '';
    queryParams.mp_id = '';
  }

  queryParams.date_hour = '';
  queryParams.page_no = 1;
  queryParams.page_size = 50;
  stats.value = null;
  tableData.value = [];
  error.value = null;
};

// 导出数据
const exportData = () => {
  if (tableData.value.length === 0) {
    alert('没有数据可导出');
    return;
  }

  try {
    // 创建CSV内容
    const headers = ['事件时间', '事件类型', '用户ID', '广告ID', '消耗(分)', '收益(元)', 'eCPM(元)'];
    const csvContent = [
      headers.join(','),
      ...tableData.value.map(row => [
        `"${row.event_time}"`,
        `"${row.event_name}"`,
        `"${row.open_id}"`,
        `"${row.aid}"`,
        row.cost,
        row.revenue,
        row.ecpm
      ].join(','))
    ].join('\n');

    // 创建下载链接
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `ecpm-data-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert('数据导出成功！');
  } catch (err) {
    console.error('导出失败:', err);
    alert('导出失败，请稍后重试');
  }
};

// 页面加载时初始化
onMounted(async () => {
  console.log('🚀 eCPM用户页面初始化');

  // 加载应用列表
  await loadAppList();

  // 设置默认选中的应用
  if (appList.value.length > 0) {
    selectedAppId.value = appList.value[0].appid;
    queryParams.mp_id = appList.value[0].appid;

    // 设置默认日期
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    queryParams.date_hour = yesterday.toISOString().split('T')[0];

    // 自动加载数据
    loadData();
  } else {
    console.log('⚠️ 用户暂无应用，跳过数据加载');
  }
});
</script>

<style scoped>
.ecpm-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
}

.page-header h1 {
  font-size: 28px;
  font-weight: 600;
  color: #1d2129;
  margin: 0 0 8px 0;
}

.page-header p {
  color: #86909c;
  margin: 0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 16px;
  }
}

/* 查询表单 */
.query-section {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.form-item {
  display: flex;
  flex-direction: column;
}

.form-item label {
  display: block;
  font-weight: 500;
  color: #1d2129;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
}

.form-input:focus {
  outline: none;
  border-color: #165dff;
  box-shadow: 0 0 0 2px rgba(22, 93, 255, 0.1);
}

.form-input select {
  cursor: pointer;
}

.form-actions {
  display: flex;
  gap: 12px;
}

/* 按钮样式 */
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #165dff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0e42d2;
}

.btn-secondary {
  background: #f2f3f5;
  color: #1d2129;
}

.btn-secondary:hover {
  background: #e5e6eb;
}

.btn-success {
  background: #52c41a;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #389e0d;
}

.btn-small {
  padding: 4px 8px;
  font-size: 12px;
}

/* 统计卡片 */
.stats-section {
  margin-bottom: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #1d2129;
  margin-bottom: 4px;
}

.stat-label {
  color: #86909c;
  font-size: 14px;
}

/* 数据表格 */
.table-section {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.table-header {
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1d2129;
}

.table-info {
  color: #86909c;
  font-size: 14px;
}

.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.data-table th {
  background: #fafbfc;
  font-weight: 600;
  color: #1d2129;
  white-space: nowrap;
}

.data-table td {
  color: #4e5969;
}

.data-table tr:hover {
  background: #f7f8fa;
}

.loading-cell,
.empty-cell {
  text-align: center;
  color: #86909c;
  font-style: italic;
}

.loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #f0f0f0;
  border-top: 2px solid #165dff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 错误提示 */
.error-section {
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 8px;
  padding: 16px 20px;
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.error-message {
  color: #cf1322;
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .ecpm-page {
    padding: 16px;
  }

  .form-row {
    flex-direction: column;
  }

  .form-item {
    min-width: auto;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .table-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .data-table {
    font-size: 14px;
  }

  .data-table th,
  .data-table td {
    padding: 8px 12px;
  }
}
</style>