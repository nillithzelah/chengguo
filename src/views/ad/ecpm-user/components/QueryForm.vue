<template>
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
          @click="$emit('show-qr-preview')"
          class="btn btn-outline btn-qr-preview"
        >
          📱 查看广告预览二维码
        </button>
      </div>
    </div>

    <div class="form-actions">
      <button
        @click="$emit('load-data')"
        :disabled="loading"
        class="btn btn-primary"
      >
        {{ loading ? '加载中...' : '查询数据' }}
      </button>
      <button
        @click="$emit('reset-query')"
        class="btn btn-secondary btn-small"
      >
        重置
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

interface App {
  appid: string;
  name: string;
  advertiser_id?: string;
  promotion_id?: string;
}

interface QueryParams {
  mp_id: string;
  date_hour: string;
  page_no: number;
  page_size: number;
}

defineProps<{
  appList: App[];
  selectedAppId: string;
  queryParams: QueryParams;
  loading: boolean;
}>();

defineEmits<{
  'update:selectedAppId': [value: string];
  'show-qr-preview': [];
  'load-data': [];
  'reset-query': [];
  'app-change': [];
}>();

const onAppChange = () => {
  // 触发父组件的app-change事件
  // 实际逻辑在父组件中处理
};
</script>

<style scoped>
.query-section {
  background: linear-gradient(135deg, #fff 0%, #f8f9ff 100%);
  border-radius: 12px;
  padding: 28px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(102, 126, 234, 0.1);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.form-item {
  display: flex;
  flex-direction: column;
}

.form-item label {
  display: block;
  font-weight: 600;
  color: #1d2129;
  margin-bottom: 10px;
  font-size: 14px;
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

.form-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

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

.btn-small {
  padding: 6px 12px;
  font-size: 12px;
  border-radius: 6px;
}

.btn-qr-preview {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
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

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }
}
</style>