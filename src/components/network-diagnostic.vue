<template>
  <div class="network-diagnostic">
    <a-alert 
      v-if="showAlert"
      :type="alertType"
      :title="alertTitle"
      :description="alertDescription"
      show-icon
      closable
      @close="showAlert = false"
    >
      <template #action>
        <a-space>
          <a-button 
            v-if="showRetryButton"
            size="small" 
            type="primary"
            @click="retryConnection"
          >
            重试连接
          </a-button>
          <a-button 
            size="small"
            @click="switchToMockMode"
          >
            切换到Mock模式
          </a-button>
          <a-button 
            size="small"
            @click="showDetailModal = true"
          >
            查看详情
          </a-button>
        </a-space>
      </template>
    </a-alert>

    <!-- 网络诊断详情弹窗 -->
    <a-modal
      v-model:visible="showDetailModal"
      title="🔍 网络连接诊断"
      :width="800"
      :footer="false"
    >
      <div class="diagnostic-content">
        <a-descriptions :column="1" bordered size="small">
          <a-descriptions-item label="当前状态">
            <a-tag :color="statusColor">{{ currentStatus }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="错误类型">
            {{ errorType || '暂无错误' }}
          </a-descriptions-item>
          <a-descriptions-item label="错误信息">
            <code>{{ errorMessage || '暂无错误' }}</code>
          </a-descriptions-item>
          <a-descriptions-item label="建议解决方案">
            <div class="solution-list">
              <div v-for="(solution, index) in solutions" :key="index" class="solution-item">
                <span class="solution-number">{{ index + 1 }}.</span>
                <span class="solution-text">{{ solution }}</span>
              </div>
            </div>
          </a-descriptions-item>
        </a-descriptions>

        <div class="diagnostic-actions">
          <a-space>
            <a-button type="primary" @click="testConnection">
              <template #icon><icon-wifi /></template>
              测试连接
            </a-button>
            <a-button @click="copyDiagnosticInfo">
              <template #icon><icon-copy /></template>
              复制诊断信息
            </a-button>
            <a-button @click="openDouyinPlatform" type="outline">
              <template #icon><icon-link /></template>
              打开抖音开放平台
            </a-button>
          </a-space>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { IconWifi, IconCopy, IconLink } from '@arco-design/web-vue/es/icon';
import { Message } from '@arco-design/web-vue';
import { douyinAuthService } from '@/api/douyin-auth';

interface Props {
  error?: Error | null;
  autoShow?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  autoShow: true,
});

const emit = defineEmits<{
  retry: [];
  switchMode: [mode: 'mock' | 'real'];
}>();

const showAlert = ref(false);
const showDetailModal = ref(false);
const showRetryButton = ref(true);
const currentStatus = ref('检测中...');
const errorType = ref('');
const errorMessage = ref('');
const lastTestTime = ref<Date | null>(null);

// 计算属性
const alertType = computed(() => {
  if (errorMessage.value) return 'error';
  if (currentStatus.value.includes('开发模式')) return 'warning';
  return 'info';
});

const alertTitle = computed(() => {
  if (errorMessage.value) return '🔌 网络连接异常';
  if (currentStatus.value.includes('开发模式')) return '🔧 开发模式运行';
  return '📡 连接状态正常';
});

const alertDescription = computed(() => {
  if (errorMessage.value) {
    return `检测到网络问题：${errorType.value}。系统已自动切换到开发模式，使用Mock数据确保功能正常运行。`;
  }
  return currentStatus.value;
});

const statusColor = computed(() => {
  if (errorMessage.value) return 'red';
  if (currentStatus.value.includes('开发模式')) return 'orange';
  return 'green';
});

const solutions = computed(() => {
  const baseSolutions = [
    '检查网络连接是否正常',
    '确认防火墙是否允许应用访问网络',
    '尝试使用VPN或更换网络环境',
  ];

  if (errorType.value.includes('HTTPS')) {
    return [
      ...baseSolutions,
      '配置HTTPS开发环境（抖音平台要求）',
      '在抖音开放平台配置正确的服务器域名',
      '确保域名以https://开头且支持443端口',
    ];
  }

  if (errorType.value.includes('CORS')) {
    return [
      ...baseSolutions,
      '检查Vite代理配置是否正确',
      '确认API请求头设置符合CORS要求',
    ];
  }

  return baseSolutions;
});

// 方法
const updateDiagnosticInfo = (error?: Error | null) => {
  if (!error) {
    const mode = douyinAuthService.getCurrentMode();
    currentStatus.value = mode.description;
    errorType.value = '';
    errorMessage.value = '';
    showRetryButton.value = mode.mode !== 'production';
    return;
  }

  errorMessage.value = error.message;
  
  if (error.message.includes('Network Error')) {
    errorType.value = 'HTTPS协议要求';
    currentStatus.value = '网络连接失败 - 已切换到开发模式';
  } else if (error.message.includes('CORS')) {
    errorType.value = 'CORS跨域错误';
    currentStatus.value = '跨域请求被阻止';
  } else if (error.message.includes('timeout')) {
    errorType.value = '请求超时';
    currentStatus.value = '网络连接超时';
  } else {
    errorType.value = '未知错误';
    currentStatus.value = '连接异常';
  }
  
  if (props.autoShow) {
    showAlert.value = true;
  }
};

const testConnection = async () => {
  currentStatus.value = '正在测试连接...';
  lastTestTime.value = new Date();
  
  try {
    await douyinAuthService.getAccessToken();
    updateDiagnosticInfo();
    Message.success('连接测试成功！');
  } catch (error: any) {
    updateDiagnosticInfo(error);
    Message.error('连接测试失败');
  }
};

const retryConnection = () => {
  emit('retry');
  testConnection();
};

const switchToMockMode = () => {
  emit('switchMode', 'mock');
  showAlert.value = false;
  Message.info('已切换到Mock数据模式');
};

const copyDiagnosticInfo = async () => {
  const info = `
网络诊断信息
==================
检测时间: ${lastTestTime.value?.toLocaleString() || '未知'}
当前状态: ${currentStatus.value}
错误类型: ${errorType.value || '无'}
错误信息: ${errorMessage.value || '无'}
用户代理: ${navigator.userAgent}
当前地址: ${window.location.href}
==================
  `.trim();

  try {
    await navigator.clipboard.writeText(info);
    Message.success('诊断信息已复制到剪贴板');
  } catch {
    Message.error('复制失败，请手动复制');
  }
};

const openDouyinPlatform = () => {
  window.open('https://developer.open-douyin.com/', '_blank');
};

// 监听错误变化
watch(() => props.error, (newError) => {
  updateDiagnosticInfo(newError);
}, { immediate: true });

onMounted(() => {
  updateDiagnosticInfo(props.error);
});
</script>

<style scoped>
.network-diagnostic {
  margin-bottom: 16px;
}

.diagnostic-content {
  padding: 16px 0;
}

.solution-list {
  padding-left: 8px;
}

.solution-item {
  display: flex;
  margin-bottom: 8px;
  align-items: flex-start;
}

.solution-number {
  color: #1890ff;
  font-weight: bold;
  margin-right: 8px;
  min-width: 20px;
}

.solution-text {
  flex: 1;
  line-height: 1.5;
}

.diagnostic-actions {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

code {
  background: #f6f6f6;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 12px;
}
</style>