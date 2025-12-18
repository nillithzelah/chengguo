// 测试连接API调试脚本
const testConnection = async (appid, secret) => {
  console.log('🔍 开始测试连接API...');
  console.log('📋 参数:', { appid, secret: secret.substring(0, 10) + '...' });

  try {
    const response = await fetch('/api/douyin/test-connection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        appid: appid,
        secret: secret
      })
    });

    console.log('📡 HTTP响应状态:', response.status);
    console.log('📡 HTTP响应头:', Object.fromEntries(response.headers.entries()));

    const result = await response.json();
    console.log('📄 响应数据:', result);

    // 检查各种成功条件
    const isSuccess = response.ok && (result.code === 0 || result.err_no === 0);
    console.log('✅ 成功判断:', isSuccess);

    if (isSuccess) {
      console.log('🎉 测试成功!');
      return { success: true, data: result };
    } else {
      console.log('❌ 测试失败!');
      return { success: false, error: result.err_tips || result.message || '未知错误' };
    }

  } catch (error) {
    console.error('❌ 网络错误:', error);
    return { success: false, error: error.message };
  }
};

// 测试函数
const runTest = async () => {
  // 使用示例数据进行测试
  const testAppId = 'tt8c62fadf136c334702';
  const testSecret = '969c80995b1fc13fdbe952d73fb9f8c086706b6b';

  console.log('🚀 开始测试连接API...');
  const result = await testConnection(testAppId, testSecret);

  if (result.success) {
    console.log('✅ API测试成功!');
  } else {
    console.log('❌ API测试失败:', result.error);
  }
};

// 如果在浏览器中运行
if (typeof window !== 'undefined') {
  window.testConnectionAPI = runTest;
  console.log('💡 在浏览器控制台中运行 testConnectionAPI() 来测试API');
} else {
  // 如果在Node.js中运行
  runTest();
}