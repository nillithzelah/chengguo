<template>
  <div class="loading-state" :class="{ 'loading-inline': inline }">
    <div class="loading-container">
      <div class="loading-spinner" :class="{ 'loading-small': small }"></div>
      <div class="loading-text" v-if="text">{{ text }}</div>
      <div class="loading-progress" v-if="showProgress">
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: progress + '%' }"
          ></div>
        </div>
        <div class="progress-text">{{ Math.round(progress) }}%</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  text?: string;
  small?: boolean;
  inline?: boolean;
  showProgress?: boolean;
  progress?: number;
}

withDefaults(defineProps<Props>(), {
  text: '加载中...',
  small: false,
  inline: false,
  showProgress: false,
  progress: 0,
});
</script>

<style scoped>
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  min-height: 200px;
}

.loading-inline {
  padding: 20px;
  min-height: auto;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.loading-spinner {
  display: inline-block;
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-small {
  width: 20px;
  height: 20px;
  border-width: 2px;
}

.loading-text {
  color: #666;
  font-size: 14px;
  font-weight: 500;
}

.loading-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 200px;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: #f0f0f0;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: #667eea;
  font-weight: 600;
  min-width: 35px;
  text-align: right;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .loading-state {
    padding: 20px 16px;
    min-height: 150px;
  }

  .loading-spinner {
    width: 32px;
    height: 32px;
    border-width: 2px;
  }

  .loading-text {
    font-size: 13px;
  }

  .loading-progress {
    min-width: 150px;
  }
}
</style>