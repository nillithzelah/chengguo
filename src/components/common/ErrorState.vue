<template>
  <div class="error-state" :class="{ 'error-inline': inline }">
    <div class="error-container">
      <div class="error-icon" :class="{ 'error-small': small }">
        <slot name="icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        </slot>
      </div>

      <div class="error-content">
        <h3 class="error-title" v-if="title">{{ title }}</h3>
        <p class="error-message">{{ message }}</p>

        <div class="error-actions" v-if="showRetry || showDetails">
          <button
            v-if="showRetry"
            @click="$emit('retry')"
            class="btn btn-primary btn-small"
          >
            重试
          </button>
          <button
            v-if="showDetails && error"
            @click="toggleDetails"
            class="btn btn-secondary btn-small"
          >
            {{ showErrorDetails ? '隐藏详情' : '显示详情' }}
          </button>
        </div>

        <div class="error-details" v-if="showErrorDetails && error">
          <div class="error-details-content">
            <h4>错误详情：</h4>
            <pre>{{ error }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface Props {
  title?: string;
  message: string;
  error?: any;
  small?: boolean;
  inline?: boolean;
  showRetry?: boolean;
  showDetails?: boolean;
}

interface Emits {
  retry: [];
}

const props = withDefaults(defineProps<Props>(), {
  title: '出错了',
  small: false,
  inline: false,
  showRetry: true,
  showDetails: false,
});

const emit = defineEmits<Emits>();

const showErrorDetails = ref(false);

const toggleDetails = () => {
  showErrorDetails.value = !showErrorDetails.value;
};
</script>

<style scoped>
.error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  min-height: 200px;
}

.error-inline {
  padding: 20px;
  min-height: auto;
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
  max-width: 500px;
}

.error-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%);
  border-radius: 50%;
  color: white;
  flex-shrink: 0;
}

.error-icon svg {
  width: 32px;
  height: 32px;
}

.error-small {
  width: 40px;
  height: 40px;
}

.error-small svg {
  width: 20px;
  height: 20px;
}

.error-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.error-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1d2129;
}

.error-message {
  margin: 0;
  color: #86909c;
  font-size: 14px;
  line-height: 1.5;
}

.error-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 8px;
}

.error-details {
  margin-top: 16px;
  width: 100%;
}

.error-details-content {
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 8px;
  padding: 16px;
  text-align: left;
}

.error-details-content h4 {
  margin: 0 0 12px 0;
  color: #cf1322;
  font-size: 14px;
  font-weight: 600;
}

.error-details-content pre {
  margin: 0;
  color: #8c8c8c;
  font-size: 12px;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-all;
  background: #fafafa;
  padding: 8px;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
}

/* 按钮样式 */
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
  color: #1d2129;
  border: 1px solid #d9d9d9;
}

.btn-secondary:hover:not(:disabled) {
  background: linear-gradient(135deg, #e8e8e8 0%, #d0d0d0 100%);
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
}

.btn-small {
  padding: 6px 12px;
  font-size: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .error-state {
    padding: 20px 16px;
    min-height: 150px;
  }

  .error-container {
    gap: 12px;
  }

  .error-icon {
    width: 48px;
    height: 48px;
  }

  .error-icon svg {
    width: 24px;
    height: 24px;
  }

  .error-title {
    font-size: 16px;
  }

  .error-message {
    font-size: 13px;
  }

  .error-actions {
    gap: 8px;
  }

  .btn {
    padding: 6px 12px;
    font-size: 13px;
  }
}
</style>