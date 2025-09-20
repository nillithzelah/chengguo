const axios = require('axios');
const { performance } = require('perf_hooks');

async function getAuthToken() {
  const loginUrl = 'http://localhost:3000/api/user/login';
  const credentials = {
    username: 'admin',
    password: 'admin123'
  };

  try {
    const response = await axios.post(loginUrl, credentials);
    if (response.data.code === 20000) {
      return response.data.data.token;
    } else {
      throw new Error('登录失败');
    }
  } catch (error) {
    console.error('获取 token 失败:', error.message);
    process.exit(1);
  }
}

async function testGameListLoad(token) {
  const url = 'http://localhost:3000/api/game/list';
  const totalRequests = 1000;
  let successCount = 0;
  let totalTime = 0;
  let startTime = performance.now();

  console.log(`开始测试 ${totalRequests} 个顺序 GET 请求到 ${url}`);

  for (let i = 1; i <= totalRequests; i++) {
    try {
      const requestStart = performance.now();
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const requestEnd = performance.now();
      const requestTime = requestEnd - requestStart;

      if (response.status === 200 && response.data.code === 20000) {
        successCount++;
      } else {
        console.error(`请求 ${i} 失败:`, response.status, response.data);
      }

      totalTime += requestTime;

      if (i % 100 === 0) {
        console.log(`已完成 ${i}/${totalRequests} 请求`);
      }
    } catch (error) {
      console.error(`请求 ${i} 异常:`, error.message);
    }
  }

  const endTime = performance.now();
  const totalDuration = (endTime - startTime) / 1000;
  const avgTime = totalTime / totalRequests;
  const successRate = (successCount / totalRequests) * 100;

  console.log('\n=== /api/game/list 测试结果 ===');
  console.log(`总请求数: ${totalRequests}`);
  console.log(`成功请求: ${successCount}`);
  console.log(`成功率: ${successRate.toFixed(2)}%`);
  console.log(`总耗时: ${totalDuration.toFixed(2)} 秒`);
  console.log(`平均响应时间: ${avgTime.toFixed(2)} ms`);
  console.log(`请求/秒: ${(totalRequests / totalDuration).toFixed(2)}`);
}

async function testUserBasicListLoad(token) {
  const url = 'http://localhost:3000/api/user/basic-list';
  const totalRequests = 1000;
  let successCount = 0;
  let totalTime = 0;
  let startTime = performance.now();

  console.log(`开始测试 ${totalRequests} 个顺序 GET 请求到 ${url}`);

  for (let i = 1; i <= totalRequests; i++) {
    try {
      const requestStart = performance.now();
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const requestEnd = performance.now();
      const requestTime = requestEnd - requestStart;

      if (response.status === 200 && response.data.code === 20000) {
        successCount++;
      } else {
        console.error(`请求 ${i} 失败:`, response.status, response.data);
      }

      totalTime += requestTime;

      if (i % 100 === 0) {
        console.log(`已完成 ${i}/${totalRequests} 请求`);
      }
    } catch (error) {
      console.error(`请求 ${i} 异常:`, error.message);
    }
  }

  const endTime = performance.now();
  const totalDuration = (endTime - startTime) / 1000;
  const avgTime = totalTime / totalRequests;
  const successRate = (successCount / totalRequests) * 100;

  console.log('\n=== /api/user/basic-list 测试结果 ===');
  console.log(`总请求数: ${totalRequests}`);
  console.log(`成功请求: ${successCount}`);
  console.log(`成功率: ${successRate.toFixed(2)}%`);
  console.log(`总耗时: ${totalDuration.toFixed(2)} 秒`);
  console.log(`平均响应时间: ${avgTime.toFixed(2)} ms`);
  console.log(`请求/秒: ${(totalRequests / totalDuration).toFixed(2)}`);
}

async function main() {
  console.log('开始游戏管理页面负载测试');
  const token = await getAuthToken();
  console.log('✅ 获取 token 成功');

  await testGameListLoad(token);
  await testUserBasicListLoad(token);

  console.log('\n🎉 测试完成');
}

main().catch(console.error);