import Mock from 'mockjs';
import setupMock, { successResponseWrap } from '@/utils/setup-mock';

// 抖音webhook验证和消息推送处理
setupMock({
  setup() {
    // GET请求 - 用于抖音平台验证
    Mock.mock(new RegExp('/api/douyin/webhook'), 'get', (params: any) => {
      console.log('📡 抖音webhook GET请求验证:', params);
      
      // 抖音平台验证请求处理
      const url = new URL(params.url, 'http://localhost');
      const echostr = url.searchParams.get('echostr');
      
      if (echostr) {
        console.log('✅ 返回验证字符串:', echostr);
        return echostr;
      }
      
      return successResponseWrap({
        endpoint: '/api/douyin/webhook',
        status: 'active',
        timestamp: new Date().toISOString(),
        description: '用于接收抖音开放平台消息推送',
        token: 'douyingameads2024'
      });
    });
    
    // POST请求 - 用于接收消息推送
    Mock.mock(new RegExp('/api/douyin/webhook'), 'post', (params: any) => {
      console.log('📨 收到抖音webhook POST消息:');
      console.log('URL:', params.url);
      console.log('Body:', params.body);
      
      let body;
      try {
        body = typeof params.body === 'string' ? JSON.parse(params.body) : params.body;
      } catch {
        body = params.body;
      }
      
      // 处理不同类型的消息推送
      if (body?.event_type) {
        switch (body.event_type) {
          case 'ad_update':
            console.log('📈 广告数据更新通知');
            break;
          case 'account_update':
            console.log('👤 账户信息更新通知');
            break;
          case 'budget_alert':
            console.log('💰 预算警告通知');
            break;
          default:
            console.log('📋 其他类型消息:', body.event_type);
        }
      }
      
      // 返回成功响应（抖音平台要求）
      return {
        code: 0,
        message: 'success',
        data: {
          received: true,
          timestamp: new Date().toISOString()
        }
      };
    });
    
    // webhook状态检查端点
    Mock.mock(new RegExp('/api/douyin/webhook/status'), 'get', () => {
      return successResponseWrap({
        endpoint: '/api/douyin/webhook',
        status: 'running',
        last_check: new Date().toISOString(),
        supported_methods: ['GET', 'POST'],
        token_verification: 'douyingameads2024',
        ssl_enabled: true,
        https_url: 'https://localhost:8443/api/douyin/webhook'
      });
    });
  },
});