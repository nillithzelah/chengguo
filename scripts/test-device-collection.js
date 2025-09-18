// 测试设备信息收集功能
const axios = require('axios');

async function testDeviceCollection() {
  console.log('🧪 开始测试设备信息收集功能...\n');

  try {
    // 模拟荣耀手机的User-Agent
    const honorUA = 'Mozilla/5.0 (Linux; Android 10; HONOR V20 Build/HUAWEIV20; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/78.0.3904.62 XWEB/2571 MMWEBSDK/200201 Mobile Safari/537.36 MMWEBID/1234 MicroMessenger/7.0.12.1620(0x27000C32) Process/toolsmp WeChat/arm64 NetType/WIFI Language/zh_CN ABI/arm64';

    console.log('📱 模拟荣耀手机登录...');

    // 发送登录请求（包含荣耀手机的User-Agent）
    const response = await axios.post('http://localhost:3000/api/user/login', {
      username: 'admin',
      password: 'admin123'
    }, {
      headers: {
        'User-Agent': honorUA,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });

    console.log('✅ 登录响应:', {
      code: response.data.code,
      message: response.data.message,
      hasDeviceInfo: !!response.data.data?.deviceInfo
    });

    if (response.data.data?.deviceInfo) {
      console.log('📱 返回的设备信息:', {
        deviceBrand: response.data.data.deviceInfo.deviceBrand,
        deviceModel: response.data.data.deviceInfo.deviceModel,
        deviceType: response.data.data.deviceInfo.deviceType,
        lastLoginAt: response.data.data.deviceInfo.lastLoginAt
      });
    }

    // 验证荣耀手机是否被正确识别为"荣耀"品牌
    if (response.data.data?.deviceInfo?.deviceBrand === '荣耀') {
      console.log('🎉 成功！荣耀手机被正确识别为"荣耀"品牌');
    } else {
      console.log('❌ 失败！荣耀手机品牌识别不正确');
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);

    if (error.response) {
      console.error('📄 响应状态:', error.response.status);
      console.error('📄 响应数据:', error.response.data);
    }
  }
}

// 运行测试
if (require.main === module) {
  testDeviceCollection()
    .then(() => {
      console.log('\n🎉 设备信息收集测试完成');
    })
    .catch((error) => {
      console.error('❌ 测试执行失败:', error);
      process.exit(1);
    });
}

module.exports = testDeviceCollection;