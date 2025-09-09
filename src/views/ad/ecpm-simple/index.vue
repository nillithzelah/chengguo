<template>
  <div class="ecpm-page">
    <div class="page-header">
      <div class="header-content">
        <div>
           <h1>管理员ECPM数据管理</h1>
           <p>查看和管理所有用户的eCPM数据</p>
         </div>
        <div class="header-actions">
          <button
            @click="showAddUserModal = true"
            class="btn btn-secondary"
          >
            新增用户
          </button>
          <button
            @click="showAddAppModal = true"
            class="btn btn-primary"
          >
            新增应用
          </button>
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
              {{ app.name }} ({{ app.appid }}) - {{ getUserDisplayName(app.owner) }}
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

    <!-- 新增应用模态框 -->
    <div v-if="showAddAppModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>新增应用配置</h3>
          <button @click="closeModal" class="modal-close">&times;</button>
        </div>

        <div class="modal-body">
          <div class="form-item">
            <label>应用名称</label>
            <input
              v-model="newApp.name"
              type="text"
              placeholder="输入应用名称（用于标识）"
              class="form-input"
            />
          </div>

          <div class="form-item">
            <label>App ID</label>
            <input
              v-model="newApp.appid"
              type="text"
              placeholder="输入抖音应用的App ID"
              class="form-input"
            />
          </div>

          <div class="form-item">
            <label>App Secret</label>
            <input
              v-model="newApp.appSecret"
              type="password"
              placeholder="输入抖音应用的App Secret"
              class="form-input"
            />
          </div>

          <div class="form-item">
            <label>所属用户</label>
            <select
              v-model="newApp.owner"
              class="form-input"
            >
              <option value="">请选择所属用户</option>
              <option value="admin">管理员 (admin)</option>
              <option value="user">普通用户 (user)</option>
              <option value="user2">测试用户 (user2)</option>
              <option
                v-for="customUser in customUsers"
                :key="customUser.username"
                :value="customUser.username"
              >
                {{ customUser.name }} ({{ customUser.username }})
              </option>
            </select>
          </div>

          <!-- 测试连接区域 -->
          <div class="test-section" v-if="newApp.appid && newApp.appSecret">
            <div class="test-header">
              <h4>🔗 连接测试</h4>
              <button
                @click="testAppConnection"
                :disabled="testing"
                class="btn btn-outline"
              >
                {{ testing ? '测试中...' : '测试连接' }}
              </button>
            </div>

            <!-- 测试结果显示 -->
            <div v-if="testResult" class="test-result" :class="{ 'success': testResult.success, 'error': !testResult.success }">
              <div class="test-message">{{ testResult.message }}</div>
              <div v-if="testResult.success" class="test-details">
                <small>Token: {{ testResult.token }}</small><br>
                <small>有效期: {{ testResult.expiresIn }}秒</small>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeModal" class="btn btn-secondary" :disabled="saving">取消</button>
          <button
            @click="saveNewApp"
            :disabled="!newApp.name || !newApp.appid || !newApp.appSecret || !newApp.owner || saving"
            class="btn btn-primary"
          >
            {{ saving ? '验证中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 新增用户模态框 -->
    <div v-if="showAddUserModal" class="modal-overlay" @click="closeUserModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>新增用户</h3>
          <button @click="closeUserModal" class="modal-close">&times;</button>
        </div>

        <div class="modal-body">
          <div class="form-item">
            <label>用户名</label>
            <input
              v-model="newUser.username"
              type="text"
              placeholder="输入用户名（用于登录）"
              class="form-input"
            />
          </div>

          <div class="form-item">
            <label>密码</label>
            <input
              v-model="newUser.password"
              type="password"
              placeholder="输入密码"
              class="form-input"
            />
          </div>

          <div class="form-item">
            <label>显示名称</label>
            <input
              v-model="newUser.name"
              type="text"
              placeholder="输入用户显示名称"
              class="form-input"
            />
          </div>

          <div class="form-item">
            <label>用户角色</label>
            <select
              v-model="newUser.role"
              class="form-input"
            >
              <option value="user">普通用户</option>
              <option value="admin">管理员</option>
            </select>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeUserModal" class="btn btn-secondary" :disabled="creating">取消</button>
          <button
            @click="createNewUser"
            :disabled="!newUser.username || !newUser.password || !newUser.name || creating"
            class="btn btn-primary"
          >
            {{ creating ? '创建中...' : '创建用户' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { db, initDatabase } from '@/utils/database';
import useUserStore from '@/store/modules/user';

// 响应式数据
const loading = ref(false);
const error = ref(null);
const tableData = ref([]);

// 查询参数
const queryParams = reactive({
  mp_id: 'tt8c62fadf136c334702',
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

// 自定义用户列表
const customUsers = ref([]);

// 新增应用相关
const showAddAppModal = ref(false);
const saving = ref(false);
const testing = ref(false);
const testResult = ref(null);
const newApp = reactive({
  name: '',
  appid: '',
  appSecret: '',
  owner: ''
});

// 新增用户相关
const showAddUserModal = ref(false);
const creating = ref(false);
const newUser = reactive({
  username: '',
  password: '',
  name: '',
  role: 'user'
});

// 工具函数
const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return '-';
  return dateTimeStr.replace('T', ' ').substring(0, 19);
};

// 获取用户显示名称
const getUserDisplayName = (username) => {
  if (!username) return '未分配';

  // 检查是否是内置用户
  if (username === 'admin') return '管理员';
  if (username === 'user') return '普通用户';
  if (username === 'user2') return '测试用户';

  // 检查是否是自定义用户
  const customUser = customUsers.value.find(user => user.username === username);
  if (customUser) {
    return customUser.name;
  }

  return username;
};

// 加载自定义用户列表
const loadCustomUsers = () => {
  try {
    const savedUsers = localStorage.getItem('custom_users');
    if (savedUsers) {
      customUsers.value = JSON.parse(savedUsers);
    } else {
      customUsers.value = [];
    }
  } catch (err) {
    console.error('加载自定义用户列表失败:', err);
    customUsers.value = [];
  }
};

// 应用列表管理函数
const loadAppList = () => {
  try {
    console.log('🔄 加载应用列表...');

    // 获取当前用户信息
    const userStore = useUserStore();
    const currentUser = userStore.userInfo;
    console.log('👤 当前用户:', currentUser);

    const allApps = [];

    // 根据用户角色决定可以查看的应用
    if (currentUser.role === 'admin') {
      console.log('👑 管理员用户，加载所有应用');

      // 管理员可以查看所有用户的应用
      const userKeys = ['douyin_apps_54321', 'douyin_apps_67890', 'douyin_apps_12345'];

      // 加载内置用户的应用
      userKeys.forEach(key => {
        const savedApps = localStorage.getItem(key);
        if (savedApps) {
          const userApps = JSON.parse(savedApps);
          allApps.push(...userApps);
        }
      });

      // 加载自定义用户的应用
      customUsers.value.forEach(customUser => {
        const userKey = `douyin_apps_${customUser.token}`;
        const savedApps = localStorage.getItem(userKey);
        if (savedApps) {
          const userApps = JSON.parse(savedApps);
          allApps.push(...userApps);
        }
      });

      // 如果没有应用，添加默认应用
      if (allApps.length === 0) {
        allApps.push({
          appid: 'tt8c62fadf136c334702',
          appSecret: '56808246ee49c052ecc7be8be79551859837409e',
          name: '默认应用',
          owner: 'admin'
        });
      }
    } else {
      console.log('👤 普通用户，加载自己的应用');

      // 普通用户只能查看自己的应用
      // 从localStorage中获取当前用户的token
      const userToken = localStorage.getItem('userToken') || '54321'; // 默认使用user的token

      const userKey = `douyin_apps_${userToken}`;
      const savedApps = localStorage.getItem(userKey);
      if (savedApps) {
        const userApps = JSON.parse(savedApps);
        allApps.push(...userApps);
      }

      // 如果用户没有应用，添加默认应用
      if (allApps.length === 0) {
        allApps.push({
          appid: 'tt8c62fadf136c334702',
          appSecret: '56808246ee49c052ecc7be8be79551859837409e',
          name: '默认应用',
          owner: currentUser.name || 'user'
        });
      }
    }

    console.log('📋 加载的应用列表:', allApps);
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

const saveAppList = () => {
  try {
    // 按用户分组保存应用
    const appsByUser = {};

    appList.value.forEach(app => {
      const owner = app.owner || 'admin';
      if (!appsByUser[owner]) {
        appsByUser[owner] = [];
      }
      appsByUser[owner].push(app);
    });

    // 保存到对应用户的存储中
    Object.keys(appsByUser).forEach(owner => {
      let userToken;
      if (owner === 'user') {
        userToken = '54321';
      } else if (owner === 'user2') {
        userToken = '67890';
      } else if (owner === 'admin') {
        userToken = '12345';
      } else {
        // 自定义用户，使用用户名作为token的一部分
        const customUser = customUsers.value.find(user => user.username === owner);
        userToken = customUser ? customUser.token : owner;
      }
      const storageKey = `douyin_apps_${userToken}`;
      localStorage.setItem(storageKey, JSON.stringify(appsByUser[owner]));
    });
  } catch (err) {
    console.error('保存应用列表失败:', err);
  }
};

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

// 关闭模态框
const closeModal = () => {
  showAddAppModal.value = false;
  newApp.name = '';
  newApp.appid = '';
  newApp.appSecret = '';
  newApp.owner = '';
  testResult.value = null;
  testing.value = false;
};

// 关闭用户模态框
const closeUserModal = () => {
  showAddUserModal.value = false;
  newUser.username = '';
  newUser.password = '';
  newUser.name = '';
  newUser.role = 'user';
  creating.value = false;
};

// 测试应用配置连接
const testAppConnection = async () => {
  if (!newApp.appid || !newApp.appSecret) {
    alert('请先填写App ID和App Secret');
    return;
  }

  testing.value = true;
  testResult.value = null;

  try {
    console.log('🔗 开始测试应用连接...');

    // 通过后端代理调用token API进行测试
    const response = await fetch('/api/douyin/test-connection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        appid: newApp.appid,
        secret: newApp.appSecret
      })
    });

    const result = await response.json();
    console.log('📥 测试连接响应:', result);

    if (response.ok && (result.code === 0 || result.err_no === 0)) {
      console.log('✅ 应用连接测试成功');

      testResult.value = {
        success: true,
        message: '✅ 连接成功！应用配置有效',
        token: result.data?.access_token || 'token_received',
        expiresIn: result.data?.expires_in || 7200
      };
    } else {
      console.log('❌ 应用连接测试失败:', result.message || result.error || result.err_tips);

      // 处理不同的错误格式
      let errorMessage = '连接失败';
      if (result.err_tips) {
        errorMessage = result.err_tips;
      } else if (result.message) {
        errorMessage = result.message;
      } else if (result.error) {
        errorMessage = result.error;
      }

      testResult.value = {
        success: false,
        message: `❌ ${errorMessage}`,
        error: errorMessage
      };
    }

  } catch (err) {
    console.error('❌ 测试连接时出错:', err);
    testResult.value = {
      success: false,
      message: `❌ 网络错误: ${err.message}`,
      error: err.message
    };
  } finally {
    testing.value = false;
  }
};

// 验证应用配置（调用后端API）
const validateAppConfig = async (appid, appSecret) => {
  try {
    console.log('🔐 开始验证应用配置...');

    // 通过后端代理调用token API进行验证
    const response = await fetch('/api/douyin/test-connection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        appid: appid,
        secret: appSecret
      })
    });

    const result = await response.json();
    console.log('📥 应用配置验证响应:', result);

    if (response.ok && (result.code === 0 || result.err_no === 0)) {
      console.log('✅ 应用配置验证成功');
      return {
        success: true,
        token: result.data?.access_token || 'token_validated'
      };
    } else {
      console.log('❌ 应用配置验证失败:', result.message || result.error || result.err_tips);

      // 处理不同的错误格式
      let errorMessage = '验证失败';
      if (result.err_tips) {
        errorMessage = result.err_tips;
      } else if (result.message) {
        errorMessage = result.message;
      } else if (result.error) {
        errorMessage = result.error;
      }

      return {
        success: false,
        error: errorMessage
      };
    }

  } catch (err) {
    console.error('❌ 验证应用配置时出错:', err);
    return { success: false, error: err.message || '网络错误，请检查连接' };
  }
};

// 保存新应用
const saveNewApp = async () => {
  if (!newApp.name || !newApp.appid || !newApp.appSecret || !newApp.owner) {
    alert('请填写完整的应用信息，包括所属用户');
    return;
  }

  saving.value = true;

  try {
    console.log('🔄 开始保存新应用配置...');

    // 检查应用ID是否已存在
    const existingApp = appList.value.find(app => app.appid === newApp.appid);
    if (existingApp) {
      alert('该App ID已存在，请使用不同的App ID');
      return;
    }

    // 验证应用配置
    console.log('🔐 正在验证应用配置...');
    const validation = await validateAppConfig(newApp.appid, newApp.appSecret);

    if (!validation.success) {
      alert(`应用配置验证失败: ${validation.error}\n请检查App ID和App Secret是否正确。`);
      return;
    }

    console.log('✅ 应用配置验证通过，Token:', validation.token.substring(0, 20) + '...');

    // 添加新应用到列表
    appList.value.push({
      name: newApp.name,
      appid: newApp.appid,
      appSecret: newApp.appSecret,
      owner: newApp.owner,
      validated: true,
      validatedAt: new Date().toISOString()
    });

    // 保存到本地存储
    saveAppList();

    console.log('✅ 应用配置保存成功');
    alert(`应用配置验证成功并已保存给用户: ${newApp.owner === 'user' ? '普通用户' : newApp.owner === 'user2' ? '测试用户' : newApp.owner === 'admin' ? '管理员' : '未知用户'}！`);

    // 自动选择新应用
    selectedAppId.value = newApp.appid;
    queryParams.mp_id = newApp.appid;

    // 关闭模态框
    closeModal();

  } catch (err) {
    console.error('❌ 保存应用配置失败:', err);
    alert('保存失败，请稍后重试');
  } finally {
    saving.value = false;
  }
};

// 创建新用户
const createNewUser = async () => {
  if (!newUser.username || !newUser.password || !newUser.name) {
    alert('请填写完整的用户信息');
    return;
  }

  creating.value = true;

  try {
    console.log('🔄 开始创建新用户...');

    // 通过后端API创建用户
    const response = await fetch('/api/user/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: newUser.username,
        password: newUser.password,
        name: newUser.name,
        role: newUser.role
      })
    });

    const result = await response.json();

    if (!response.ok || result.code !== 20000) {
      throw new Error(result.message || '创建用户失败');
    }

    console.log('✅ 用户创建成功');

    // 同时更新前端的自定义用户列表（用于显示）
    const existingUsers = JSON.parse(localStorage.getItem('custom_users') || '[]');
    const newUserData = {
      username: newUser.username,
      password: newUser.password,
      name: newUser.name,
      role: newUser.role,
      token: Date.now().toString(), // 生成前端token用于显示
      createdAt: new Date().toISOString()
    };

    existingUsers.push(newUserData);
    localStorage.setItem('custom_users', JSON.stringify(existingUsers));

    // 更新自定义用户列表
    customUsers.value = existingUsers;

    alert(`用户"${newUser.name}"创建成功！\n用户名: ${newUser.username}\n密码: ${newUser.password}\n\n用户已保存到数据库，可以使用此账号登录。`);

    // 关闭模态框
    closeUserModal();

  } catch (err) {
    console.error('❌ 创建用户失败:', err);
    alert(`创建用户失败: ${err.message}`);
  } finally {
    creating.value = false;
  }
};

// 页面加载时初始化
onMounted(() => {
  console.log('🚀 eCPM页面初始化');

  // 加载自定义用户列表
  loadCustomUsers();

  // 加载应用列表
  loadAppList();

  // 设置默认选中的应用
  if (appList.value.length > 0) {
    selectedAppId.value = appList.value[0].appid;
    queryParams.mp_id = appList.value[0].appid;
  }

  // 设置默认日期
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  queryParams.date_hour = yesterday.toISOString().split('T')[0];

  // 自动加载数据
  loadData();
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

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1d2129;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #86909c;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  color: #1d2129;
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 测试连接区域样式 */
.test-section {
  margin-top: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.test-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.test-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1d2129;
}

.btn-outline {
  padding: 6px 12px;
  border: 1px solid #165dff;
  background: white;
  color: #165dff;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-outline:hover:not(:disabled) {
  background: #165dff;
  color: white;
}

.btn-outline:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.test-result {
  padding: 12px;
  border-radius: 4px;
  font-size: 13px;
  line-height: 1.4;
}

.test-result.success {
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  color: #52c41a;
}

.test-result.error {
  background: #fff2f0;
  border: 1px solid #ffccc7;
  color: #ff4d4f;
}

.test-message {
  font-weight: 500;
  margin-bottom: 4px;
}

.test-details {
  opacity: 0.8;
  font-size: 12px;
}

.test-details small {
  display: block;
  margin-bottom: 2px;
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

  .modal-content {
    width: 95%;
    margin: 16px;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 16px 20px;
  }

  .modal-footer {
    flex-direction: column;
    gap: 8px;
  }

  .modal-footer .btn {
    width: 100%;
  }

  .test-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .test-section {
    padding: 12px;
  }
}
</style>