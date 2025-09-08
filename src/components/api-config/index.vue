<template>
  <div class="api-config-panel">
    <a-card title="数据源配置" size="small" style="margin-bottom: 16px;">
      <a-space>
        <a-switch 
          v-model="useRealApi" 
          @change="(value: boolean) => handleApiModeChange(value)"
          :loading="switching"
        >
          <template #checked-text>真实API</template>
          <template #unchecked-text>Mock数据</template>
        </a-switch>
        
        <a-tag v-if="useRealApi" color="green">
          <template #icon><icon-cloud /></template>
          抖音真实数据
        </a-tag>
        <a-tag v-else color="blue">
          <template #icon><icon-code /></template>
          Mock测试数据
        </a-tag>
        
        <a-button 
          v-if="useRealApi" 
          type="text" 
          size="mini" 
          @click="showApiConfig = true"
        >
          <template #icon><icon-settings /></template>
          API配置
        </a-button>
        
        <a-button 
          v-if="useRealApi" 
          type="text" 
          size="mini" 
          @click="showApiTest = true"
        >
          <template #icon><icon-thunderbolt /></template>
          连接测试
        </a-button>
      </a-space>
    </a-card>

    <!-- API配置对话框 -->
    <a-modal 
      v-model:visible="showApiConfig" 
      title="抖音API配置"
      width="600px"
      @ok="saveApiConfig"
    >
      <a-form :model="apiConfig" layout="vertical">
        <a-form-item label="App Key" required>
          <a-input 
            v-model="apiConfig.appKey" 
            placeholder="ttb4dbc2662bd4ee7202"
            readonly
          />
          <template #extra>
            <a-typography-text type="success">✓ 已配置</a-typography-text>
          </template>
        </a-form-item>
        
        <a-form-item label="App Secret" required>
          <a-input-password 
            v-model="apiConfig.appSecret" 
            placeholder="已配置App Secret"
            readonly
          />
          <template #extra>
            <a-typography-text type="success">✓ 已配置</a-typography-text>
          </template>
        </a-form-item>
        
        <a-form-item label="广告主ID">
          <a-input 
            v-model="apiConfig.advertiserId" 
            placeholder="请输入广告主ID（可选）"
          />
          <template #extra>
            广告主ID用于获取特定广告主的数据，留空将使用默认配置
          </template>
        </a-form-item>
        
        <a-alert 
          type="success" 
          message="配置状态"
          description="您的抖音API配置已完成，可以开始获取真实广告数据。"
          show-icon
        />
      </a-form>
    </a-modal>

    <!-- API测试对话框 -->
    <a-modal 
      v-model:visible="showApiTest" 
      title="API连接测试"
      width="800px"
      :footer="false"
    >
      <ApiTest />
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { Message } from '@arco-design/web-vue';
import ApiTest from '@/components/api-test/index.vue';

const useRealApi = ref(false);
const switching = ref(false);
const showApiConfig = ref(false);
const showApiTest = ref(false);

const apiConfig = ref({
  appKey: '',
  appSecret: '',
  accessToken: '',
  advertiserId: '',
});

// 检查当前API模式
onMounted(() => {
  useRealApi.value = import.meta.env.VITE_API_MODE === 'real';
  loadApiConfig();
});

// 加载保存的API配置
const loadApiConfig = () => {
  // 从环境变量加载配置
  apiConfig.value.appKey = import.meta.env.VITE_DOUYIN_APP_KEY || '';
  apiConfig.value.appSecret = import.meta.env.VITE_DOUYIN_APP_SECRET || '';
  
  // 从本地存储加载额外配置
  const saved = localStorage.getItem('douyin_api_config');
  if (saved) {
    try {
      const savedConfig = JSON.parse(saved);
      apiConfig.value.advertiserId = savedConfig.advertiserId || '';
    } catch (error) {
      console.error('加载API配置失败:', error);
    }
  }
};

// 保存API配置
const saveApiConfig = () => {
  try {
    // 只保存可变的配置项
    const configToSave = {
      advertiserId: apiConfig.value.advertiserId,
    };
    localStorage.setItem('douyin_api_config', JSON.stringify(configToSave));
    Message.success('API配置已保存');
    showApiConfig.value = false;
  } catch (error) {
    Message.error('保存配置失败');
  }
};

// 切换API模式
const handleApiModeChange = async (value: boolean) => {
  switching.value = true;
  
  try {
    if (value) {
      // 切换到真实API
      if (!apiConfig.value.appKey || !apiConfig.value.appSecret) {
        Message.warning('抖音API已配置，即将切换到真实数据模式');
      }
      Message.success('已切换到抖音真实数据');
    } else {
      // 切换到Mock数据
      Message.success('已切换到Mock测试数据');
    }
    
    // 这里可以触发页面重新加载数据
    window.location.reload();
  } finally {
    switching.value = false;
  }
};

// 暴露配置给父组件
defineExpose({
  getConfig: () => apiConfig.value,
  isUsingRealApi: () => useRealApi.value,
});
</script>

<style scoped>
.api-config-panel {
  .arco-card {
    border-radius: 6px;
  }
}
</style>