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

    <!-- 调试信息面板 -->
    <div class="debug-section" v-if="debugInfo.length > 0">
      <div class="debug-header">
        <h3>🔍 城市获取调试信息</h3>
        <div class="debug-actions">
          <button @click="clearDeviceCache" class="btn btn-warning btn-small">清除缓存</button>
          <button @click="clearDebugInfo" class="btn btn-small">清除调试</button>
        </div>
      </div>
      <div class="debug-content">
        <div v-for="(info, index) in debugInfo" :key="index" class="debug-item">
          <pre>{{ info }}</pre>
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
              {{ app.name }}
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
        <div class="form-item">
          <label>广告预览二维码</label>
          <button
            @click="showQrPreviewModalFunc"
            class="btn btn-outline btn-qr-preview"
          >
            📱 查看广告预览二维码
          </button>
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
        <!-- 隐藏调试相关按钮 -->
        <!--
        <button
          @click="testDeviceInfo"
          class="btn btn-info"
        >
          测试设备信息
        </button>
        <button
          @click="resetQuery"
          class="btn btn-secondary"
        >
          重置
        </button>
        <button
          @click="triggerCityDebug"
          class="btn btn-outline"
        >
          调试城市获取
        </button>
        -->
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
          <div class="stat-value">¥{{ stats.totalEcpm }}</div>
          <div class="stat-label">总eCPM</div>
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
              <th>来源</th>
              <th>用户名</th>
              <th>用户ID</th>
              <th>广告ID</th>
              <!-- <th>二维码</th> -->
              <th>IP</th>
              <th>城市</th>
              <th>手机品牌</th>
              <th>手机型号</th>
              <th>收益(元)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="10" class="loading-cell">
                <div class="loading-spinner"></div>
                加载中...
              </td>
            </tr>
            <tr v-else-if="tableData.length === 0">
              <td colspan="10" class="empty-cell">
                暂无数据
              </td>
            </tr>
            <tr v-else v-for="item in tableData" :key="item.id">
              <td>{{ formatDateTime(item.event_time) }}</td>
              <td>{{ item.source || '未知' }}</td>
              <td>{{ item.username }}</td>
              <td>{{ item.open_id }}</td>
              <td>{{ item.aid }}</td>
              <!-- <td>
                <div class="qr-code-cell">
                  <img
                    v-if="item.qrCode"
                    :src="item.qrCode"
                    alt="广告二维码"
                    class="qr-code-image"
                    @click="showQrModalFunc(item)"
                  />
                  <button
                    v-else
                    @click="generateQrCode(item)"
                    class="btn btn-small btn-outline"
                  >
                    生成二维码
                  </button>
                </div>
              </td> -->
              <td>{{ item.ip || '未知' }}</td>
              <td>{{ item.city || '未知' }}</td>
              <td>{{ item.phone_brand || '未知' }}</td>
              <td>{{ item.phone_model || '未知' }}</td>
              <td>¥{{ item.revenue }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 二维码显示模态框 -->
    <div v-if="showQrModal" class="modal-overlay" @click="closeQrModal">
      <div class="modal-content qr-modal" @click.stop>
        <div class="modal-header">
          <h3>广告二维码</h3>
          <button @click="closeQrModal" class="modal-close">&times;</button>
        </div>

        <div class="modal-body" v-if="currentQrItem">
          <div class="qr-info">
            <div class="qr-details">
              <p><strong>广告ID:</strong> {{ currentQrItem.aid }}</p>
              <p><strong>用户名:</strong> {{ currentQrItem.username }}</p>
              <p><strong>收益:</strong> ¥{{ currentQrItem.revenue }}</p>
              <div v-if="currentQrItem.materialInfo">
                <p v-if="currentQrItem.materialInfo.title"><strong>标题:</strong> {{ currentQrItem.materialInfo.title }}</p>
                <p v-if="currentQrItem.materialInfo.description"><strong>描述:</strong> {{ currentQrItem.materialInfo.description }}</p>
                <p v-if="currentQrItem.materialInfo.material_type"><strong>素材类型:</strong> {{ currentQrItem.materialInfo.material_type }}</p>
                <p v-if="currentQrItem.materialInfo.image_mode"><strong>图片模式:</strong> {{ currentQrItem.materialInfo.image_mode }}</p>
                <p v-if="currentQrItem.materialInfo.creative_material_mode"><strong>创意模式:</strong> {{ currentQrItem.materialInfo.creative_material_mode }}</p>
              </div>
            </div>
            <div class="qr-code-large">
              <img
                v-if="currentQrItem.qrCode"
                :src="currentQrItem.qrCode"
                alt="广告二维码"
                class="qr-code-large-image"
              />
              <div v-else class="qr-loading">二维码生成中...</div>
            </div>
          </div>
          <div class="qr-actions">
            <button @click="downloadQrCode" class="btn btn-primary" :disabled="!currentQrItem.qrCode">下载二维码</button>
            <button @click="copyQrUrl" class="btn btn-secondary">复制链接</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 预览二维码模态框 -->
    <div v-if="showQrPreviewModal" class="modal-overlay" @click="closeQrPreviewModal">
      <div class="modal-content qr-modal" @click.stop>
        <div class="modal-header">
          <h3>广告预览二维码</h3>
          <button @click="closeQrPreviewModal" class="modal-close">&times;</button>
        </div>

        <div class="modal-body">
          <div class="qr-info">
            <div class="qr-details">
              <p><strong>用途:</strong> 抖音广告预览</p>
              <p><strong>说明:</strong> 扫描二维码可预览广告效果</p>
              <!-- <p><strong>广告主ID:</strong> 1843320456982026</p>
              <p><strong>广告ID:</strong> 7550558554752532523</p> -->
              <p><strong>生成时间:</strong> {{ new Date().toLocaleString() }}</p>
            </div>
            <div class="qr-code-large">
              <img
                v-if="currentPreviewQrImage"
                :src="currentPreviewQrImage"
                alt="广告预览二维码"
                class="qr-code-large-image"
              />
              <div v-else class="qr-loading">正在生成二维码...</div>
            </div>
          </div>
          <div class="qr-actions">
            <button @click="downloadPreviewQrCode" class="btn btn-primary" :disabled="!currentPreviewQrImage">下载二维码</button>
            <button @click="copyPreviewQrUrl" class="btn btn-secondary" :disabled="!currentPreviewQrUrl">复制链接</button>
          </div>
        </div>
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
import { ref, reactive, onMounted, watch, computed } from 'vue';
import useUserStore from '@/store/modules/user';
import QRCode from 'qrcode';

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

// 调试信息
const debugInfo = ref([]);

// 二维码相关
const showQrModal = ref(false);
const currentQrItem = ref(null);

// 预览二维码模态框
const showQrPreviewModal = ref(false);

// 当前预览二维码URL和图片
const currentPreviewQrUrl = ref('');
const currentPreviewQrImage = ref('');


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
              created_at: game.created_at,
              advertiser_id: game.advertiser_id,
              promotion_id: game.promotion_id
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

    // 确保设备信息已获取
    console.log('📱 检查设备信息状态:', userStore.deviceInfo);
    if (!userStore.deviceInfo?.ip || userStore.deviceInfo?.ip === '未知') {
      console.log('📱 设备信息不完整，重新获取...');
      try {
        await userStore.fetchDeviceInfo();
        console.log('📱 设备信息获取完成:', userStore.deviceInfo);
      } catch (deviceError) {
        console.warn('📱 设备信息获取失败，使用默认值:', deviceError);
      }
    }

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

      // 获取当前用户设备信息（从用户store中获取）
      const currentIP = userStore.deviceInfo?.ip || '未知';
      const currentCity = userStore.deviceInfo?.city || '未知';
      const currentBrand = userStore.deviceInfo?.phoneBrand || '未知';
      const currentModel = userStore.deviceInfo?.phoneModel || '未知';

      // 处理数据
      tableData.value = records.map((item, index) => ({
        id: index + 1,
        event_time: item.event_time,
        source: item.source || '未知来源',
        username: userStore.userInfo?.name || '当前用户',
        open_id: item.open_id,
        aid: item.aid,
        ip: item.ip || currentIP,
        city: item.city || currentCity,
        phone_brand: item.phone_brand || currentBrand,
        phone_model: item.phone_model || currentModel,
        revenue: (item.cost || 0) / 100000,  // 修正：收益 = cost / 100000 (十万分之一)
      }));

      // 计算统计数据
      const totalRecords = tableData.value.length;
      const totalRevenue = tableData.value.reduce((sum, item) => sum + item.revenue, 0);
      const totalEcpm = totalRecords > 0 ? (totalRevenue / totalRecords * 1000).toFixed(2) : '0.00';
      const uniqueUsers = new Set(tableData.value.map(item => item.open_id)).size;

      stats.value = {
        totalRecords,
        totalRevenue: totalRevenue.toFixed(2),
        totalEcpm,
        totalUsers: uniqueUsers
      };

      console.log('✅ 数据处理完成');

      // 为指定广告ID自动生成二维码
      const targetAdId = '7550558554752532523';
      const targetItems = tableData.value.filter(item => item.aid === targetAdId);
      if (targetItems.length > 0) {
        console.log(`🔄 为广告ID ${targetAdId} 生成二维码...`);
        for (const item of targetItems) {
          if (!item.qrCode) {
            await generateQrCode(item);
          }
        }
        console.log(`✅ 已为广告ID ${targetAdId} 生成 ${targetItems.length} 个二维码`);
      }

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

// 测试设备信息获取
const testDeviceInfo = async () => {
  console.log('🧪 开始测试设备信息获取...');
  try {
    const result = await userStore.testIPFetching();
    if (result) {
      alert(`设备信息获取成功:\nIP: ${result.ip}\n城市: ${result.city}\n品牌: ${result.phoneBrand}\n型号: ${result.phoneModel}`);
    } else {
      alert('设备信息获取失败，请查看控制台日志');
    }
  } catch (err) {
    console.error('测试失败:', err);
    alert('测试失败: ' + err.message);
  }
};

// 调试城市获取
const triggerCityDebug = async () => {
  console.log('🔍 手动触发城市获取调试...');
  debugInfo.value = [];

  try {
    // 手动调用城市获取
    await userStore.fetchDeviceInfo();
    debugInfo.value.push(`设备信息: ${JSON.stringify(userStore.deviceInfo, null, 2)}`);
  } catch (error) {
    debugInfo.value.push(`错误: ${error.message}`);
  }
};

// 清除调试信息
const clearDebugInfo = () => {
  debugInfo.value = [];
};

// 清除设备缓存
const clearDeviceCache = () => {
  console.log('🗑️ 清除设备信息缓存...');
  localStorage.removeItem('deviceInfo');
  localStorage.removeItem('deviceInfoTime');
  alert('缓存已清除！请刷新页面重新获取设备信息。');
};

// 生成二维码
const generateQrCode = async (item) => {
  try {
    console.log('🔄 开始获取广告素材二维码:', item.aid);

    // 获取当前选中的应用配置来获取advertiser_id
    const selectedApp = appList.value.find(app => app.appid === selectedAppId.value);
    if (!selectedApp) {
      throw new Error('未找到应用配置信息');
    }

    // 直接使用降级方案生成基于广告ID的二维码
    try {
      const adUrl = `https://ad.oceanengine.com/material/${item.aid}`;
      const qrCodeDataURL = await QRCode.toDataURL(adUrl, {
        width: 128,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      item.qrCode = qrCodeDataURL;
      console.log('✅ 使用降级方案生成二维码');
    } catch (error) {
      console.error('❌ 生成二维码失败:', error);
      throw error;
    }

  } catch (err) {
    console.error('❌ 生成二维码失败:', err);
    alert('生成二维码失败: ' + err.message);
  }
};

// 显示二维码模态框
const showQrModalFunc = (item) => {
  currentQrItem.value = item;
  showQrModal.value = true;
};

// 显示预览二维码模态框
const showQrPreviewModalFunc = async () => {
  try {
    console.log('🔄 获取最新的广告预览二维码...');
    const qrUrl = await fetchRealAdPreviewQrCode();
    currentPreviewQrUrl.value = qrUrl;

    // 生成二维码图片用于显示
    const qrCodeDataURL = await QRCode.toDataURL(qrUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    currentPreviewQrImage.value = qrCodeDataURL;
    showQrPreviewModal.value = true;
  } catch (error) {
    console.error('❌ 显示预览二维码失败:', error);
    // 如果是配置错误，给出具体的提示
    if (error.message.includes('未配置广告ID')) {
      alert(error.message);
    } else {
      alert('获取二维码失败，请稍后重试');
    }
  }
};

// 关闭二维码模态框
const closeQrModal = () => {
  showQrModal.value = false;
  currentQrItem.value = null;
};

// 关闭预览二维码模态框
const closeQrPreviewModal = () => {
  showQrPreviewModal.value = false;
  currentPreviewQrUrl.value = '';
  currentPreviewQrImage.value = '';
};

// 下载二维码
const downloadQrCode = () => {
  if (!currentQrItem.value?.qrCode) return;

  const link = document.createElement('a');
  link.href = currentQrItem.value.qrCode;
  link.download = `ad-qr-${currentQrItem.value.aid}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 复制二维码链接
const copyQrUrl = async () => {
  if (!currentQrItem.value) return;

  // 如果有真实的二维码URL，直接复制
  if (currentQrItem.value.qrCode && currentQrItem.value.qrCode.startsWith('http')) {
    try {
      await navigator.clipboard.writeText(currentQrItem.value.qrCode);
      alert('二维码链接已复制到剪贴板');
    } catch (err) {
      // 降级方案
      const textArea = document.createElement('textarea');
      textArea.value = currentQrItem.value.qrCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('二维码链接已复制到剪贴板');
    }
  } else {
    // 生成广告素材链接
    const adUrl = `https://ad.oceanengine.com/material/${currentQrItem.value.aid}`;

    try {
      await navigator.clipboard.writeText(adUrl);
      alert('广告素材链接已复制到剪贴板');
    } catch (err) {
      // 降级方案
      const textArea = document.createElement('textarea');
      textArea.value = adUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('广告素材链接已复制到剪贴板');
    }
  }
};

// 获取真实的广告预览二维码
const fetchRealAdPreviewQrCode = async () => {
  try {
    console.log('🔄 开始获取真实的广告预览二维码...');

    // 获取当前选中的应用配置
    const selectedApp = appList.value.find(app => app.appid === selectedAppId.value);
    if (!selectedApp) {
      throw new Error('未选择有效的应用');
    }

    // 检查应用是否有广告ID配置
    if (!selectedApp.advertiser_id || !selectedApp.promotion_id) {
      throw new Error(`应用 "${selectedApp.name}" 未配置广告ID。请在游戏管理页面为该应用设置广告主ID和广告ID。`);
    }

    console.log('📋 使用应用配置:', {
      appName: selectedApp.name,
      advertiser_id: selectedApp.advertiser_id,
      promotion_id: selectedApp.promotion_id
    });

    // 使用应用配置的参数
    const params = new URLSearchParams({
      advertiser_id: selectedApp.advertiser_id,
      id_type: 'ID_TYPE_PROMOTION',
      promotion_id: selectedApp.promotion_id
    });

    const response = await fetch(`/api/douyin/ad-preview-qrcode?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ 广告预览二维码获取成功:', result);

    if (result.code === 0 && result.data?.data?.qrcode_msg_url) {
      return result.data.data.qrcode_msg_url;
    } else {
      throw new Error(result.message || '获取二维码失败');
    }

  } catch (error) {
    console.error('❌ 获取广告预览二维码失败:', error);
    // 如果是配置错误，直接抛出错误提示用户
    if (error.message.includes('未配置广告ID')) {
      throw error;
    }
    // 其他错误返回默认的预览URL作为降级方案
    return 'https://ad.oceanengine.com/mobile/render/ocean_app/preview.html?token=44juStAq2Kt5ajcxL7ZRfW0Vny5zgm28xfDEs3Mxr%2FYHn0AWeFFsQOBMKZAiBX9gwIBxSY6s6r%2Ff5wkp2v%2BPQANEq8ugqJklnZ6%2BzJsZeXGK0H9L4ygzKCeHKgLKLqjs4wwEosv3tP28%2B4eluR%2Bbl44%2FGj3rCQGe6eaF7nvgX94=&type=preview';
  }
};

// 下载预览二维码
const downloadPreviewQrCode = async () => {
  try {
    // 获取最新的二维码URL
    const qrUrl = await fetchRealAdPreviewQrCode();

    // 生成二维码图片并下载
    const qrCodeDataURL = await QRCode.toDataURL(qrUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    const link = document.createElement('a');
    link.href = qrCodeDataURL;
    link.download = 'ad-preview-qr.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log('✅ 二维码下载成功');
  } catch (error) {
    console.error('❌ 下载二维码失败:', error);
    alert('下载二维码失败: ' + error.message);
  }
};

// 复制预览二维码链接
const copyPreviewQrUrl = async () => {
  try {
    // 获取最新的二维码URL
    const previewUrl = await fetchRealAdPreviewQrCode();

    await navigator.clipboard.writeText(previewUrl);
    alert('广告预览链接已复制到剪贴板');
  } catch (err) {
    console.error('❌ 复制链接失败:', err);
    // 降级方案
    const textArea = document.createElement('textarea');
    textArea.value = 'https://ad.oceanengine.com/mobile/render/ocean_app/preview.html?token=44juStAq2Kt5ajcxL7ZRfW0Vny5zgm28xfDEs3Mxr%2FYHn0AWeFFsQOBMKZAiBX9gwIBxSY6s6r%2Ff5wkp2v%2BPQANEq8ugqJklnZ6%2BzJsZeXGK0H9L4ygzKCeHKgLKLqjs4wwEosv3tP28%2B4eluR%2Bbl44%2FGj3rCQGe6eaF7nvgX94=&type=preview';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    alert('广告预览链接已复制到剪贴板');
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



// 页面加载时初始化
onMounted(async () => {
  console.log('🚀 eCPM用户页面初始化');

  // 确保用户设备信息已获取（强制获取最新的设备信息）
  console.log('📱 开始获取用户设备信息...');
  try {
    await userStore.fetchDeviceInfo();
    console.log('📱 设备信息获取完成:', userStore.deviceInfo);
  } catch (deviceError) {
    console.warn('📱 设备信息获取失败，使用默认值:', deviceError);
    // 即使获取失败也继续执行，不阻塞页面初始化
  }

  // 加载应用列表
  await loadAppList();

  // 设置默认选中的应用
  if (appList.value.length > 0) {
    selectedAppId.value = appList.value[0].appid;
    queryParams.mp_id = appList.value[0].appid;

    // 设置默认日期为当天
    const today = new Date();
    queryParams.date_hour = today.toISOString().split('T')[0];

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

/* 调试信息面板 */
.debug-section {
  background: #f6f8fa;
  border: 1px solid #d1d9e0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
}

.debug-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.debug-header h3 {
  margin: 0;
  font-size: 16px;
  color: #24292f;
}

.debug-actions {
  display: flex;
  gap: 8px;
}

.btn-warning {
  background: #faad14;
  color: white;
}

.btn-warning:hover:not(:disabled) {
  background: #d48806;
}

.debug-content {
  max-height: 300px;
  overflow-y: auto;
  background: #ffffff;
  border: 1px solid #d1d9e0;
  border-radius: 4px;
}

.debug-item {
  padding: 8px 12px;
  border-bottom: 1px solid #f6f8fa;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.4;
}

.debug-item:last-child {
  border-bottom: none;
}

.debug-item pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
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

.btn-info {
  background: #13c2c2;
  color: white;
}

.btn-info:hover {
  background: #08979c;
}

.btn-small {
  padding: 4px 8px;
  font-size: 12px;
}

.btn-qr-preview {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.btn-qr-preview:hover:not(:disabled) {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
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

  .analysis-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .analysis-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .analysis-grid {
    grid-template-columns: 1fr;
  }

  .device-item, .city-item, .hour-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}

/* 二维码样式 */
.qr-code-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-code-image {
  width: 40px;
  height: 40px;
  cursor: pointer;
  border-radius: 4px;
  transition: transform 0.2s;
}

.qr-code-image:hover {
  transform: scale(1.1);
}


/* 二维码模态框 */
.qr-modal .modal-content {
  max-width: 400px;
}

.qr-info {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.qr-details {
  flex: 1;
}

.qr-details p {
  margin: 8px 0;
  font-size: 14px;
}

.qr-code-large {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 150px;
}

.qr-code-large-image {
  width: 150px;
  height: 150px;
  border: 2px solid #e5e6eb;
  border-radius: 8px;
}

.qr-loading {
  color: #86909c;
  font-size: 14px;
}

.qr-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  justify-content: center;
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
</style>