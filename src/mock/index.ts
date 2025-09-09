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

    import('@/views/dashboard/workplace/mock');
    /** simple */
    import('@/views/dashboard/monitor/mock');

    import('@/views/list/card/mock');
    import('@/views/list/search-table/mock');

    import('@/views/form/step/mock');

    import('@/views/profile/basic/mock');

    import('@/views/visualization/data-analysis/mock');
    import('@/views/visualization/multi-dimension-data-analysis/mock');

    import('@/views/user/info/mock');
    import('@/views/user/setting/mock');
    /** simple end */

    Mock.setup({
      timeout: '600-1000',
    });
  }
});
