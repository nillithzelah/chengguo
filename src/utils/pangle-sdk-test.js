// 穿山甲SDK测试工具
// 用于测试穿山甲SDK的数据获取能力

export class PangleSDKTest {

  constructor() {
    this.isInitialized = false;
    this.deviceInfo = null;
    this.testResults = [];
  }

  // 初始化穿山甲SDK
  async initialize(appId) {
    try {
      console.log('🔄 初始化穿山甲SDK...');

      // 模拟穿山甲SDK初始化
      // 在实际项目中，这里需要集成真实的穿山甲SDK
      await this.mockInitialize(appId);

      this.isInitialized = true;
      console.log('✅ 穿山甲SDK初始化成功');

      return {
        success: true,
        message: 'SDK初始化成功'
      };
    } catch (error) {
      console.error('❌ 穿山甲SDK初始化失败:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // 模拟SDK初始化（用于测试）
  async mockInitialize(appId) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (appId) {
          resolve();
        } else {
          reject(new Error('App ID不能为空'));
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

  // 模拟获取设备信息
  async mockGetDeviceInfo() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const deviceInfo = {
          // 设备基本信息
          deviceId: this.generateDeviceId(),
          deviceModel: this.getRandomDeviceModel(),
          osVersion: this.getRandomOSVersion(),
          platform: this.getPlatform(),

          // 屏幕信息
          screenWidth: window.screen.width,
          screenHeight: window.screen.height,
          pixelRatio: window.devicePixelRatio,

          // 网络信息
          networkType: this.getNetworkType(),
          carrier: this.getRandomCarrier(),

          // 语言和时区
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,

          // 其他信息
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),

          // 注意：穿山甲SDK同样无法获取IP地址
          ip: null, // 隐私保护，无法获取
          location: null // 隐私保护，无法获取精确位置
        };

        resolve(deviceInfo);
      }, 500);
    });
  }

  // 获取广告数据
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
          adType: this.getRandomAdType(),
          ecpm: Math.random() * 100 + 50, // 50-150之间的随机eCPM
          currency: 'CNY',
          impressions: Math.floor(Math.random() * 1000),
          clicks: Math.floor(Math.random() * 100),
          revenue: Math.random() * 1000,
          fillRate: Math.random() * 0.5 + 0.5, // 50%-100%的填充率

          // 受众统计数据
          audienceStats: {
            ageGroups: {
              '18-24': Math.random() * 0.4 + 0.1,
              '25-34': Math.random() * 0.4 + 0.2,
              '35-44': Math.random() * 0.3 + 0.1,
              '45+': Math.random() * 0.2
            },
            gender: {
              male: Math.random() * 0.6 + 0.2,
              female: Math.random() * 0.6 + 0.2
            },
            regions: this.getRandomRegions(),
            deviceTypes: {
              iOS: Math.random() * 0.7 + 0.1,
              Android: Math.random() * 0.8 + 0.1,
              other: Math.random() * 0.1
            }
          },

          timestamp: new Date().toISOString()
        };

        resolve(adData);
      }, 800);
    });
  }

  // 综合测试
  async runFullTest(appId, adUnitId) {
    console.log('🚀 开始穿山甲SDK综合测试...');

    const results = {
      initialization: null,
      deviceInfo: null,
      adData: null,
      summary: null
    };

    try {
      // 1. 初始化测试
      results.initialization = await this.initialize(appId);

      // 2. 设备信息测试
      results.deviceInfo = await this.getDeviceInfo();

      // 3. 广告数据测试
      results.adData = await this.getAdData(adUnitId);

      // 4. 生成测试总结
      results.summary = this.generateTestSummary();

      console.log('✅ 综合测试完成');
      return results;

    } catch (error) {
      console.error('❌ 综合测试失败:', error);
      results.summary = {
        success: false,
        error: error.message,
        totalTests: 3,
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
        networkInfo: '✅ 可获取网络类型、运营商信息',
        ipAddress: '❌ 隐私保护，无法获取',
        location: '❌ 隐私保护，无法获取精确位置',
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

  generateAdId() {
    return 'ad_' + Math.random().toString(36).substr(2, 9);
  }

  getRandomDeviceModel() {
    const models = [
      'iPhone 14', 'iPhone 13', 'iPhone 12', 'iPhone 11',
      'Samsung Galaxy S22', 'Samsung Galaxy S21', 'Samsung Galaxy Note 20',
      'Huawei Mate 40', 'Huawei P40', 'Xiaomi 12', 'Xiaomi 11',
      'OPPO Find X5', 'vivo X70'
    ];
    return models[Math.floor(Math.random() * models.length)];
  }

  getRandomOSVersion() {
    const versions = [
      'iOS 16.0', 'iOS 15.5', 'iOS 14.8',
      'Android 13', 'Android 12', 'Android 11', 'Android 10'
    ];
    return versions[Math.floor(Math.random() * versions.length)];
  }

  getPlatform() {
    return /iPhone|iPad|iPod/.test(navigator.userAgent) ? 'iOS' : 'Android';
  }

  getNetworkType() {
    // 模拟网络类型检测
    const types = ['wifi', '4g', '3g', '2g'];
    return types[Math.floor(Math.random() * types.length)];
  }

  getRandomCarrier() {
    const carriers = ['中国移动', '中国联通', '中国电信'];
    return carriers[Math.floor(Math.random() * carriers.length)];
  }

  getRandomAdType() {
    const types = ['banner', 'interstitial', 'rewarded', 'native'];
    return types[Math.floor(Math.random() * types.length)];
  }

  getRandomRegions() {
    const regions = {
      '北京': Math.random() * 0.15 + 0.05,
      '上海': Math.random() * 0.12 + 0.03,
      '广州': Math.random() * 0.1 + 0.02,
      '深圳': Math.random() * 0.08 + 0.02,
      '其他': Math.random() * 0.3 + 0.1
    };
    return regions;
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
export const pangleSDKTest = new PangleSDKTest();