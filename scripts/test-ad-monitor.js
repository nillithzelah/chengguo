#!/usr/bin/env node

/**
 * 测试巨量广告监测链接
 * 用于验证 /openid/report 端点是否正常工作
 */

const axios = require('axios');

async function testAdMonitorEndpoint() {
  console.log('🧪 开始测试巨量广告监测链接...\n');

  // 测试参数（模拟巨量广告平台发送的参数）
  const testParams = {
    promotionid: 'test_promotion_123',
    mid1: 'test_mid1_456',
    imei: 'test_imei_789',
    oaid: 'test_oaid_101',
    androidid: 'test_android_id_202',
    os: 'android',
    TIMESTAMP: Date.now().toString(),
    callback: 'testCallback'
  };

  const testUrl = 'http://localhost:3000/openid/report';

  try {
    console.log('📤 发送测试请求到:', testUrl);
    console.log('📋 请求参数:', testParams);

    const response = await axios.get(testUrl, {
      params: testParams,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36',
        'X-Forwarded-For': '192.168.1.100'
      },
      timeout: 10000
    });

    console.log('\n✅ 请求成功!');
    console.log('📊 响应状态:', response.status);
    console.log('📄 响应数据:', JSON.stringify(response.data, null, 2));
    console.log('📄 响应头:', response.headers);

    // 验证响应内容
    if (response.data.code === 0 && response.data.received === true) {
      console.log('\n🎉 测试通过！监测链接正常工作');
    } else {
      console.log('\n⚠️ 响应格式不符合预期');
    }

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);

    if (error.response) {
      console.error('📊 错误响应状态:', error.response.status);
      console.error('📄 错误响应数据:', error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('💡 服务器未运行，请先启动服务器: node server.js');
    }
  }
}

// 测试JSONP回调
async function testJsonpCallback() {
  console.log('\n🔄 测试JSONP回调...\n');

  const testParams = {
    promotionid: 'jsonp_test_123',
    mid1: 'jsonp_mid1_456',
    callback: 'myCallbackFunction'
  };

  const testUrl = 'http://localhost:3000/openid/report';

  try {
    const response = await axios.get(testUrl, {
      params: testParams,
      headers: {
        'User-Agent': 'Test JSONP Client'
      },
      timeout: 5000
    });

    console.log('📊 JSONP响应状态:', response.status);
    console.log('📄 JSONP响应内容:', response.data);

    // 检查是否是JSONP格式
    if (typeof response.data === 'string' && response.data.startsWith('myCallbackFunction(')) {
      console.log('✅ JSONP回调测试通过');
    } else {
      console.log('⚠️ 响应不是有效的JSONP格式');
    }

  } catch (error) {
    console.error('❌ JSONP测试失败:', error.message);
  }
}

// 测试缺少必要参数的情况
async function testMissingParams() {
  console.log('\n🔍 测试缺少参数的情况...\n');

  const testUrl = 'http://localhost:3000/openid/report';

  try {
    const response = await axios.get(testUrl, {
      timeout: 5000
    });

    console.log('📊 空参数响应状态:', response.status);
    console.log('📄 空参数响应数据:', response.data);

  } catch (error) {
    console.error('❌ 空参数测试失败:', error.message);
  }
}

// 主测试函数
async function runAllTests() {
  console.log('🚀 巨量广告监测链接完整测试套件\n');

  await testAdMonitorEndpoint();
  await testJsonpCallback();
  await testMissingParams();

  console.log('\n🏁 所有测试完成');
  console.log('\n💡 使用说明:');
  console.log('   1. 确保服务器正在运行: node server.js');
  console.log('   2. 如果使用nginx，需要重载配置: sudo nginx -s reload');
  console.log('   3. 生产环境URL: https://ecpm.game985.vip/openid/report');
}

// 如果直接运行此脚本
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testAdMonitorEndpoint,
  testJsonpCallback,
  testMissingParams,
  runAllTests
};