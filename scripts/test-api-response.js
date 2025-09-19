#!/usr/bin/env node

// 测试API响应数据的脚本
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

let authToken = null;

// 工具函数
const makeRequest = async (method, url, data = null, useAuth = true) => {
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

// 测试用户登录
const testLogin = async () => {
  console.log('🔐 测试用户登录...');

  const loginData = {
    username: 'admin',
    password: 'admin123'
  };

  const result = await makeRequest('POST', '/api/user/login', loginData, false);

  if (result.success && result.data.code === 20000) {
    authToken = result.data.data.token;
    console.log('✅ 登录成功，获取到token');
    return true;
  } else {
    console.log('❌ 登录失败:', result.data?.message || result.error);
    return false;
  }
};

// 测试游戏列表API的原始响应
const testGameListAPI = async () => {
  console.log('\n🔍 测试游戏列表API原始响应...');

  const result = await makeRequest('GET', '/api/game/list');

  if (result.success && result.data.code === 20000) {
    console.log('✅ API调用成功');

    const games = result.data.data.games;
    console.log(`📊 返回 ${games.length} 个游戏`);

    // 显示每个游戏的完整数据结构
    games.forEach((game, index) => {
      console.log(`\n🎮 游戏 ${index + 1}: ${game.name}`);
      console.log(`   完整数据结构:`);
      console.log(`   ${JSON.stringify(game, null, 2)}`);

      // 检查广告字段
      const hasAdvertiserId = game.hasOwnProperty('advertiser_id');
      const hasPromotionId = game.hasOwnProperty('promotion_id');

      console.log(`   📋 字段检查:`);
      console.log(`      advertiser_id 字段存在: ${hasAdvertiserId ? '✅' : '❌'}`);
      console.log(`      promotion_id 字段存在: ${hasPromotionId ? '✅' : '❌'}`);

      if (hasAdvertiserId) {
        console.log(`      advertiser_id 值: "${game.advertiser_id}"`);
      }
      if (hasPromotionId) {
        console.log(`      promotion_id 值: "${game.promotion_id}"`);
      }
    });

    return games;
  } else {
    console.log('❌ API调用失败:', result.data?.message || result.error);
    return [];
  }
};

// 测试特定游戏的详细信息
const testGameDetail = async (gameId) => {
  console.log(`\n🔍 测试游戏详情 API (ID: ${gameId})...`);

  const result = await makeRequest('GET', `/api/game/${gameId}/users`);

  if (result.success && result.data.code === 20000) {
    console.log('✅ 游戏详情API调用成功');

    const game = result.data.data.game;
    console.log(`🎮 游戏信息:`);
    console.log(`   名称: ${game.name}`);
    console.log(`   AppID: ${game.appid}`);

    // 检查广告字段
    const hasAdvertiserId = game.hasOwnProperty('advertiser_id');
    const hasPromotionId = game.hasOwnProperty('promotion_id');

    console.log(`📋 广告字段检查:`);
    console.log(`   advertiser_id 字段存在: ${hasAdvertiserId ? '✅' : '❌'}`);
    console.log(`   promotion_id 字段存在: ${hasPromotionId ? '✅' : '❌'}`);

    if (hasAdvertiserId) {
      console.log(`   advertiser_id 值: "${game.advertiser_id}"`);
    }
    if (hasPromotionId) {
      console.log(`   promotion_id 值: "${game.promotion_id}"`);
    }

    return game;
  } else {
    console.log('❌ 游戏详情API调用失败:', result.data?.message || result.error);
    return null;
  }
};

// 主测试函数
const runAPITests = async () => {
  console.log('🚀 开始API响应测试');
  console.log('='.repeat(50));

  try {
    // 1. 登录获取token
    const loginSuccess = await testLogin();
    if (!loginSuccess) {
      console.log('\n❌ 登录失败，无法继续测试');
      return;
    }

    // 2. 测试游戏列表API
    const games = await testGameListAPI();

    if (games.length > 0) {
      // 3. 测试第一个游戏的详细信息
      await testGameDetail(games[0].id);
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 API响应测试完成');

    // 总结
    console.log('\n📋 测试总结:');
    console.log('如果广告字段在数据库中存在但API没有返回，说明：');
    console.log('1. Sequelize模型定义可能缺少字段映射');
    console.log('2. API查询时可能没有包含这些字段');
    console.log('3. 数据库字段名与模型字段名不匹配');

  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:', error.message);
  }
};

// 运行测试
if (require.main === module) {
  console.log('🧪 API响应数据测试脚本');
  console.log('================================');
  console.log('此脚本将详细检查API返回的数据结构');
  console.log('================================');

  runAPITests()
    .then(() => {
      console.log('\n✅ 测试脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ 测试脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { runAPITests };