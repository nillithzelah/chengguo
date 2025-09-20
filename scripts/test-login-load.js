const axios = require('axios');
const { performance } = require('perf_hooks');

async function testLoginLoad() {
  const url = 'http://localhost:3000/api/user/login';
  const credentials = {
    username: 'admin',
    password: 'admin123'
  };
  const totalRequests = 1000;
  let successCount = 0;
  let totalTime = 0;
  let startTime = performance.now();

  console.log(`开始测试 ${totalRequests} 个顺序登录请求到 ${url}`);
  console.log('使用凭据:', credentials.username);

  for (let i = 1; i <= totalRequests; i++) {
    try {
      const requestStart = performance.now();
      const response = await axios.post(url, credentials);
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
  const totalDuration = (endTime - startTime) / 1000; // 秒
  const avgTime = totalTime / totalRequests;
  const successRate = (successCount / totalRequests) * 100;

  console.log('\n=== 测试结果 ===');
  console.log(`总请求数: ${totalRequests}`);
  console.log(`成功请求: ${successCount}`);
  console.log(`成功率: ${successRate.toFixed(2)}%`);
  console.log(`总耗时: ${totalDuration.toFixed(2)} 秒`);
  console.log(`平均响应时间: ${avgTime.toFixed(2)} ms`);
  console.log(`请求/秒: ${(totalRequests / totalDuration).toFixed(2)}`);
}