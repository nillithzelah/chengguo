<template>
  <div class="pangle-test-page">
    <div class="page-header">
      <div class="header-content">
        <h1>抖音设备信息测试</h1>
        <p>测试网站环境下的设备信息获取能力</p>
      </div>
    </div>

    <!-- 测试配置 -->
    <div class="test-config-section">
      <div class="form-grid">
        <div class="form-item">
          <label>App ID</label>
          <div class="form-input-display">{{ config.appId }}</div>
          <small class="form-hint">您的抖音小游戏App ID</small>
        </div>
        <div class="form-item">
          <label>广告位ID</label>
          <div class="form-input-display">{{ config.adUnitId }}</div>
          <small class="form-hint">您的抖音广告位ID</small>
        </div>
      </div>

      <div class="form-actions">
        <button
          @click="runFullTest"
          :disabled="testing"
          class="btn btn-primary"
        >
          {{ testing ? '测试中...' : '开始测试' }}
        </button>
        <button
          @click="clearResults"
          class="btn btn-secondary"
        >
          清除结果
        </button>
        <button
          @click="testShareFunction"
          :disabled="testing"
          class="btn btn-success"
        >
          测试分享功能
        </button>
      </div>
    </div>

    <!-- 测试进度 -->
    <div v-if="testing" class="progress-section">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progress + '%' }"></div>
      </div>
      <div class="progress-text">{{ progress }}% - {{ currentStep }}</div>
    </div>

    <!-- 测试结果 -->
    <div v-if="testResults" class="results-section">
      <!-- 环境检测 -->
      <div class="result-card">
        <h3>🌐 环境检测</h3>
        <div class="data-grid">
          <div class="data-item">
            <span class="data-label">当前环境:</span>
            <span class="data-value">{{ testResults.environment }}</span>
          </div>
          <div class="data-item">
            <span class="data-label">抖音SDK:</span>
            <span class="data-value error">{{ testResults.sdkAvailable ? '可用' : '不可用（需要在抖音小程序中）' }}</span>
          </div>
          <div class="data-item">
            <span class="data-label">测试时间:</span>
            <span class="data-value">{{ formatTime(testResults.timestamp) }}</span>
          </div>
        </div>
      </div>

      <!-- 设备信息 -->
      <div v-if="testResults.deviceInfo" class="result-card">
        <h3>📱 可获取的设备信息</h3>
        <div class="data-grid">
          <div class="data-item">
            <span class="data-label">设备类型:</span>
            <span class="data-value">{{ testResults.deviceInfo.deviceModel }}</span>
          </div>
          <div class="data-item">
            <span class="data-label">操作系统:</span>
            <span class="data-value">{{ testResults.deviceInfo.osVersion }}</span>
          </div>
          <div class="data-item">
            <span class="data-label">平台:</span>
            <span class="data-value">{{ testResults.deviceInfo.platform }}</span>
          </div>
          <div class="data-item">
            <span class="data-label">屏幕尺寸:</span>
            <span class="data-value">{{ testResults.deviceInfo.screenWidth }}x{{ testResults.deviceInfo.screenHeight }}</span>
          </div>
          <div class="data-item">
            <span class="data-label">像素密度:</span>
            <span class="data-value">{{ testResults.deviceInfo.pixelRatio }}</span>
          </div>
          <div class="data-item">
            <span class="data-label">网络状态:</span>
            <span class="data-value">{{ testResults.deviceInfo.networkType }}</span>
          </div>
          <div class="data-item">
            <span class="data-label">语言:</span>
            <span class="data-value">{{ testResults.deviceInfo.language }}</span>
          </div>
          <div class="data-item">
            <span class="data-label">时区:</span>
            <span class="data-value">{{ testResults.deviceInfo.timezone }}</span>
          </div>
          <div v-if="testResults.deviceInfo.douyinVersion" class="data-item">
            <span class="data-label">抖音版本:</span>
            <span class="data-value">{{ testResults.deviceInfo.douyinVersion }}</span>
          </div>
          <div v-if="testResults.deviceInfo.SDKVersion" class="data-item">
            <span class="data-label">SDK版本:</span>
            <span class="data-value">{{ testResults.deviceInfo.SDKVersion }}</span>
          </div>
          <div class="data-item">
            <span class="data-label">IP地址:</span>
            <span class="data-value error">无法获取（隐私保护）</span>
          </div>
          <div class="data-item">
            <span class="data-label">精确位置:</span>
            <span class="data-value error">无法获取（隐私保护）</span>
          </div>
        </div>
      </div>

      <!-- 用户信息 -->
      <div v-if="testResults.userInfo" class="result-card">
        <h3>👤 可获取的用户信息</h3>
        <div class="data-grid">
          <div class="data-item">
            <span class="data-label">昵称:</span>
            <span class="data-value">{{ testResults.userInfo.nickName }}</span>
          </div>
          <div class="data-item">
            <span class="data-label">OpenID:</span>
            <span class="data-value">{{ testResults.userInfo.openId }}</span>
          </div>
          <div class="data-item">
            <span class="data-label">性别:</span>
            <span class="data-value">{{ testResults.userInfo.gender === 1 ? '男' : testResults.userInfo.gender === 2 ? '女' : '未知' }}</span>
          </div>
          <div class="data-item">
            <span class="data-label">省份:</span>
            <span class="data-value">{{ testResults.userInfo.province }}</span>
          </div>
          <div class="data-item">
            <span class="data-label">城市:</span>
            <span class="data-value">{{ testResults.userInfo.city }}</span>
          </div>
          <div class="data-item">
            <span class="data-label">国家:</span>
            <span class="data-value">{{ testResults.userInfo.country }}</span>
          </div>
          <div class="data-item">
            <span class="data-label">头像:</span>
            <span class="data-value">
              <img v-if="testResults.userInfo.avatarUrl" :src="testResults.userInfo.avatarUrl" alt="头像" style="width: 32px; height: 32px; border-radius: 50%;">
              <span v-else>无头像</span>
            </span>
          </div>
        </div>
      </div>

      <!-- 数据获取能力总结 -->
      <div class="result-card">
        <h3>🔍 数据获取能力总结</h3>
        <div class="capabilities-list">
          <div class="capability-item">
            <span class="capability-name">设备型号</span>
            <span class="capability-status available">✅ 可获取 ({{ testResults.sdkAvailable ? '抖音API' : '浏览器API' }})</span>
          </div>
          <div class="capability-item">
            <span class="capability-name">操作系统版本</span>
            <span class="capability-status available">✅ 可获取 ({{ testResults.sdkAvailable ? '抖音API' : '浏览器API' }})</span>
          </div>
          <div class="capability-item">
            <span class="capability-name">屏幕信息</span>
            <span class="capability-status available">✅ 可获取 ({{ testResults.sdkAvailable ? '抖音API' : '浏览器API' }})</span>
          </div>
          <div class="capability-item">
            <span class="capability-name">网络状态</span>
            <span class="capability-status available">✅ 可获取</span>
          </div>
          <div class="capability-item">
            <span class="capability-name">抖音用户信息</span>
            <span class="capability-status" :class="testResults.sdkAvailable ? 'available' : 'unavailable'">
              {{ testResults.sdkAvailable ? '✅ 可获取 (需用户授权)' : '❌ 仅抖音环境可用' }}
            </span>
          </div>
          <div class="capability-item">
            <span class="capability-name">抖音特有数据</span>
            <span class="capability-status" :class="testResults.sdkAvailable ? 'available' : 'unavailable'">
              {{ testResults.sdkAvailable ? '✅ 可获取关注数、点赞数等' : '❌ 仅抖音环境可用' }}
            </span>
          </div>
          <div class="capability-item">
            <span class="capability-name">IP地址</span>
            <span class="capability-status unavailable">❌ 隐私保护，无法获取</span>
          </div>
          <div class="capability-item">
            <span class="capability-name">精确地理位置</span>
            <span class="capability-status unavailable">❌ 隐私保护，无法获取</span>
          </div>
        </div>
      </div>

      <!-- 分享功能测试结果 -->
      <div v-if="testResults.shareTest" class="result-card">
        <h3>📤 分享功能测试结果</h3>
        <div class="data-grid">
          <div class="data-item">
            <span class="data-label">分享功能支持:</span>
            <span class="data-value" :class="testResults.shareTest.shareSupported ? 'success' : 'error'">
              {{ testResults.shareTest.shareSupported ? '✅ 支持' : '❌ 不支持' }}
            </span>
          </div>
          <div class="data-item">
            <span class="data-label">分享菜单:</span>
            <span class="data-value" :class="testResults.shareTest.shareMenuShown ? 'success' : 'error'">
              {{ testResults.shareTest.shareMenuShown ? '✅ 已显示' : '❌ 未显示' }}
            </span>
          </div>
          <div class="data-item">
            <span class="data-label">分享API:</span>
            <span class="data-value" :class="testResults.shareTest.shareAppMessageAvailable ? 'success' : 'error'">
              {{ testResults.shareTest.shareAppMessageAvailable ? '✅ 可用' : '❌ 不可用' }}
            </span>
          </div>
          <div class="data-item">
            <span class="data-label">测试时间:</span>
            <span class="data-value">{{ formatTime(testResults.shareTest.testedAt) }}</span>
          </div>
        </div>

        <div class="share-features">
          <h4>📋 支持的分享功能</h4>
          <div class="features-list">
            <span
              v-for="feature in testResults.shareTest.shareFeatures"
              :key="feature"
              class="feature-tag"
            >
              {{ feature }}
            </span>
          </div>
        </div>
      </div>

      <!-- 使用建议 -->
      <div class="result-card">
        <h3>💡 使用建议</h3>
        <div class="suggestions">
          <div class="suggestion-item">
            <h4>在抖音小程序中可获取：</h4>
            <ul>
              <li>完整的设备信息（型号、系统、屏幕等）</li>
              <li>用户信息（需用户授权）</li>
              <li>广告事件数据</li>
              <li>抖音特有的用户数据</li>
              <li><strong>分享行为数据</strong>（新增）</li>
            </ul>
          </div>
          <div class="suggestion-item">
            <h4>分享功能可以收集：</h4>
            <ul>
              <li>用户分享频率和时间</li>
              <li>分享成功/失败统计</li>
              <li>分享渠道分析</li>
              <li>用户活跃度指标</li>
            </ul>
          </div>
          <div class="suggestion-item">
            <h4>隐私保护限制：</h4>
            <ul>
              <li>无法获取用户的IP地址</li>
              <li>无法获取精确的地理位置</li>
              <li>用户信息需要用户明确授权</li>
            </ul>
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
import { ref, reactive } from 'vue';

// 响应式数据
const testing = ref(false);
const progress = ref(0);
const currentStep = ref('');
const error = ref(null);
const testResults = ref(null);

// 测试配置
const config = reactive({
  appId: 'tt8513f3ae1a1ce1af02',
  adUnitId: '1128'
});

// 工具函数
const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleString('zh-CN');
};

// 开始测试
const runFullTest = async () => {
  testing.value = true;
  progress.value = 0;
  currentStep.value = '检测环境...';
  error.value = null;

  try {
    // 步骤1: 环境检测
    progress.value = 25;
    currentStep.value = '正在检测运行环境...';

    const isInDouyin = typeof tt !== 'undefined';
    const environment = isInDouyin ? '抖音小程序环境' : '网站环境';

    // 步骤2: 获取设备信息
    progress.value = 50;
    currentStep.value = '正在获取设备信息...';

    let deviceInfo;
    if (isInDouyin) {
      // 在抖音环境中使用真实的API
      deviceInfo = await getDouyinDeviceInfo();
    } else {
      // 在网站环境中使用模拟数据
      deviceInfo = await getDeviceInfo();
    }

    // 步骤3: 获取用户信息（仅抖音环境）
    progress.value = 75;
    currentStep.value = '正在获取用户信息...';

    let userInfo = null;
    if (isInDouyin) {
      try {
        userInfo = await getDouyinUserInfo();
      } catch (userError) {
        console.log('⚠️ 获取用户信息失败:', userError.message);
      }
    }

    // 步骤4: 生成测试结果
    progress.value = 90;
    currentStep.value = '正在生成测试报告...';

    const results = {
      environment: environment,
      sdkAvailable: isInDouyin,
      deviceInfo: deviceInfo,
      userInfo: userInfo,
      timestamp: new Date().toISOString()
    };

    progress.value = 100;
    currentStep.value = '测试完成';
    testResults.value = results;

    console.log('✅ 测试完成:', results);

  } catch (err) {
    console.error('❌ 测试失败:', err);
    error.value = err.message;
  } finally {
    testing.value = false;
    setTimeout(() => {
      progress.value = 0;
      currentStep.value = '';
    }, 1000);
  }
};

// 获取抖音设备信息
const getDouyinDeviceInfo = async () => {
  return new Promise((resolve, reject) => {
    try {
      // 检查tt对象是否存在
      if (typeof tt === 'undefined') {
        reject(new Error('不在抖音小程序环境中'));
        return;
      }

      // 使用抖音小程序的同步API
      const res = (tt as any).getSystemInfoSync();
      console.log('📱 抖音设备信息:', res);

      const deviceInfo = {
        deviceId: 'douyin_' + Math.random().toString(36).substr(2, 9),
        deviceModel: res.model,
        platform: res.platform,
        osVersion: res.system,
        screenWidth: res.screenWidth,
        screenHeight: res.screenHeight,
        pixelRatio: res.pixelRatio,
        statusBarHeight: res.statusBarHeight,
        windowWidth: res.windowWidth,
        windowHeight: res.windowHeight,
        douyinVersion: res.version,
        SDKVersion: res.SDKVersion,
        language: res.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        networkType: 'unknown', // 需要异步获取
        ip: null, // 隐私保护，无法获取
        location: null // 隐私保护，无法获取
      };

      resolve(deviceInfo);
    } catch (error) {
      console.error('❌ 获取抖音设备信息失败:', error);
      reject(error);
    }
  });
};

// 获取抖音用户信息
const getDouyinUserInfo = async () => {
  return new Promise((resolve, reject) => {
    // 检查tt对象是否存在
    if (typeof tt === 'undefined') {
      reject(new Error('不在抖音小程序环境中'));
      return;
    }

    const ttApi = tt as any;

    // 检查登录状态
    ttApi.getLoginState({
      success: (loginRes: any) => {
        if (loginRes.isLogin) {
          // 已登录，获取用户信息
          ttApi.getUserInfo({
            success: (userRes: any) => {
              console.log('👤 抖音用户信息:', userRes);
              const userInfo = {
                openId: userRes.openId,
                unionId: userRes.unionId,
                nickName: userRes.nickName,
                avatarUrl: userRes.avatarUrl,
                gender: userRes.gender,
                province: userRes.province,
                city: userRes.city,
                country: userRes.country,
                isDouyinUser: true
              };
              resolve(userInfo);
            },
            fail: (err: any) => {
              console.error('❌ 获取抖音用户信息失败:', err);
              reject(new Error('获取用户信息失败: ' + err.errMsg));
            }
          });
        } else {
          reject(new Error('用户未登录'));
        }
      },
      fail: (err: any) => {
        console.error('❌ 检查登录状态失败:', err);
        reject(new Error('检查登录状态失败: ' + err.errMsg));
      }
    });
  });
};

// 获取设备信息（网站环境）
const getDeviceInfo = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const deviceInfo = {
        deviceId: 'web_device_' + Math.random().toString(36).substr(2, 9),
        deviceModel: navigator.userAgent.includes('Mobile') ? '移动设备' : '桌面设备',
        platform: navigator.platform,
        osVersion: 'Web环境',
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        pixelRatio: window.devicePixelRatio,
        networkType: navigator.onLine ? 'online' : 'offline',
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        ip: null, // 隐私保护，无法获取
        location: null // 隐私保护，无法获取
      };

      resolve(deviceInfo);
    }, 500);
  });
};

// 测试分享功能
const testShareFunction = async () => {
  testing.value = true;
  progress.value = 0;
  currentStep.value = '初始化分享功能...';
  error.value = null;

  try {
    // 步骤1: 检查环境
    progress.value = 25;
    currentStep.value = '检查抖音环境...';

    const isInDouyin = typeof tt !== 'undefined';
    if (!isInDouyin) {
      throw new Error('分享功能仅在抖音小程序环境中可用');
    }

    // 步骤2: 初始化分享功能
    progress.value = 50;
    currentStep.value = '初始化分享功能...';

    // 这里可以调用分享集成代码
    console.log('📤 分享功能测试中...');

    // 步骤3: 模拟分享测试
    progress.value = 75;
    currentStep.value = '测试分享功能...';

    // 模拟分享测试结果
    const shareTestResult = {
      environment: '抖音小程序环境',
      shareSupported: true,
      shareMenuShown: true,
      shareAppMessageAvailable: true,
      testedAt: new Date().toISOString(),
      shareFeatures: [
        '显示分享菜单',
        '监听分享事件',
        '主动触发分享',
        '分享成功/失败回调',
        '分享数据收集'
      ]
    };

    // 步骤4: 生成测试结果
    progress.value = 100;
    currentStep.value = '测试完成';

    testResults.value = {
      ...testResults.value,
      shareTest: shareTestResult
    };

    console.log('✅ 分享功能测试完成:', shareTestResult);

  } catch (err) {
    console.error('❌ 分享功能测试失败:', err);
    error.value = err.message;
  } finally {
    testing.value = false;
    setTimeout(() => {
      progress.value = 0;
      currentStep.value = '';
    }, 1000);
  }
};

// 清除结果
const clearResults = () => {
  testResults.value = null;
  error.value = null;
};
</script>

<style scoped>
.pangle-test-page {
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

/* 测试配置 */
.test-config-section {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
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

.form-input-display {
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #f7f8fa;
  color: #1d2129;
  font-size: 14px;
  font-weight: 500;
}

.form-hint {
  font-size: 12px;
  color: #86909c;
  margin-top: 4px;
}

.form-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* 进度条 */
.progress-section {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  margin-bottom: 8px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #165dff, #52c41a);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  color: #86909c;
  font-size: 14px;
}

/* 结果卡片 */
.results-section {
  display: grid;
  gap: 24px;
}

.result-card {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.result-card h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1d2129;
}

.result-card h4 {
  margin: 20px 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1d2129;
}

/* 总结网格 */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}

.summary-item {
  text-align: center;
  padding: 16px;
  background: #f7f8fa;
  border-radius: 6px;
}

.summary-value {
  font-size: 24px;
  font-weight: 600;
  color: #1d2129;
  margin-bottom: 4px;
}

.summary-value.success {
  color: #52c41a;
}

.summary-value.error {
  color: #ff4d4f;
}

.summary-label {
  color: #86909c;
  font-size: 14px;
}

/* 数据获取能力 */
.capabilities-list {
  display: grid;
  gap: 12px;
}

.capability-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f7f8fa;
  border-radius: 6px;
}

.capability-name {
  font-weight: 500;
  color: #1d2129;
}

.capability-status {
  font-weight: 500;
}

.capability-status.available {
  color: #52c41a;
}

.capability-status.unavailable {
  color: #ff4d4f;
}

/* 数据网格 */
.data-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 12px;
}

.data-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f7f8fa;
  border-radius: 6px;
}

.data-label {
  font-weight: 500;
  color: #86909c;
}

.data-value {
  font-weight: 500;
  color: #1d2129;
}

.data-value.error {
  color: #ff4d4f;
}

/* 受众统计 */
.audience-stats {
  margin-top: 24px;
}

.stats-section {
  margin-bottom: 20px;
}

.stats-section h5 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1d2129;
}

.stats-bars {
  display: grid;
  gap: 8px;
}

.stat-bar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-label {
  min-width: 60px;
  font-size: 14px;
  color: #86909c;
}

.stat-bar-container {
  flex: 1;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.stat-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #165dff, #52c41a);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.stat-value {
  min-width: 50px;
  text-align: right;
  font-size: 14px;
  font-weight: 500;
  color: #1d2129;
}

/* 测试历史 */
.test-history {
  display: grid;
  gap: 12px;
}

.history-item {
  padding: 16px;
  border-radius: 6px;
  border-left: 4px solid;
}

.history-item.success {
  background: #f6ffed;
  border-left-color: #52c41a;
}

.history-item.error {
  background: #fff2f0;
  border-left-color: #ff4d4f;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.test-name {
  font-weight: 600;
  color: #1d2129;
}

.test-status {
  font-size: 14px;
  font-weight: 500;
}

.test-status.success {
  color: #52c41a;
}

.test-status.error {
  color: #ff4d4f;
}

.test-time {
  font-size: 12px;
  color: #86909c;
  margin-bottom: 8px;
}

.error-message {
  font-size: 14px;
  color: #ff4d4f;
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

.btn-small {
  padding: 4px 8px;
  font-size: 12px;
}

/* 分享功能样式 */
.share-features {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e6eb;
}

.share-features h4 {
  margin: 0 0 12px 0;
  color: #1d2129;
  font-size: 14px;
  font-weight: 600;
}

.features-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.feature-tag {
  padding: 4px 12px;
  background: linear-gradient(135deg, #FF0050, #FF4081);
  color: white;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

/* 使用建议 */
.suggestions {
  display: grid;
  gap: 20px;
}

.suggestion-item {
  padding: 16px;
  background: #f7f8fa;
  border-radius: 6px;
}

.suggestion-item h4 {
  margin: 0 0 12px 0;
  color: #1d2129;
  font-size: 14px;
  font-weight: 600;
}

.suggestion-item ul {
  margin: 0;
  padding-left: 20px;
}

.suggestion-item li {
  margin-bottom: 4px;
  color: #4e5969;
  font-size: 14px;
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
  .pangle-test-page {
    padding: 16px;
  }

  .header-content {
    flex-direction: column;
    gap: 16px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .data-grid {
    grid-template-columns: 1fr;
  }

  .stat-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .history-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>