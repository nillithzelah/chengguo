// 抖音小游戏设备信息收集集成示例
// 在真实的抖音小游戏项目中使用

export class DouyinMiniGameIntegration {

  constructor() {
    this.deviceInfo = null;
    this.userInfo = null;
    this.adData = [];
  }

  // 初始化 - 在小游戏启动时调用
  async initialize() {
    console.log('🚀 初始化抖音小游戏设备信息收集...');

    try {
      // 1. 获取设备信息
      await this.collectDeviceInfo();

      // 2. 检查用户登录状态
      await this.checkUserLogin();

      // 3. 设置广告事件监听
      this.setupAdEventListeners();

      console.log('✅ 抖音小游戏集成初始化完成');
    } catch (error) {
      console.error('❌ 初始化失败:', error);
    }
  }

  // 收集设备信息
  async collectDeviceInfo() {
    try {
      console.log('📱 收集设备信息...');

      // 使用抖音小程序的同步API获取系统信息
      const systemInfo = tt.getSystemInfoSync();
      console.log('📊 系统信息:', systemInfo);

      this.deviceInfo = {
        // 基础设备信息
        deviceModel: systemInfo.model,
        platform: systemInfo.platform,
        systemVersion: systemInfo.system,
        screenWidth: systemInfo.screenWidth,
        screenHeight: systemInfo.screenHeight,
        pixelRatio: systemInfo.pixelRatio,
        statusBarHeight: systemInfo.statusBarHeight,
        windowWidth: systemInfo.windowWidth,
        windowHeight: systemInfo.windowHeight,

        // 抖音特有信息
        douyinVersion: systemInfo.version,
        SDKVersion: systemInfo.SDKVersion,
        language: systemInfo.language,

        // 时间戳
        collectedAt: new Date().toISOString()
      };

      // 获取网络信息（异步）
      const networkInfo = await this.getNetworkInfo();
      this.deviceInfo.networkType = networkInfo.networkType;
      this.deviceInfo.isConnected = networkInfo.isConnected;

      console.log('✅ 设备信息收集完成:', this.deviceInfo);

      // 上报设备信息到服务器
      await this.reportDeviceInfo();

    } catch (error) {
      console.error('❌ 收集设备信息失败:', error);
    }
  }

  // 获取网络信息
  async getNetworkInfo() {
    return new Promise((resolve) => {
      tt.getNetworkType({
        success: (res) => {
          resolve({
            networkType: res.networkType,
            isConnected: res.isConnected
          });
        },
        fail: () => {
          resolve({
            networkType: 'unknown',
            isConnected: false
          });
        }
      });
    });
  }

  // 检查用户登录状态
  async checkUserLogin() {
    return new Promise((resolve) => {
      tt.getLoginState({
        success: (res) => {
          if (res.isLogin) {
            console.log('✅ 用户已登录');
            // 可以获取用户信息
            this.getUserInfo();
          } else {
            console.log('⚠️ 用户未登录');
            // 可以引导用户登录
            this.promptUserLogin();
          }
          resolve(res.isLogin);
        },
        fail: () => {
          console.log('⚠️ 无法检查登录状态');
          resolve(false);
        }
      });
    });
  }

  // 获取用户信息
  async getUserInfo() {
    return new Promise((resolve) => {
      tt.getUserInfo({
        success: (res) => {
          console.log('👤 获取到用户信息:', res);

          this.userInfo = {
            openId: res.openId,
            unionId: res.unionId,
            nickName: res.nickName,
            avatarUrl: res.avatarUrl,
            gender: res.gender,
            province: res.province,
            city: res.city,
            country: res.country,
            collectedAt: new Date().toISOString()
          };

          // 上报用户信息到服务器
          this.reportUserInfo();
          resolve(this.userInfo);
        },
        fail: (err) => {
          console.log('❌ 获取用户信息失败:', err.errMsg);
          resolve(null);
        }
      });
    });
  }

  // 引导用户登录
  promptUserLogin() {
    tt.showModal({
      title: '登录提示',
      content: '登录后可以获得更好的体验，是否现在登录？',
      success: (res) => {
        if (res.confirm) {
          tt.login({
            success: (res) => {
              console.log('🔑 登录成功:', res);
              // 登录成功后重新获取用户信息
              this.getUserInfo();
            },
            fail: (err) => {
              console.log('❌ 登录失败:', err.errMsg);
            }
          });
        }
      }
    });
  }

  // 设置广告事件监听
  setupAdEventListeners() {
    console.log('📺 设置广告事件监听...');

    // 监听广告展示事件
    this.onAdShow = (adData) => {
      console.log('📺 广告展示:', adData);
      this.recordAdEvent('show', adData);
    };

    // 监听广告点击事件
    this.onAdClick = (adData) => {
      console.log('👆 广告点击:', adData);
      this.recordAdEvent('click', adData);
    };

    // 监听广告关闭事件
    this.onAdClose = (adData) => {
      console.log('❌ 广告关闭:', adData);
      this.recordAdEvent('close', adData);
    };
  }

  // 记录广告事件
  recordAdEvent(eventType, adData) {
    const eventRecord = {
      eventType,
      adId: adData.adId,
      adUnitId: adData.adUnitId,
      timestamp: new Date().toISOString(),
      deviceInfo: this.deviceInfo,
      userInfo: this.userInfo,
      // 不包含IP地址，符合隐私要求
    };

    this.adData.push(eventRecord);

    // 上报广告事件到服务器
    this.reportAdEvent(eventRecord);

    console.log(`📊 记录广告${eventType}事件:`, eventRecord);
  }

  // 显示广告
  async showAd(adUnitId) {
    return new Promise((resolve, reject) => {
      tt.showInterstitialAd({
        adUnitId: adUnitId,
        success: (res) => {
          console.log('✅ 广告展示成功:', res);

          // 记录广告展示事件
          this.onAdShow({
            adId: res.adId,
            adUnitId: adUnitId
          });

          resolve(res);
        },
        fail: (err) => {
          console.log('❌ 广告展示失败:', err.errMsg);
          reject(new Error(err.errMsg));
        }
      });
    });
  }

  // 上报设备信息到服务器
  async reportDeviceInfo() {
    if (!this.deviceInfo) return;

    try {
      const response = await fetch('/api/device-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceInfo: this.deviceInfo,
          userInfo: this.userInfo
        })
      });

      if (response.ok) {
        console.log('✅ 设备信息上报成功');
      } else {
        console.log('⚠️ 设备信息上报失败');
      }
    } catch (error) {
      console.log('⚠️ 设备信息上报异常:', error);
    }
  }

  // 上报用户信息到服务器
  async reportUserInfo() {
    if (!this.userInfo) return;

    try {
      const response = await fetch('/api/user-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.userInfo)
      });

      if (response.ok) {
        console.log('✅ 用户信息上报成功');
      } else {
        console.log('⚠️ 用户信息上报失败');
      }
    } catch (error) {
      console.log('⚠️ 用户信息上报异常:', error);
    }
  }

  // 上报广告事件到服务器
  async reportAdEvent(eventData) {
    try {
      const response = await fetch('/api/ad-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData)
      });

      if (response.ok) {
        console.log('✅ 广告事件上报成功');
      } else {
        console.log('⚠️ 广告事件上报失败');
      }
    } catch (error) {
      console.log('⚠️ 广告事件上报异常:', error);
    }
  }

  // 获取收集到的所有数据
  getCollectedData() {
    return {
      deviceInfo: this.deviceInfo,
      userInfo: this.userInfo,
      adData: this.adData,
      summary: {
        totalAdEvents: this.adData.length,
        collectedAt: new Date().toISOString()
      }
    };
  }

  // 清除收集的数据
  clearData() {
    this.deviceInfo = null;
    this.userInfo = null;
    this.adData = [];
  }
}

// 使用示例
export const douyinIntegration = new DouyinMiniGameIntegration();

// 在小游戏启动时初始化
// douyinIntegration.initialize();

// 在需要显示广告时调用
// await douyinIntegration.showAd('your-ad-unit-id');

// 获取收集到的数据
// const data = douyinIntegration.getCollectedData();