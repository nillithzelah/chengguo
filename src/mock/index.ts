import Mock from 'mockjs';
import setupMock from '@/utils/setup-mock';

// 条件性启用mock
setupMock({
  mock: false, // 强制禁用mock，使用真实API
  setup: () => {
    // 用户相关mock
    import('./user');

    // 其他mock
    import('./message-box');
    import('./douyin-webhook');



    Mock.setup({
      timeout: '600-1000',
    });
  }
});
