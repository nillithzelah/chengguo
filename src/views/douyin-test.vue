<template>
  <div class="p-6">
    <a-card :bordered="false" class="mb-6">
      <template #title>
        <div class="flex items-center">
          <icon-settings class="mr-2" />
          抖音API测试页面
        </div>
      </template>

      <div class="mb-4">
        <a-alert
          :type="authMode.mode === 'production' ? 'success' : 'warning'"
          :message="`当前模式: ${authMode.description}`"
          :description="authMode.recommendation"
          show-icon
          closable
        />
      </div>

      <a-row :gutter="16" class="mb-4">
        <a-col :span="12">
          <a-card :bordered="false" class="bg-blue-50">
            <div class="text-center">
              <div class="text-2xl font-bold text-blue-600">{{ tokenStatus }}</div>
              <div class="text-gray-600">Token状态</div>
            </div>
          </a-card>
        </a-col>
        <a-col :span="12">
          <a-card :bordered="false" class="bg-green-50">
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600">{{ apiCallCount }}</div>
              <div class="text-gray-600">API调用次数</div>
            </div>
          </a-card>
        </a-col>
      </a-row>

      <a-space direction="vertical" class="w-full">
        <a-button
          type="primary"
          :loading="loading.token"
          @click="testGetToken"
          class="w-full"
        >
          <template #icon><icon-refresh /></template>
          测试获取client_token
        </a-button>

        <a-button
          type="primary"
          :loading="loading.ads"
          @click="testGetAds"
          class="w-full"
        >
          <template #icon><icon-file /></template>
          测试获取广告数据
        </a-button>

        <a-button
          type="primary"
          :loading="loading.balance"
          @click="testGetBalance"
          class="w-full"
        >
          <template #icon><icon-home /></template>
          测试获取账户余额
        </a-button>
      </a-space>

      <a-divider />

      <div class="mb-4">
        <h3 class="text-lg font-medium mb-3">测试结果</h3>
        <a-textarea
          v-model="testResult"
          :rows="10"
          placeholder="测试结果将显示在这里..."
          readonly
        />
      </div>

      <div class="mb-4">
        <h3 class="text-lg font-medium mb-3">配置信息</h3>
        <a-descriptions :column="2" bordered>
          <a-descriptions-item label="App Key">
            {{ appKey ? '已配置' : '未配置' }}
          </a-descriptions-item>
          <a-descriptions-item label="App Secret">
            {{ appSecret ? '已配置' : '未配置' }}
          </a-descriptions-item>
          <a-descriptions-item label="Advertiser ID">
            {{ advertiserId || '未配置' }}
          </a-descriptions-item>
          <a-descriptions-item label="API Base URL">
            https://minigame.zijieapi.com/mgplatform/api
          </a-descriptions-item>
        </a-descriptions>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { Message } from '@arco-design/web-vue';
import {
  IconSettings,
  IconRefresh,
  IconFile,
  IconHome
} from '@arco-design/web-vue/es/icon';

import { douyinAuthService } from '@/api/douyin-auth';
import { douyinApiService } from '@/api/douyin-service';

// 响应式数据
const loading = reactive({
  token: false,
  ads: false,
  balance: false
});

const testResult = ref('');
const apiCallCount = ref(0);

// 配置信息
const appKey = computed(() => import.meta.env.VITE_DOUYIN_APP_KEY || 'tt8c62fadf136c334702');
const appSecret = computed(() => import.meta.env.VITE_DOUYIN_APP_SECRET || '56808246ee49c052ecc7be8be79551859837409e');
const advertiserId = computed(() => import.meta.env.VITE_DOUYIN_ADVERTISER_ID);

// 认证状态
const authMode = computed(() => douyinAuthService.getCurrentMode());

// Token状态
const tokenStatus = computed(() => {
  const mode = authMode.value;
  switch (mode.mode) {
    case 'production':
      return '✅ 正常';
    case 'development':
      return '🔄 模拟模式';
    case 'config_missing':
      return '❌ 未配置';
    default:
      return '❓ 未知';
  }
});

// 添加测试结果
const addTestResult = (title: string, result: any, success: boolean = true) => {
  const timestamp = new Date().toLocaleTimeString();
  const status = success ? '✅' : '❌';
  const content = `${status} [${timestamp}] ${title}\n${JSON.stringify(result, null, 2)}\n\n`;
  testResult.value += content;
  apiCallCount.value++;
};

// 清空测试结果
const clearTestResult = () => {
  testResult.value = '';
  apiCallCount.value = 0;
};

// 测试获取client_token
const testGetToken = async () => {
  loading.token = true;
  try {
    console.log('🔄 开始测试获取client_token...');
    const token = await douyinAuthService.getAccessToken();

    addTestResult('获取client_token', {
      token: token ? `${token.substring(0, 20)}...` : 'null',
      length: token?.length || 0,
      isMock: token?.startsWith('dev_token_') || false
    });

    Message.success('client_token获取成功');
  } catch (error: any) {
    console.error('❌ 获取client_token失败:', error);
    addTestResult('获取client_token失败', {
      error: error.message,
      code: error.response?.status
    }, false);
    Message.error('获取client_token失败');
  } finally {
    loading.token = false;
  }
};

// 测试获取广告数据
const testGetAds = async () => {
  loading.ads = true;
  try {
    console.log('🔄 开始测试获取广告数据...');

    const testAdvertiserId = advertiserId.value || 'test_advertiser_id';
    const adsData = await douyinApiService.getAdPlans(testAdvertiserId, {
      start_date: '2024-01-01',
      end_date: '2024-01-07'
    });

    addTestResult('获取广告数据', {
      total: adsData?.data?.total || 0,
      listCount: adsData?.data?.list?.length || 0,
      hasData: !!adsData?.data?.list
    });

    Message.success('广告数据获取成功');
  } catch (error: any) {
    console.error('❌ 获取广告数据失败:', error);
    addTestResult('获取广告数据失败', {
      error: error.message,
      code: error.response?.status
    }, false);
    Message.error('获取广告数据失败');
  } finally {
    loading.ads = false;
  }
};

// 测试获取账户余额
const testGetBalance = async () => {
  loading.balance = true;
  try {
    console.log('🔄 开始测试获取账户余额...');

    const testAdvertiserId = advertiserId.value || 'test_advertiser_id';
    const balanceData = await douyinApiService.getAccountBalance(testAdvertiserId);

    addTestResult('获取账户余额', {
      balance: balanceData?.data?.balance || 0,
      currency: balanceData?.data?.currency || 'CNY',
      hasData: !!balanceData?.data
    });

    Message.success('账户余额获取成功');
  } catch (error: any) {
    console.error('❌ 获取账户余额失败:', error);
    addTestResult('获取账户余额失败', {
      error: error.message,
      code: error.response?.status
    }, false);
    Message.error('获取账户余额失败');
  } finally {
    loading.balance = false;
  }
};

// 页面加载时初始化
onMounted(() => {
  console.log('🚀 抖音API测试页面已加载');
  console.log('🔧 当前配置:', {
    hasAppKey: !!appKey.value,
    hasAppSecret: !!appSecret.value,
    hasAdvertiserId: !!advertiserId.value,
    authMode: authMode.value
  });
});
</script>

<style scoped>
:deep(.arco-card) {
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.bg-blue-50 {
  background-color: #e8f3ff;
}

.bg-green-50 {
  background-color: #f6ffed;
}

.text-blue-600 {
  color: #1d4ed8;
}

.text-green-600 {
  color: #16a34a;
}
</style>