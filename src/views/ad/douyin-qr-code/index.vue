<template>
  <div class="douyin-qr-page">
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1>抖音小程序游戏二维码创建</h1>
          <p>创建抖音小程序游戏的二维码，用于分享和推广</p>
        </div>
      </div>
    </div>

    <!-- 创建表单 -->
    <div class="create-section">
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
          <label>目标平台</label>
          <select v-model="qrParams.appname" class="form-input">
            <option value="douyin">抖音</option>
            <option value="toutiao">头条</option>
          </select>
        </div>

        <div class="form-item">
          <label>页面路径</label>
          <input
            v-model="qrParams.path"
            type="text"
            placeholder="例如: pages/index/index"
            class="form-input"
          />
        </div>

        <div class="form-item">
          <label>二维码宽度</label>
          <select v-model="qrParams.width" class="form-input">
            <option :value="280">280px (小)</option>
            <option :value="430">430px (中)</option>
            <option :value="1280">1280px (大)</option>
          </select>
        </div>

        <div class="form-item">
          <label>线条颜色</label>
          <input
            v-model="lineColorHex"
            type="color"
            class="form-input color-input"
            @change="updateLineColor"
          />
        </div>

        <div class="form-item checkbox-item">
          <label class="checkbox-label">
            <input
              v-model="qrParams.auto_color"
              type="checkbox"
              class="checkbox-input"
            />
            <span class="checkbox-text">自动配置线条颜色</span>
          </label>
        </div>

        <div class="form-item checkbox-item">
          <label class="checkbox-label">
            <input
              v-model="qrParams.is_hyaline"
              type="checkbox"
              class="checkbox-input"
            />
            <span class="checkbox-text">透明背景</span>
          </label>
        </div>
      </div>

      <div class="form-actions">
        <button
          @click="createQrCode"
          :disabled="loading || !selectedAppId"
          class="btn btn-primary"
        >
          {{ loading ? '创建中...' : '创建二维码' }}
        </button>
        <button
          @click="resetForm"
          class="btn btn-secondary btn-small"
        >
          重置
        </button>
      </div>
    </div>

    <!-- 生成结果 -->
    <div v-if="qrResult" class="result-section">
      <div class="result-header">
        <h3>二维码创建成功</h3>
      </div>

      <div class="result-content">
        <div class="qr-display">
          <div class="qr-code-large">
            <img
              v-if="qrResult.qr_code_url"
              :src="qrResult.qr_code_url"
              alt="抖音小程序游戏二维码"
              class="qr-code-large-image"
            />
            <div v-else class="qr-loading">二维码加载中...</div>
          </div>
        </div>

        <div class="qr-info">
          <div class="info-item">
            <strong>应用ID:</strong> {{ qrResult.app_id }}
          </div>
          <div class="info-item">
            <strong>目标平台:</strong> {{ qrResult.appname === 'douyin' ? '抖音' : qrResult.appname === 'toutiao' ? '头条' : qrResult.appname }}
          </div>
          <div class="info-item">
            <strong>页面路径:</strong> {{ qrResult.path || '默认页面' }}
          </div>
          <div class="info-item">
            <strong>二维码尺寸:</strong> {{ qrResult.width }}px
          </div>
          <div class="info-item">
            <strong>创建时间:</strong> {{ formatDateTime(qrResult.created_at) }}
          </div>
        </div>

        <div class="qr-actions">
          <button @click="downloadQrCode" class="btn btn-primary" :disabled="!qrResult.qr_code_url">
            下载二维码
          </button>
          <button @click="copyQrUrl" class="btn btn-secondary" :disabled="!qrResult.qr_code_url">
            复制链接
          </button>
          <button @click="shareQrCode" class="btn btn-info" :disabled="!qrResult.qr_code_url">
            分享二维码
          </button>
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
import { ref, reactive, onMounted } from 'vue';
import QRCode from 'qrcode';

// 日志函数
const logger = {
  debug: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🐛 [DEBUG] ${message}`, ...args);
    }
  },
  info: (message: string, ...args: any[]) => {
    console.log(`ℹ️  [INFO] ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`⚠️  [WARN] ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`❌ [ERROR] ${message}`, ...args);
  }
};

// 响应式数据
const loading = ref(false);
const error = ref(null);
const qrResult = ref(null);

// 应用列表管理
const appList = ref([]);

// 选中的应用ID
const selectedAppId = ref('');

// 二维码参数
const qrParams = reactive({
  path: '',
  width: 430,
  auto_color: false,
  line_color: { r: 0, g: 0, b: 0 },
  is_hyaline: false,
  appname: 'douyin'
});

// 线条颜色十六进制值
const lineColorHex = ref('#000000');

// 工具函数
const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return '-';
  return dateTimeStr.replace('T', ' ').substring(0, 19);
};

// 更新线条颜色
const updateLineColor = () => {
  const hex = lineColorHex.value;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  qrParams.line_color = { r, g, b };
};

// 初始化线条颜色
const initLineColor = () => {
  const { r, g, b } = qrParams.line_color;
  lineColorHex.value = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

// 应用选择变化处理
const onAppChange = () => {
  console.log('🔄 切换应用:', selectedAppId.value);
};

// 加载应用列表
const loadAppList = async () => {
  try {
    logger.info('开始加载应用列表');

    const allApps = [];

    // 从数据库获取游戏列表
    try {
      console.log('📡 从数据库获取游戏列表...');

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

          for (const game of gameResult.data.games) {
            allApps.push({
              appid: game.appid,
              appSecret: game.appSecret || game.app_secret || '',
              name: game.name,
              owner: 'admin',
              validated: game.validated,
              validatedAt: game.validated_at,
              created_at: game.created_at,
              advertiser_id: game.advertiser_id,
              promotion_id: game.promotion_id
            });
          }
        }
      } else {
        console.log('⚠️ 从数据库获取游戏失败，使用默认应用');
      }
    } catch (dbError) {
      console.error('❌ 从数据库获取游戏出错:', dbError);
    }

    // 如果没有应用，添加默认应用
    if (allApps.length === 0) {
      allApps.push({
        appid: 'tt8c62fadf136c334702',
        appSecret: '7ad00307b2596397ceeee3560ca8bfc9b3622476',
        name: '默认应用',
        owner: 'admin'
      });
    }

    console.log('📋 最终加载的应用列表:', allApps);
    appList.value = allApps;
  } catch (err) {
    console.error('❌ 加载应用列表失败:', err);
    appList.value = [{
      appid: 'tt8c62fadf136c334702',
      appSecret: '7ad00307b2596397ceeee3560ca8bfc9b3622476',
      name: '默认应用',
      owner: 'admin'
    }];
  }
};

// 创建二维码
const createQrCode = async () => {
  if (!selectedAppId.value) {
    alert('请先选择应用');
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    console.log('🚀 开始创建抖音小程序游戏二维码...');

    // 获取选中应用的appSecret
    const selectedApp = appList.value.find(app => app.appid === selectedAppId.value);
    const appSecret = selectedApp?.appSecret || '';

    if (!appSecret) {
      throw new Error('未找到应用的密钥信息，请检查应用配置');
    }

    // 步骤1: 先获取access_token（通过测试连接API）
    console.log('📍 步骤1: 获取access_token');

    const testConnectionData = {
      appid: selectedAppId.value,
      secret: appSecret
    };

    console.log('📤 测试连接请求参数:', { appid: selectedAppId.value, secret: appSecret });

    const testResponse = await fetch('/api/douyin/test-connection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testConnectionData)
    });

    if (!testResponse.ok) {
      throw new Error(`获取access_token失败: ${testResponse.status}`);
    }

    const testResult = await testResponse.json();
    console.log('✅ 测试连接响应:', testResult);

    if (testResult.code !== 0 || !testResult.data?.minigame_access_token) {
      throw new Error(testResult.message || '获取access_token失败');
    }

    const accessToken = testResult.data.minigame_access_token;
    console.log('✅ 获取access_token成功');

    // 步骤2: 使用获取的access_token创建二维码
    console.log('📍 步骤2: 创建二维码');

    const requestData = {
      access_token: accessToken,
      appname: qrParams.appname || 'douyin', // 确保appname不为null或空字符串
      path: qrParams.path,
      width: qrParams.width,
      auto_color: qrParams.auto_color,
      line_color: qrParams.line_color,
      is_hyaline: qrParams.is_hyaline
    };

    console.log('📤 二维码创建请求参数:', requestData);

    const response = await fetch('/api/douyin/mini-game/create-qr-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status}`);
    }

    // 检查响应类型
    const contentType = response.headers.get('content-type');
    console.log('📋 响应Content-Type:', contentType);

    if (contentType && contentType.includes('image/png')) {
      // 处理二进制PNG响应
      console.log('🖼️ 检测到PNG图像响应');
      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);

      qrResult.value = {
        app_id: selectedAppId.value,
        appname: qrParams.appname,
        path: qrParams.path,
        width: qrParams.width,
        qr_code_url: imageUrl,
        created_at: new Date().toISOString(),
        is_binary: true
      };
      console.log('✅ 二维码创建成功（二进制响应）');
    } else {
      // 处理JSON响应
      const result = await response.json();
      console.log('✅ 二维码创建API响应:', result);

      if (result.code === 0 && result.data) {
        qrResult.value = result.data;
        console.log('✅ 二维码创建成功');
      } else {
        throw new Error(result.message || '创建二维码失败');
      }
    }

  } catch (err) {
    console.error('❌ 创建二维码失败:', err);
    error.value = err.message || '创建二维码失败，请稍后重试';
  } finally {
    loading.value = false;
  }
};

// 下载二维码
const downloadQrCode = async () => {
  if (!qrResult.value?.qr_code_url) return;

  try {
    // 创建下载链接
    const link = document.createElement('a');
    link.href = qrResult.value.qr_code_url;
    link.download = `douyin-mini-game-qr-${selectedAppId.value}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log('✅ 二维码下载成功');
  } catch (error) {
    console.error('❌ 下载二维码失败:', error);
    alert('下载二维码失败: ' + error.message);
  }
};

// 复制二维码链接
const copyQrUrl = async () => {
  if (!qrResult.value?.qr_code_url) return;

  try {
    await navigator.clipboard.writeText(qrResult.value.qr_code_url);
    alert('二维码链接已复制到剪贴板');
  } catch (err) {
    // 降级方案
    const textArea = document.createElement('textarea');
    textArea.value = qrResult.value.qr_code_url;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    alert('二维码链接已复制到剪贴板');
  }
};

// 分享二维码
const shareQrCode = () => {
  if (!qrResult.value?.qr_code_url) return;

  const platformName = qrResult.value.appname === 'douyin' ? '抖音' : qrResult.value.appname === 'toutiao' ? '头条' : qrResult.value.appname;
  const shareText = `${platformName}小程序游戏二维码\n应用ID: ${qrResult.value.app_id}\n页面路径: ${qrResult.value.path || '默认页面'}\n二维码链接: ${qrResult.value.qr_code_url}`;

  try {
    if (navigator.share) {
      navigator.share({
        title: `${platformName}小程序游戏二维码`,
        text: shareText,
        url: qrResult.value.qr_code_url
      });
    } else {
      // 降级方案：复制到剪贴板
      navigator.clipboard.writeText(shareText).then(() => {
        alert('二维码信息已复制到剪贴板');
      });
    }
  } catch (error) {
    console.error('❌ 分享失败:', error);
    alert('分享失败，请手动复制链接');
  }
};

// 重置表单
const resetForm = () => {
  selectedAppId.value = '';
  qrParams.path = '';
  qrParams.width = 430;
  qrParams.auto_color = false;
  qrParams.line_color = { r: 0, g: 0, b: 0 };
  qrParams.is_hyaline = false;
  qrParams.appname = 'douyin';
  initLineColor();
  qrResult.value = null;
  error.value = null;
};

// 页面加载时初始化
onMounted(async () => {
  console.log('🚀 抖音二维码创建页面初始化');

  // 初始化线条颜色
  initLineColor();

  // 加载应用列表
  await loadAppList();

  // 设置默认选中的应用
  if (appList.value.length > 0) {
    selectedAppId.value = appList.value[0].appid;
  }
});
</script>

<style scoped>
.douyin-qr-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
  border-radius: 16px;
  box-shadow: inset 0 0 50px rgba(0, 0, 0, 0.05);
}

.page-header {
  margin-bottom: 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 24px;
  color: white;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
}

.page-header h1 {
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-header h1::before {
  content: "📱";
  font-size: 32px;
}

.page-header p {
  margin: 0;
  opacity: 0.9;
  font-size: 16px;
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

/* 创建表单 */
.create-section {
  background: linear-gradient(135deg, #fff 0%, #f8f9ff 100%);
  border-radius: 12px;
  padding: 28px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(102, 126, 234, 0.1);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.form-item {
  display: flex;
  flex-direction: column;
}

.form-item.checkbox-item {
  justify-content: center;
}

.form-item label {
  display: block;
  font-weight: 600;
  color: #1d2129;
  margin-bottom: 10px;
  font-size: 14px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: normal;
}

.checkbox-input {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.checkbox-text {
  font-size: 14px;
  color: #1d2129;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e8e8e8;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
  background: white;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  transform: translateY(-1px);
}

.form-input select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
}

.color-input {
  height: 48px;
  cursor: pointer;
}

.form-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

/* 结果显示 */
.result-section {
  background: linear-gradient(135deg, #fff 0%, #f8f9ff 100%);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(102, 126, 234, 0.1);
  overflow: hidden;
}

.result-header {
  padding: 24px 32px;
  border-bottom: 1px solid rgba(102, 126, 234, 0.1);
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
}

.result-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #1d2129;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.result-content {
  padding: 24px 32px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  align-items: start;
}

.qr-display {
  display: flex;
  justify-content: center;
}

.qr-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-item {
  font-size: 14px;
  color: #4e5969;
  line-height: 1.5;
}

.qr-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  justify-content: center;
  flex-wrap: wrap;
}

/* 二维码样式 */
.qr-code-large {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.qr-code-large-image {
  width: 200px;
  height: 200px;
  border: 2px solid #e5e6eb;
  border-radius: 8px;
}

.qr-loading {
  color: #86909c;
  font-size: 14px;
}

/* 按钮样式 */
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
  color: #1d2129;
  border: 1px solid #d9d9d9;
}

.btn-secondary:hover {
  background: linear-gradient(135deg, #e8e8e8 0%, #d0d0d0 100%);
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
}

.btn-info {
  background: linear-gradient(135deg, #13c2c2 0%, #08979c 100%);
  color: white;
}

.btn-info:hover:not(:disabled) {
  background: linear-gradient(135deg, #08979c 0%, #006d75 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(19, 194, 194, 0.4);
}

.btn-small {
  padding: 6px 12px;
  font-size: 12px;
  border-radius: 6px;
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
  .douyin-qr-page {
    padding: 16px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .result-content {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .qr-code-large-image {
    width: 150px;
    height: 150px;
  }
}
</style>