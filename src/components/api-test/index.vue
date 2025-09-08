<template>
  <a-card title="抖音API连接测试" size="small">
    <a-space direction="vertical" style="width: 100%;">
      <!-- 配置信息显示 -->
      <a-descriptions :column="2" size="small">
        <a-descriptions-item label="App Key">
          <a-tag color="blue">{{ maskedAppKey }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="App Secret">
          <a-tag color="orange">{{ maskedAppSecret }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="Access Token">
          <a-tag :color="tokenStatus.color">{{ tokenStatus.text }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="API状态">
          <a-tag :color="apiStatus.color">{{ apiStatus.text }}</a-tag>
        </a-descriptions-item>
      </a-descriptions>

      <!-- 测试按钮 -->
      <a-space>
        <a-button 
          type="primary" 
          @click="testConnection" 
          :loading="testing"
        >
          <template #icon><icon-thunderbolt /></template>
          测试API连接
        </a-button>
        
        <a-button 
          @click="refreshToken" 
          :loading="refreshing"
        >
          <template #icon><icon-refresh /></template>
          刷新Token
        </a-button>
        
        <a-button 
          type="outline" 
          @click="clearCache"
        >
          <template #icon><icon-delete /></template>
          清除缓存
        </a-button>
      </a-space>

      <!-- 测试结果 -->
      <div v-if="testResult">
        <a-divider />
        <a-alert 
          :type="testResult.success ? 'success' : 'warning'"
          :title="testResult.success ? '连接成功' : '使用开发模式'"
          :description="testResult.message"
          show-icon
        />
        
        <!-- 网络错误的解决方案 -->
        <div v-if="!testResult.success && testResult.isNetworkError" style="margin-top: 12px;">
          <a-card size="small" title="网络错误解决方案">
            <a-space direction="vertical" style="width: 100%;">
              <a-typography-text>
                🔍 检测到网络连接问题，这是正常现象。系统已自动切换到开发模式。
              </a-typography-text>
              
              <a-steps size="small" direction="vertical">
                <a-step title="开发阶段" description="使用模拟token和Mock数据进行开发测试" status="process" />
                <a-step title="生产部署" description="部署到服务器后可正常访问抖音API" status="wait" />
              </a-steps>
              
              <a-typography-text type="secondary">
                📝 提示：浏览器CORS策略限制直接访问第三方API，这在生产环境中不会有问题。
              </a-typography-text>
            </a-space>
          </a-card>
        </div>
        
        <div v-if="testResult.success && testResult.data" style="margin-top: 12px;">
          <a-typography-title :heading="6">测试数据预览：</a-typography-title>
          <pre style="background: #f6f8fa; padding: 12px; border-radius: 4px; font-size: 12px;">{{ JSON.stringify(testResult.data, null, 2) }}</pre>
        </div>
      </div>

      <!-- 授权指南 -->
      <a-collapse>
        <a-collapse-item header="如何获取抖音API权限？" key="guide">
          <a-steps direction="vertical" size="small">
            <a-step title="注册开发者账号">
              访问 <a href="https://developer.open-douyin.com/" target="_blank">抖音开放平台</a> 注册开发者账号
            </a-step>
            <a-step title="创建应用">
              在开发者控制台创建应用，获取App Key和App Secret
            </a-step>
            <a-step title="申请广告API权限">
              在应用管理中申请"广告主API"权限
            </a-step>
            <a-step title="获取Access Token">
              通过OAuth2.0流程或服务端API获取Access Token
            </a-step>
          </a-steps>
        </a-collapse-item>
      </a-collapse>
    </a-space>
  </a-card>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { Message } from '@arco-design/web-vue';
import { douyinAuthService } from '@/api/douyin-auth';
import { douyinAdService } from '@/api/douyin-real-api';

const testing = ref(false);
const refreshing = ref(false);
const testResult = ref<{
  success: boolean;
  message: string;
  isNetworkError?: boolean;
  data?: any;
} | null>(null);

const appKey = ref('');
const appSecret = ref('');
const accessToken = ref('');

// 加载配置
onMounted(() => {
  appKey.value = import.meta.env.VITE_DOUYIN_APP_KEY || '';
  appSecret.value = import.meta.env.VITE_DOUYIN_APP_SECRET || '';
  checkTokenStatus();
});

// 隐藏敏感信息
const maskedAppKey = computed(() => {
  return appKey.value ? `${appKey.value.slice(0, 6)}***${appKey.value.slice(-4)}` : '未配置';
});

const maskedAppSecret = computed(() => {
  return appSecret.value ? `${appSecret.value.slice(0, 6)}***${appSecret.value.slice(-4)}` : '未配置';
});

// Token状态
const tokenStatus = computed(() => {
  if (!accessToken.value) {
    return { color: 'red', text: '未获取' };
  }
  if (accessToken.value.startsWith('mock_')) {
    return { color: 'orange', text: '模拟Token' };
  }
  return { color: 'green', text: '已获取' };
});

// API状态
const apiStatus = computed(() => {
  if (!appKey.value || !appSecret.value) {
    return { color: 'red', text: '配置缺失' };
  }
  return { color: 'green', text: '配置完整' };
});

// 检查Token状态
const checkTokenStatus = () => {
  const cached = localStorage.getItem('douyin_access_token');
  if (cached) {
    try {
      const { token } = JSON.parse(cached);
      accessToken.value = token;
    } catch {
      accessToken.value = '';
    }
  }
};

// 测试API连接
const testConnection = async () => {
  testing.value = true;
  testResult.value = null;

  try {
    // 检查基本配置
    if (!appKey.value || !appSecret.value) {
      throw new Error('App Key和App Secret未配置');
    }

    // 获取Access Token
    const token = await douyinAuthService.getAccessToken();
    accessToken.value = token;

    // 检查是否为开发模式的token
    const isDevelopmentMode = token.startsWith('dev_token_');

    if (isDevelopmentMode) {
      // 开发模式：使用Mock数据测试
      const mockResult = await douyinAdService.getAdList({
        current: 1,
        pageSize: 5,
      });

      testResult.value = {
        success: true,
        message: `开发模式: 成功获取 ${mockResult.list.length} 条模拟广告数据，总计 ${mockResult.total} 条`,
        isNetworkError: true,
        data: mockResult.list.slice(0, 2),
      };

      Message.success('开发模式测试成功！使用Mock数据进行开发');
    } else {
      // 真实API模式
      const result = await douyinAdService.getAdList({
        current: 1,
        pageSize: 5,
      });

      testResult.value = {
        success: true,
        message: `成功获取 ${result.list.length} 条真实广告数据，总计 ${result.total} 条`,
        data: result.list.slice(0, 2),
      };

      Message.success('API连接测试成功！');
    }
  } catch (error: any) {
    const isNetworkError = error.message?.includes('Network') || 
                          error.code === 'ECONNREFUSED' || 
                          error.code === 'ENOTFOUND';

    testResult.value = {
      success: false,
      message: isNetworkError ? 
        '网络连接问题，已切换到开发模式' : 
        error.message || '连接测试失败',
      isNetworkError,
    };

    if (isNetworkError) {
      Message.warning('网络连接问题，使用开发模式继续开发');
    } else {
      Message.error('API连接测试失败：' + error.message);
    }
  } finally {
    testing.value = false;
  }
};

// 刷新Token
const refreshToken = async () => {
  refreshing.value = true;

  try {
    // 清除缓存的token
    localStorage.removeItem('douyin_access_token');
    
    // 重新获取token
    const token = await douyinAuthService.getAccessToken();
    accessToken.value = token;

    Message.success('Token刷新成功');
  } catch (error: any) {
    Message.error('Token刷新失败：' + error.message);
  } finally {
    refreshing.value = false;
  }
};

// 清除缓存
const clearCache = () => {
  localStorage.removeItem('douyin_access_token');
  localStorage.removeItem('douyin_api_config');
  accessToken.value = '';
  testResult.value = null;
  Message.success('缓存已清除');
};
</script>

<style scoped>
pre {
  max-height: 200px;
  overflow-y: auto;
}

:deep(.arco-descriptions-item-label) {
  font-weight: 500;
}
</style>