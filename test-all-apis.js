#!/usr/bin/env node

/**
 * 全面API测试脚本
 * 测试所有后端API接口的功能
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
let authToken = null;

// 测试结果统计
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  details: []
};

// 工具函数
const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`[${timestamp}] ${prefix} ${message}`);
};

const recordResult = (testName, success, message = '') => {
  results.total++;
  if (success) {
    results.passed++;
    log(`${testName}: ${message}`, 'success');
  } else {
    results.failed++;
    log(`${testName}: ${message}`, 'error');
  }
  results.details.push({ testName, success, message });
};

const makeRequest = async (method, url, data = null, useAuth = false) => {
  const config = {
    method,
    url: `${BASE_URL}${url}`,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (useAuth && authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }

  if (data) {
    config.data = data;
  }

  try {
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    };
  }
};

// 测试函数
const testHealthCheck = async () => {
  log('测试健康检查API...');
  const result = await makeRequest('GET', '/api/health');

  if (result.success && result.data.status === 'ok') {
    recordResult('健康检查API', true, `状态: ${result.data.status}, 运行时间: ${result.data.uptime}秒`);
  } else {
    recordResult('健康检查API', false, result.error || '响应异常');
  }
};

const testUserLogin = async () => {
  log('测试用户登录API...');
  const loginData = {
    username: 'admin',
    password: 'admin123'
  };

  const result = await makeRequest('POST', '/api/user/login', loginData);

  if (result.success && result.data.code === 20000 && result.data.data?.token) {
    authToken = result.data.data.token;
    recordResult('用户登录API', true, `登录成功，获取到token`);
  } else {
    recordResult('用户登录API', false, result.data?.message || result.error || '登录失败');
  }
};

const testUserInfo = async () => {
  if (!authToken) {
    recordResult('用户信息API', false, '未获取到认证token，跳过测试');
    return;
  }

  log('测试用户信息API...');
  const result = await makeRequest('POST', '/api/user/info', {}, true);

  if (result.success && result.data.code === 20000) {
    const userInfo = result.data.data?.userInfo || result.data.data;
    recordResult('用户信息API', true, `获取用户信息成功: ${userInfo?.username || '未知用户'}`);
  } else {
    recordResult('用户信息API', false, result.data?.message || result.error || '获取用户信息失败');
  }
};

const testGameList = async () => {
  if (!authToken) {
    recordResult('游戏列表API', false, '未获取到认证token，跳过测试');
    return;
  }

  log('测试游戏列表API...');
  const result = await makeRequest('GET', '/api/game/list', null, true);

  if (result.success && result.data.code === 20000) {
    recordResult('游戏列表API', true, `获取到 ${result.data.data.games?.length || 0} 个游戏`);
  } else {
    recordResult('游戏列表API', false, result.data?.message || result.error || '获取游戏列表失败');
  }
};

const testDouyinTestConnection = async () => {
  if (!authToken) {
    recordResult('抖音连接测试API', false, '未获取到认证token，跳过测试');
    return;
  }

  log('测试抖音连接测试API...');
  const testData = {
    appid: 'tt8513f3ae1a1ce1af02',
    appSecret: '56841e098b967f30014c9ba4c06bacfee3bfcd4d'
  };

  const result = await makeRequest('POST', '/api/douyin/test-connection', testData, true);

  if (result.success && result.data.code === 0) {
    recordResult('抖音连接测试API', true, '连接测试成功');
  } else {
    recordResult('抖音连接测试API', false, result.data?.message || result.error || '连接测试失败');
  }
};

const testDouyinEcpm = async () => {
  if (!authToken) {
    recordResult('抖音eCPM数据API', false, '未获取到认证token，跳过测试');
    return;
  }

  log('测试抖音eCPM数据API...');
  const params = new URLSearchParams({
    mp_id: 'tt8513f3ae1a1ce1af02',
    date_hour: new Date().toISOString().split('T')[0],
    page_no: '1',
    page_size: '10',
    app_secret: '56841e098b967f30014c9ba4c06bacfee3bfcd4d'
  });

  const result = await makeRequest('GET', `/api/douyin/ecpm?${params.toString()}`, null, true);

  if (result.success && result.data.code === 0) {
    recordResult('抖音eCPM数据API', true, `获取到 ${result.data.data?.records?.length || 0} 条记录`);
  } else {
    recordResult('抖音eCPM数据API', false, result.data?.message || result.error || '获取eCPM数据失败');
  }
};

const testQrScan = async () => {
  if (!authToken) {
    recordResult('二维码扫描API', false, '未获取到认证token，跳过测试');
    return;
  }

  log('测试二维码扫描API...');
  const scanData = {
    open_id: '_0008XHdgEvji2reXd_0Pot-YO4VUWXIcypG',
    aid: '13',
    query_type: 'device_id'
  };

  const result = await makeRequest('POST', '/api/qr-scan/username-by-openid', scanData, true);

  if (result.success && result.data.code === 20000) {
    recordResult('二维码扫描API', true, `查询成功: ${result.data.data?.username || '未知用户'}`);
  } else {
    recordResult('二维码扫描API', false, result.data?.message || result.error || '二维码扫描失败');
  }
};

const testTokenStatus = async () => {
  log('测试Token状态API...');
  const result = await makeRequest('GET', '/api/douyin/token-status');

  if (result.success && result.data.code === 0) {
    recordResult('Token状态API', true, '获取Token状态成功');
  } else {
    recordResult('Token状态API', false, result.data?.message || result.error || '获取Token状态失败');
  }
};

const testConversionCallback = async () => {
  log('测试转化事件回调API...');
  const callbackData = {
    event_type: 'active',
    context: {
      ad: {
        callback: 'test_callback_123'
      }
    },
    timestamp: Date.now()
  };

  const result = await makeRequest('POST', '/api/conversion/callback', callbackData);

  if (result.success) {
    recordResult('转化事件回调API', true, '回调处理成功');
  } else {
    recordResult('转化事件回调API', false, result.error || '回调处理失败');
  }
};

const testWebhook = async () => {
  log('测试抖音webhook API...');
  const webhookData = {
    event: 'test_event',
    data: {
      test: true
    },
    timestamp: Date.now()
  };

  const result = await makeRequest('POST', '/api/douyin/webhook', webhookData);

  if (result.success) {
    recordResult('抖音webhook API', true, 'webhook处理成功');
  } else {
    recordResult('抖音webhook API', false, result.error || 'webhook处理失败');
  }
};

// 主测试函数
const runAllTests = async () => {
  log('🚀 开始全面API测试');
  log('='.repeat(50));

  try {
    // 1. 健康检查（无需认证）
    await testHealthCheck();

    // 2. Token状态（无需认证）
    await testTokenStatus();

    // 3. 用户登录
    await testUserLogin();

    // 4. 需要认证的API测试
    if (authToken) {
      await testUserInfo();
      await testGameList();
      await testDouyinTestConnection();
      await testDouyinEcpm();
      await testQrScan();
    }

    // 5. 其他无需认证的API
    await testConversionCallback();
    await testWebhook();

  } catch (error) {
    log(`测试过程中发生错误: ${error.message}`, 'error');
  }

  // 输出测试结果摘要
  log('='.repeat(50));
  log('📊 测试结果摘要:');
  log(`   总测试数: ${results.total}`);
  log(`   通过: ${results.passed}`);
  log(`   失败: ${results.failed}`);
  log(`   成功率: ${results.total > 0 ? ((results.passed / results.total) * 100).toFixed(1) : 0}%`);

  if (results.failed > 0) {
    log('\n❌ 失败的测试:');
    results.details.filter(test => !test.success).forEach(test => {
      log(`   - ${test.testName}: ${test.message}`);
    });
  }

  log('='.repeat(50));
  log('🎉 API测试完成');
};

// 运行测试
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests };