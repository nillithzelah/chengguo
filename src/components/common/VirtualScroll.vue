<template>
  <div class="virtual-scroll-container" ref="containerRef">
    <div
      class="virtual-scroll-content"
      :style="{ transform: `translateY(${scrollTop}px)` }"
    >
      <!-- 可见区域内的行 -->
      <div
        v-for="item in visibleItems"
        :key="item.id"
        class="virtual-row"
        :style="{ height: itemHeight + 'px' }"
      >
        <slot :item="item" :index="getItemIndex(item.id)">
          {{ item }}
        </slot>
      </div>

      <!-- 占位元素，保持滚动条正确高度 -->
      <div
        class="virtual-spacer"
        :style="{ height: totalHeight + 'px' }"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';

interface Item {
  id: string | number;
  [key: string]: any;
}

interface Props {
  items: Item[];
  itemHeight: number;
  containerHeight: number;
  bufferSize?: number;
}

const props = withDefaults(defineProps<Props>(), {
  bufferSize: 5,
});

const emit = defineEmits<{
  'scroll': [event: Event];
  'item-click': [item: Item, index: number];
}>();

const containerRef = ref<HTMLElement>();
const scrollTop = ref(0);
let isScrolling = false;

// 计算可见区域
const visibleCount = computed(() => {
  return Math.ceil(props.containerHeight / props.itemHeight);
});

const startIndex = computed(() => {
  const start = Math.floor(scrollTop.value / props.itemHeight) - props.bufferSize;
  return Math.max(0, start);
});

const endIndex = computed(() => {
  const end = startIndex.value + visibleCount.value + props.bufferSize * 2;
  return Math.min(props.items.length, end);
});

const visibleItems = computed(() => {
  return props.items.slice(startIndex.value, endIndex.value).map((item, index) => ({
    ...item,
    virtualIndex: startIndex.value + index,
  }));
});

const totalHeight = computed(() => {
  return props.items.length * props.itemHeight;
});

// 获取真实索引
const getItemIndex = (id: string | number): number => {
  return props.items.findIndex(item => item.id === id);
};

// 滚动处理
const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement;
  const newScrollTop = target.scrollTop;

  if (Math.abs(newScrollTop - scrollTop.value) > props.itemHeight / 2) {
    scrollTop.value = newScrollTop;

    if (!isScrolling) {
      isScrolling = true;
      emit('scroll', event);

      // 防抖处理
      nextTick(() => {
        isScrolling = false;
      });
    }
  }
};

// 滚动到指定位置
const scrollToItem = (index: number) => {
  if (containerRef.value) {
    const targetScrollTop = index * props.itemHeight;
    containerRef.value.scrollTop = targetScrollTop;
    scrollTop.value = targetScrollTop;
  }
};

// 滚动到顶部
const scrollToTop = () => {
  scrollToItem(0);
};

// 滚动到底部
const scrollToBottom = () => {
  scrollToItem(props.items.length - 1);
};

// 监听容器滚动
onMounted(() => {
  if (containerRef.value) {
    containerRef.value.addEventListener('scroll', handleScroll, { passive: true });
  }
});

onUnmounted(() => {
  if (containerRef.value) {
    containerRef.value.removeEventListener('scroll', handleScroll);
  }
});
</script>

<style scoped>
.virtual-scroll-container {
  height: v-bind(containerHeight + 'px');
  overflow-y: auto;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  background: white;
}

.virtual-scroll-content {
  position: relative;
  width: 100%;
}

.virtual-row {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid #f0f0f0;
  background: white;
  transition: background-color 0.2s ease;
}

.virtual-row:hover {
  background: #f5f5f5;
}

.virtual-row:last-child {
  border-bottom: none;
}

.virtual-spacer {
  pointer-events: none;
}

/* 滚动条样式 */
.virtual-scroll-container::-webkit-scrollbar {
  width: 8px;
}

.virtual-scroll-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.virtual-scroll-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.virtual-scroll-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 加载状态 */
.virtual-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #999;
}

.loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 空状态 */
.virtual-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #999;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-text {
  font-size: 16px;
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 14px;
  color: #ccc;
}
</style>