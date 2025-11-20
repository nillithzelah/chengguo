<template>
  <a-layout-footer class="footer">{{ brandName }}</a-layout-footer>
</template>

<script lang="ts" setup>
  import { computed } from 'vue';

  const brandName = computed(() => {
    if (typeof window !== 'undefined' && window.location.hostname === 'www.wubug.cc') {
      return '武霸哥';
    }
    return '橙果宜牛';
  });
</script>

<style lang="less" scoped>
  .footer {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 40px;
    color: var(--color-text-2);
    text-align: center;
  }
</style>
