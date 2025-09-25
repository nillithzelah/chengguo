// 抖音API Token刷新逻辑
// 从server.js中提取的刷新token相关代码

// 全局Token变量
let currentAccessToken = '2c8fbb0bedb3b71efc0525ffe000bc79a7533168';
let currentRefreshToken = '857b246c6868b17e556892edf5826f8342408de5';
let tokenLastRefresh = new Date();

// Token刷新函数
async function refreshAccessToken() {
  try {
    console.log('🔄 开始刷新access_token...');

    const refreshRequestData = {
      app_id: '1843500894701081', // 应用ID
      appid: 'tt8c62fadf136c334702', // 小游戏App ID (保持字符串格式)
      secret: '7ad00307b2596397ceeee3560ca8bfc9b3622476', // App Secret
      refresh_token: currentRefreshToken, // 使用当前refresh_token
      grant_type: 'refresh_token'
    };

    console.log('📤 刷新token请求参数:', JSON.stringify(refreshRequestData, null, 2));

    const axios = require('axios');
    const refreshResponse = await axios.post('https://api.oceanengine.com/open_api/oauth2/refresh_token/', refreshRequestData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    console.log('📥 刷新token响应:', JSON.stringify(refreshResponse.data, null, 2));

    if (refreshResponse.data.code === 0 && refreshResponse.data.data) {
      const newAccessToken = refreshResponse.data.data.access_token;
      const newRefreshToken = refreshResponse.data.data.refresh_token;

      // 更新全局token变量
      currentAccessToken = newAccessToken;
      currentRefreshToken = newRefreshToken;
      tokenLastRefresh = new Date();

      console.log('✅ Token刷新成功，已更新全局变量');
      console.log('📅 下次刷新时间:', new Date(Date.now() + 12 * 60 * 60 * 1000).toLocaleString('zh-CN'));

      return {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        expires_in: refreshResponse.data.data.expires_in
      };
    } else {
      console.error('❌ Token刷新失败:', refreshResponse.data.message);
      throw new Error(refreshResponse.data.message || 'Token刷新失败');
    }
  } catch (error) {
    console.error('❌ Token刷新异常:', error.message);
    throw error;
  }
}

// 定时刷新Token的函数
function startTokenRefreshScheduler() {
  console.log('⏰ 启动Token自动刷新调度器...');
  console.log('📅 刷新间隔: 12小时');
  console.log('📅 下次刷新时间:', new Date(Date.now() + 12 * 60 * 60 * 1000).toLocaleString('zh-CN'));

  // 每12小时刷新一次 (12 * 60 * 60 * 1000 = 43200000毫秒)
  setInterval(async () => {
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 5 * 60 * 1000; // 5分钟重试间隔

    while (retryCount < maxRetries) {
      try {
        console.log(`⏰ 定时器触发，开始刷新Token... (尝试 ${retryCount + 1}/${maxRetries})`);
        await refreshAccessToken();
        console.log('✅ 定时刷新Token成功');
        break; // 成功后跳出重试循环
      } catch (error) {
        retryCount++;
        console.error(`❌ 定时刷新Token失败 (尝试 ${retryCount}/${maxRetries}):`, error.message);

        if (retryCount < maxRetries) {
          console.log(`⏳ ${retryDelay / 1000}秒后重试...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        } else {
          console.error('❌ Token刷新失败，已达到最大重试次数，请手动检查配置');
          // 这里可以添加告警机制，比如发送邮件或消息通知
        }
      }
    }
  }, 12 * 60 * 60 * 1000); // 12小时

  console.log('✅ Token自动刷新调度器已启动');
}

// 获取Token状态
function getTokenStatus() {
  const nextRefreshTime = new Date(tokenLastRefresh.getTime() + 12 * 60 * 60 * 1000);
  const timeUntilRefresh = nextRefreshTime.getTime() - Date.now();

  return {
    current_access_token: currentAccessToken.substring(0, 20) + '...',
    current_refresh_token: currentRefreshToken.substring(0, 20) + '...',
    last_refresh: tokenLastRefresh.toISOString(),
    next_refresh: nextRefreshTime.toISOString(),
    time_until_refresh_seconds: Math.max(0, Math.floor(timeUntilRefresh / 1000)),
    time_until_refresh_formatted: formatTimeUntilRefresh(timeUntilRefresh),
    auto_refresh_enabled: true,
    refresh_interval_hours: 12
  };
}

// 格式化剩余时间
function formatTimeUntilRefresh(milliseconds) {
  if (milliseconds <= 0) return '即将刷新';

  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

  return `${hours}小时${minutes}分钟${seconds}秒`;
}

// 导出函数
module.exports = {
  refreshAccessToken,
  startTokenRefreshScheduler,
  getTokenStatus,
  getCurrentTokens: () => ({
    accessToken: currentAccessToken,
    refreshToken: currentRefreshToken,
    lastRefresh: tokenLastRefresh
  })
};

// 如果直接运行此文件，则启动调度器
if (require.main === module) {
  console.log('🚀 启动Token刷新调度器...');
  startTokenRefreshScheduler();

  // 每分钟输出一次状态
  setInterval(() => {
    console.log('📊 Token状态:', getTokenStatus());
  }, 60 * 1000);
}