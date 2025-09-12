<template>
  <div class="share-test-page">
    <div class="page-header">
      <div class="header-content">
        <h1>抖音分享功能测试</h1>
        <p>测试抖音小程序的分享功能，收集用户分享行为数据</p>
      </div>
    </div>

    <!-- 分享功能状态 -->
    <div class="status-section">
      <div class="status-card">
        <h3>🔗 分享功能状态</h3>
        <div class="status-grid">
          <div class="status-item">
            <span class="status-label">环境检测:</span>
            <span class="status-value" :class="shareStatus.environment === '抖音小程序' ? 'success' : 'warning'">
              {{ shareStatus.environment }}
            </span>
          </div>
          <div class="status-item">
            <span class="status-label">分享支持:</span>
            <span class="status-value" :class="shareStatus.supported ? 'success' : 'error'">
              {{ shareStatus.supported ? '✅ 支持' : '❌ 不支持' }}
            </span>
          </div>
          <div class="status-item">
            <span class="status-label">菜单状态:</span>
            <span class="status-value" :class="shareStatus.menuShown ? 'success' : 'warning'">
              {{ shareStatus.menuShown ? '已显示' : '未显示' }}
            </span>
          </div>
          <div class="status-item">
            <span class="status-label">分享事件:</span>
            <span class="status-value">{{ shareStats.totalShares }} 次</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 分享测试操作 -->
    <div class="test-section">
      <div class="test-card">
        <h3>🧪 分享功能测试</h3>
        <div class="test-controls">
          <button
            @click="initializeShare"
            :disabled="initializing"
            class="btn btn-primary"
          >
            {{ initializing ? '初始化中...' : '初始化分享功能' }}
          </button>
          <button
            @click="testShare"
            :disabled="!shareStatus.supported || testing"
            class="btn btn-success"
          >
            {{ testing ? '分享中...' : '测试主动分享' }}
          </button>
          <button
            @click="createShareButton"
            :disabled="!shareStatus.supported"
            class="btn btn-info"
          >
            创建分享按钮
          </button>
          <button
            @click="exportShareData"
            :disabled="shareStats.totalShares === 0"
            class="btn btn-secondary"
          >
            导出分享数据
          </button>
        </div>
      </div>
    </div>

    <!-- 分享按钮容器 -->
    <div id="share-button-container" class="share-container">
      <!-- 动态创建的分享按钮会出现在这里 -->
    </div>

    <!-- 分享统计数据 -->
    <div v-if="shareStats.totalShares > 0" class="stats-section">
      <div class="stats-card">
        <h3>📊 分享统计数据</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">{{ shareStats.totalShares }}</div>
            <div class="stat-label">总分享次数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value success">{{ shareStats.successfulShares }}</div>
            <div class="stat-label">成功分享</div>
          </div>
          <div class="stat-item">
            <div class="stat-value error">{{ shareStats.failedShares }}</div>
            <div class="stat-label">失败分享</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ shareStats.shareRate }}%</div>
            <div class="stat-label">分享成功率</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分享事件记录 -->
    <div v-if="shareEvents.length > 0" class="events-section">
      <div class="events-card">
        <h3>📝 分享事件记录</h3>
        <div class="events-list">
          <div
            v-for="(event, index) in shareEvents.slice(-10)"
            :key="index"
            class="event-item"
            :class="{ success: event.eventType.includes('success'), error: event.eventType.includes('fail') }"
          >
            <div class="event-header">
              <span class="event-type">{{ getEventTypeText(event.eventType) }}</span>
              <span class="event-time">{{ formatTime(event.timestamp) }}</span>
            </div>
            <div class="event-details">
              <div class="event-info">
                <span>分享标题: {{ event.shareOptions?.title || '默认标题' }}</span>
                <span>设备: {{ event.deviceInfo?.model || '未知' }}</span>
              </div>
              <div v-if="event.error" class="event-error">
                错误: {{ event.error }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分享功能说明 -->
    <div class="info-section">
      <div class="info-card">
        <h3>📚 分享功能说明</h3>
        <div class="info-content">
          <div class="info-item">
            <h4>🎯 分享功能特性</h4>
            <ul>
              <li><strong>被动分享</strong>: 用户点击右上角分享按钮</li>
              <li><strong>主动分享</strong>: 代码主动触发分享</li>
              <li><strong>分享监听</strong>: 监听分享成功/失败事件</li>
              <li><strong>数据收集</strong>: 收集分享行为数据</li>
              <li><strong>统计分析</strong>: 分析分享效果和用户活跃度</li>
            </ul>
          </div>

          <div class="info-item">
            <h4>📊 可收集的数据</h4>
            <ul>
              <li>分享时间和频率</li>
              <li>分享成功/失败状态</li>
              <li>分享内容和渠道</li>
              <li>用户设备信息</li>
              <li>分享行为模式</li>
            </ul>
          </div>

          <div class="info-item">
            <h4>💡 使用场景</h4>
            <ul>
              <li>游戏通关后分享战绩</li>
              <li>邀请好友一起玩游戏</li>
              <li>分享精彩游戏时刻</li>
              <li>活动推广和拉新</li>
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
import { ref, reactive, onMounted } from 'vue';

// 响应式数据
const initializing = ref(false);
const testing = ref(false);
const error = ref(null);
const shareEvents = ref([]);
const shareStats = reactive({
  totalShares: 0,
  successfulShares: 0,
  failedShares: 0,
  shareRate: '0.0'
});

const shareStatus = reactive({
  environment: '检测中...',
  supported: false,
  menuShown: false
});

// 工具函数
const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleString('zh-CN');
};

const getEventTypeText = (eventType) => {
  const typeMap = {
    'success': '分享成功',
    'fail': '分享失败',
    'manual_success': '主动分享成功',
    'manual_fail': '主动分享失败'
  };
  return typeMap[eventType] || eventType;
};

// 初始化分享功能
const initializeShare = async () => {
  initializing.value = true;
  error.value = null;

  try {
    // 检测环境
    const isInDouyin = typeof tt !== 'undefined';
    shareStatus.environment = isInDouyin ? '抖音小程序' : '非抖音环境';

    if (!isInDouyin) {
      shareStatus.supported = false;
      throw new Error('分享功能仅在抖音小程序环境中可用');
    }

    // 初始化分享功能（这里是模拟，实际使用需要集成分享SDK）
    console.log('🔗 初始化分享功能...');

    // 模拟显示分享菜单
    shareStatus.menuShown = true;
    shareStatus.supported = true;

    console.log('✅ 分享功能初始化成功');

  } catch (err) {
    console.error('❌ 分享功能初始化失败:', err);
    error.value = err.message;
  } finally {
    initializing.value = false;
  }
};

// 测试主动分享
const testShare = async () => {
  if (!shareStatus.supported) {
    error.value = '分享功能不可用，请先初始化';
    return;
  }

  testing.value = true;
  error.value = null;

  try {
    console.log('📤 测试主动分享...');

    // 这里是模拟分享，实际使用需要调用抖音分享API
    const mockResult = {
      eventType: 'manual_success',
      timestamp: new Date().toISOString(),
      shareOptions: {
        title: '测试分享',
        desc: '这是一个分享功能测试'
      },
      deviceInfo: {
        model: 'Test Device'
      }
    };

    // 记录分享事件
    shareEvents.value.push(mockResult);
    updateShareStats();

    console.log('✅ 分享测试成功');

  } catch (err) {
    console.error('❌ 分享测试失败:', err);
    error.value = err.message;

    // 记录失败事件
    const failEvent = {
      eventType: 'manual_fail',
      timestamp: new Date().toISOString(),
      error: err.message
    };
    shareEvents.value.push(failEvent);
    updateShareStats();

  } finally {
    testing.value = false;
  }
};

// 创建分享按钮
const createShareButton = () => {
  if (!shareStatus.supported) {
    error.value = '分享功能不可用';
    return;
  }

  const container = document.getElementById('share-button-container');
  if (!container) return;

  // 清除现有按钮
  container.innerHTML = '';

  // 创建新按钮
  const button = document.createElement('button');
  button.innerHTML = '🚀 点击分享给朋友';
  button.className = 'dynamic-share-btn';
  button.style.cssText = `
    padding: 15px 30px;
    background: linear-gradient(135deg, #FF0050, #FF4081);
    color: white;
    border: none;
    border-radius: 25px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(255, 0, 80, 0.3);
    transition: all 0.3s ease;
    margin: 20px 0;
  `;

  button.addEventListener('click', testShare);
  container.appendChild(button);

  console.log('✅ 分享按钮已创建');
};

// 更新分享统计
const updateShareStats = () => {
  const total = shareEvents.value.length;
  const successful = shareEvents.value.filter(e => e.eventType.includes('success')).length;
  const failed = total - successful;

  shareStats.totalShares = total;
  shareStats.successfulShares = successful;
  shareStats.failedShares = failed;
  shareStats.shareRate = total > 0 ? ((successful / total) * 100).toFixed(1) : '0.0';
};

// 导出分享数据
const exportShareData = () => {
  if (shareEvents.value.length === 0) {
    error.value = '没有分享数据可导出';
    return;
  }

  try {
    const exportData = {
      summary: shareStats,
      events: shareEvents.value,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `share-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('✅ 分享数据已导出');

  } catch (err) {
    console.error('❌ 导出失败:', err);
    error.value = '导出失败: ' + err.message;
  }
};

// 页面加载时初始化
onMounted(() => {
  console.log('🚀 分享测试页面加载');
  // 自动检测环境
  setTimeout(() => {
    const isInDouyin = typeof tt !== 'undefined';
    shareStatus.environment = isInDouyin ? '抖音小程序' : '非抖音环境';
    shareStatus.supported = isInDouyin;
  }, 1000);
});
</script>

<style scoped>
.share-test-page {
  max-width: 1000px;
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

.status-section, .test-section, .stats-section, .events-section, .info-section {
  margin-bottom: 24px;
}

.status-card, .test-card, .stats-card, .events-card, .info-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.status-card h3, .test-card h3, .stats-card h3, .events-card h3, .info-card h3 {
  margin: 0 0 16px 0;
  color: #1d2129;
  font-size: 16px;
  font-weight: 600;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f7f8fa;
  border-radius: 6px;
}

.status-label {
  font-weight: 500;
  color: #1d2129;
}

.status-value {
  font-weight: 600;
}

.status-value.success {
  color: #52c41a;
}

.status-value.error {
  color: #ff4d4f;
}

.status-value.warning {
  color: #faad14;
}

.test-controls {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.share-container {
  margin: 20px 0;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: #f7f8fa;
  border-radius: 6px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #1d2129;
  margin-bottom: 4px;
}

.stat-value.success {
  color: #52c41a;
}

.stat-value.error {
  color: #ff4d4f;
}

.stat-label {
  color: #86909c;
  font-size: 14px;
}

.events-list {
  max-height: 400px;
  overflow-y: auto;
}

.event-item {
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 6px;
  border-left: 4px solid;
}

.event-item.success {
  background: #f6ffed;
  border-left-color: #52c41a;
}

.event-item.error {
  background: #fff2f0;
  border-left-color: #ff4d4f;
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.event-type {
  font-weight: 600;
  color: #1d2129;
}

.event-time {
  font-size: 12px;
  color: #86909c;
}

.event-details {
  font-size: 14px;
  color: #4e5969;
}

.event-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}

.event-error {
  color: #ff4d4f;
  font-size: 12px;
}

.info-content {
  display: grid;
  gap: 20px;
}

.info-item h4 {
  margin: 0 0 12px 0;
  color: #1d2129;
  font-size: 14px;
  font-weight: 600;
}

.info-item ul {
  margin: 0;
  padding-left: 20px;
}

.info-item li {
  margin-bottom: 4px;
  color: #4e5969;
  font-size: 14px;
}

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

@media (max-width: 768px) {
  .share-test-page {
    padding: 16px;
  }

  .header-content {
    flex-direction: column;
    gap: 16px;
  }

  .status-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .test-controls {
    flex-direction: column;
  }

  .event-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .info-content {
    grid-template-columns: 1fr;
  }
}
</style>