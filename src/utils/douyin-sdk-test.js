// 抖音Open SDK测试工具
// 用于测试抖音小程序SDK的数据获取能力

export class DouyinSDKTest {

  constructor() {
    this.isInitialized = false;
    this.deviceInfo = null;
    this.userInfo = null;
    this.testResults = [];
  }

  // 初始化抖音SDK
  async initialize(appId) {
    try {
      console.log('🔄 初始化抖音Open SDK...');

      // 模拟抖音SDK初始化
      // 在实际项目中，这里需要集成真实的抖音小程序SDK
      await this.mockInitialize(appId);

      this.isInitialized = true;
      console.log('✅ 抖音Open SDK初始化成功');

      return {
        success: true,
        message: 'SDK初始化成功'
      };
    } catch (error) {
      console.error('❌ 抖音Open SDK初始化失败:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // 模拟SDK初始化
  async mockInitialize(appId) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (appId && appId.startsWith('tt')) {
          resolve();
        } else {
          reject(new Error('App ID格式不正确，应以tt开头'));
        }
      }, 1000);
    });
  }

  // 获取设备信息
  async getDeviceInfo() {
    try {
      console.log('📱 获取设备信息...');

      if (!this.isInitialized) {
        throw new Error('SDK未初始化，请先调用initialize方法');
      }

      // 模拟获取设备信息
      const deviceInfo = await this.mockGetDeviceInfo();

      this.deviceInfo = deviceInfo;
      this.logTestResult('getDeviceInfo', deviceInfo);

      console.log('✅ 设备信息获取成功:', deviceInfo);
      return deviceInfo;

    } catch (error) {
      console.error('❌ 获取设备信息失败:', error);
      this.logTestResult('getDeviceInfo', null, error.message);
      throw error;
    }
  }

  // 模拟获取设备信息（抖音小程序SDK）
  async mockGetDeviceInfo() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const deviceInfo = {
          // 设备基本信息
          deviceId: this.generateDeviceId(),
          deviceModel: this.getRandomDouyinDeviceModel(),
          osVersion: this.getRandomDouyinOSVersion(),
          platform: this.getDouyinPlatform(),

          // 屏幕信息
          screenWidth: window.screen.width,
          screenHeight: window.screen.height,
          pixelRatio: window.devicePixelRatio,
          statusBarHeight: this.getRandomStatusBarHeight(),

          // 网络信息
          networkType: this.getNetworkType(),
          wifiConnected: Math.random() > 0.3,

          // 抖音客户端信息
          douyinVersion: this.getRandomDouyinVersion(),
          sdkVersion: '2.0.0',

          // 语言和时区
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,

          // 其他信息
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),

          // 隐私保护：抖音SDK同样无法获取IP地址
          ip: null, // 隐私保护，无法获取
          location: null, // 隐私保护，无法获取精确位置

          // 抖音特有信息
          isDouyinApp: true,
          isMiniGame: true,
          safeArea: {
            top: 44,
            bottom: 34,
            left: 0,
            right: 0
          }
        };

        resolve(deviceInfo);
      }, 500);
    });
  }

  // 获取用户信息
  async getUserInfo() {
    try {
      console.log('👤 获取用户信息...');

      if (!this.isInitialized) {
        throw new Error('SDK未初始化');
      }

      const userInfo = await this.mockGetUserInfo();
      this.userInfo = userInfo;
      this.logTestResult('getUserInfo', userInfo);

      console.log('✅ 用户信息获取成功:', userInfo);
      return userInfo;

    } catch (error) {
      console.error('❌ 获取用户信息失败:', error);
      this.logTestResult('getUserInfo', null, error.message);
      throw error;
    }
  }

  // 模拟获取用户信息
  async mockGetUserInfo() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const userInfo = {
          openId: this.generateOpenId(),
          unionId: this.generateUnionId(),
          nickName: this.getRandomNickName(),
          avatarUrl: `https://example.com/avatar/${Math.floor(Math.random() * 1000)}.jpg`,
          gender: Math.random() > 0.5 ? 1 : 2, // 1: 男, 2: 女
          province: this.getRandomProvince(),
          city: this.getRandomCity(),
          country: '中国',

          // 抖音特有字段
          isDouyinUser: true,
          followerCount: Math.floor(Math.random() * 10000),
          followingCount: Math.floor(Math.random() * 500),
          likeCount: Math.floor(Math.random() * 5000),

          timestamp: new Date().toISOString()
        };

        resolve(userInfo);
      }, 600);
    });
  }

  // 获取广告数据（模拟抖音广告统计）
  async getAdData(adUnitId) {
    try {
      console.log('📊 获取广告数据...');

      if (!this.isInitialized) {
        throw new Error('SDK未初始化');
      }

      const adData = await this.mockGetAdData(adUnitId);
      this.logTestResult('getAdData', adData);

      console.log('✅ 广告数据获取成功:', adData);
      return adData;

    } catch (error) {
      console.error('❌ 获取广告数据失败:', error);
      this.logTestResult('getAdData', null, error.message);
      throw error;
    }
  }

  // 模拟获取广告数据
  async mockGetAdData(adUnitId) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const adData = {
          adUnitId: adUnitId,
          adId: this.generateAdId(),
          adType: this.getRandomDouyinAdType(),
          ecpm: Math.random() * 100 + 50, // 50-150之间的随机eCPM
          currency: 'CNY',
          impressions: Math.floor(Math.random() * 1000),
          clicks: Math.floor(Math.random() * 100),
          revenue: Math.random() * 1000,
          fillRate: Math.random() * 0.5 + 0.5, // 50%-100%的填充率

          // 受众统计数据（抖音用户特征）
          audienceStats: {
            ageGroups: {
              '18-24': Math.random() * 0.4 + 0.2,
              '25-34': Math.random() * 0.4 + 0.1,
              '35-44': Math.random() * 0.3 + 0.1,
              '45+': Math.random() * 0.2
            },
            gender: {
              male: Math.random() * 0.6 + 0.1,
              female: Math.random() * 0.6 + 0.2
            },
            regions: this.getRandomDouyinRegions(),
            interests: this.getRandomInterests(),
            deviceTypes: {
              iOS: Math.random() * 0.7 + 0.1,
              Android: Math.random() * 0.8 + 0.1,
              other: Math.random() * 0.1
            }
          },

          // 抖音特有数据
          videoViews: Math.floor(Math.random() * 5000),
          videoLikes: Math.floor(Math.random() * 500),
          videoShares: Math.floor(Math.random() * 50),

          timestamp: new Date().toISOString()
        };

        resolve(adData);
      }, 800);
    });
  }

  // 综合测试
  async runFullTest(appId, adUnitId) {
    console.log('🚀 开始抖音Open SDK综合测试...');

    const results = {
      initialization: null,
      deviceInfo: null,
      userInfo: null,
      adData: null,
      summary: null
    };

    try {
      // 1. 初始化测试
      results.initialization = await this.initialize(appId);

      // 2. 获取设备信息
      results.deviceInfo = await this.getDeviceInfo();

      // 3. 获取用户信息
      results.userInfo = await this.getUserInfo();

      // 4. 获取广告数据
      results.adData = await this.getAdData(adUnitId);

      // 5. 生成测试总结
      results.summary = this.generateTestSummary();

      console.log('✅ 综合测试完成');
      return results;

    } catch (error) {
      console.error('❌ 综合测试失败:', error);
      results.summary = {
        success: false,
        error: error.message,
        totalTests: 4,
        passedTests: 0
      };
      return results;
    }
  }

  // 生成测试总结
  generateTestSummary() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;

    return {
      success: passedTests === totalTests,
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      testResults: this.testResults,
      dataCapabilities: {
        deviceInfo: '✅ 可获取设备型号、系统版本、屏幕信息等',
        userInfo: '✅ 可获取用户信息（需用户授权）',
        networkInfo: '✅ 可获取网络类型、连接状态',
        ipAddress: '❌ 隐私保护，无法获取',
        location: '❌ 隐私保护，无法获取精确位置',
        douyinSpecific: '✅ 可获取抖音特有数据（关注数、点赞数等）',
        audienceStats: '✅ 可获取年龄、性别、地域等统计数据'
      }
    };
  }

  // 记录测试结果
  logTestResult(testName, data, error = null) {
    this.testResults.push({
      testName,
      success: !error,
      data: data,
      error: error,
      timestamp: new Date().toISOString()
    });
  }

  // 工具方法
  generateDeviceId() {
    return 'device_' + Math.random().toString(36).substr(2, 9);
  }

  generateOpenId() {
    return 'open_' + Math.random().toString(36).substr(2, 9);
  }

  generateUnionId() {
    return 'union_' + Math.random().toString(36).substr(2, 9);
  }

  generateAdId() {
    return 'ad_' + Math.random().toString(36).substr(2, 9);
  }

  getRandomDouyinDeviceModel() {
    const models = [
      'iPhone 14', 'iPhone 13', 'iPhone 12', 'iPhone 11',
      '华为Mate 50', '华为P50', '小米13', '小米12',
      'OPPO Find X6', 'vivo X80', '荣耀Magic 4',
      '三星Galaxy S23', '一加11'
    ];
    return models[Math.floor(Math.random() * models.length)];
  }

  getRandomDouyinOSVersion() {
    const versions = [
      'iOS 17.0', 'iOS 16.5', 'iOS 15.7',
      'Android 13', 'Android 12', 'Android 11', 'HarmonyOS 3.0'
    ];
    return versions[Math.floor(Math.random() * versions.length)];
  }

  getDouyinPlatform() {
    return /iPhone|iPad|iPod/.test(navigator.userAgent) ? 'iOS' : 'Android';
  }

  getRandomStatusBarHeight() {
    return Math.floor(Math.random() * 20) + 20; // 20-40px
  }

  getRandomDouyinVersion() {
    const versions = ['25.1.0', '24.9.0', '24.8.0', '24.7.0'];
    return versions[Math.floor(Math.random() * versions.length)];
  }

  getNetworkType() {
    const types = ['wifi', '4g', '5g', '3g', '2g'];
    return types[Math.floor(Math.random() * types.length)];
  }

  getRandomNickName() {
    const names = ['小明', '小红', '小刚', '小丽', '小王', '小张', '小李'];
    const suffixes = ['的抖音', '的小游戏', '的粉丝', '', ''];
    const name = names[Math.floor(Math.random() * names.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    return name + suffix;
  }

  getRandomProvince() {
    const provinces = ['北京', '上海', '广东', '江苏', '浙江', '山东', '河南', '湖北', '湖南', '四川'];
    return provinces[Math.floor(Math.random() * provinces.length)];
  }

  getRandomCity() {
    const cities = ['北京市', '上海市', '广州市', '深圳市', '杭州市', '南京市', '成都市', '武汉市', '西安市', '重庆市'];
    return cities[Math.floor(Math.random() * cities.length)];
  }

  getRandomDouyinRegions() {
    const regions = {
      '北京': Math.random() * 0.12 + 0.03,
      '上海': Math.random() * 0.10 + 0.02,
      '广东': Math.random() * 0.15 + 0.05,
      '江苏': Math.random() * 0.08 + 0.02,
      '浙江': Math.random() * 0.08 + 0.02,
      '其他': Math.random() * 0.4 + 0.1
    };
    return regions;
  }

  getRandomInterests() {
    const interests = ['游戏', '娱乐', '美食', '旅行', '音乐', '电影', '体育', '科技'];
    const result = {};
    interests.forEach(interest => {
      result[interest] = Math.random() * 0.5 + 0.1;
    });
    return result;
  }

  getRandomDouyinAdType() {
    const types = ['rewarded', 'interstitial', 'banner', 'native', 'splash'];
    return types[Math.floor(Math.random() * types.length)];
  }

  // 获取测试历史
  getTestHistory() {
    return this.testResults;
  }

  // 清除测试历史
  clearTestHistory() {
    this.testResults = [];
  }
}

// 导出单例实例
export const douyinSDKTest = new DouyinSDKTest();