// 测试巨量广告监测端点
const axios = require('axios');

async function testMonitorEndpoint() {
  const testUrl = 'https://ecpm.game985.vip/openid/report';
  const testParams = {
    promotionid: 'test_promotion_123',
    imei: 'test_imei_456',
    callback: 'test_callback_function'
  };

  console.log('🧪 测试巨量广告监测端点...');
  console.log('📡 请求URL:', testUrl);
  console.log('📋 请求参数:', testParams);

  try {
    const response = await axios.get(testUrl, {
      params: testParams,
      timeout: 10000
    });

    console.log('📥 响应状态:', response.status);
    console.log('📄 响应类型:', response.headers['content-type']);
    console.log('📏 响应长度:', response.data.length);

    // 检查是否返回了HTML（前端页面）
    if (response.headers['content-type']?.includes('text/html')) {
      console.log('❌ 问题：返回的是HTML页面，nginx配置未生效');
      console.log('💡 建议：检查nginx配置并重新加载');
      return false;
    }

    // 检查是否返回了JSONP响应
    if (typeof response.data === 'string' && response.data.includes('test_callback_function')) {
      console.log('✅ 成功：返回了JSONP响应');
      return true;
    }

    console.log('❓ 意外响应:', response.data.substring(0, 200) + '...');
    return false;

  } catch (error) {
    console.error('❌ 请求失败:', error.message);
    if (error.response) {
      console.error('📄 错误响应:', error.response.status, error.response.data);
    }
    return false;
  }
}

// 运行测试
testMonitorEndpoint().then(success => {
  console.log('\n🎯 测试结果:', success ? '✅ 通过' : '❌ 失败');
  process.exit(success ? 0 : 1);
});