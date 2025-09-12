// 抖音小游戏真实集成示例
// 这个文件展示了如何在真实的抖音小游戏中获取设备信息

// 页面代码 (game.js 或 main.js)
class GameMain {

  constructor() {
    this.deviceInfo = null;
    this.userInfo = null;
    this.adData = [];
  }

  // 游戏初始化
  async onLoad() {
    console.log('🎮 抖音小游戏启动');

    try {
      // 1. 检查是否在抖音环境中
      if (typeof tt === 'undefined') {
        console.error('❌ 请在抖音小程序环境中运行');
        return;
      }

      console.log('✅ 检测到抖音环境，版本:', tt.SDKVersion);

      // 2. 初始化游戏
      await this.initializeGame();

      // 3. 收集设备信息
      await this.collectDeviceInfo();

      // 4. 尝试获取用户信息
      await this.tryGetUserInfo();

      // 5. 设置广告监听
      this.setupAdListeners();

      console.log('🚀 游戏初始化完成');

    } catch (error) {
      console.error('❌ 游戏初始化失败:', error);
    }
  }

  // 初始化游戏
  async initializeGame() {
    return new Promise((resolve) => {
      // 抖音小游戏初始化
      tt.onShow(() => {
        console.log('📱 小游戏显示');
      });

      tt.onHide(() => {
        console.log('📱 小游戏隐藏');
      });

      resolve();
    });
  }

  // 收集设备信息
  async collectDeviceInfo() {
    try {
      console.log('📱 开始收集设备信息...');

      // 获取系统信息
      const systemInfo = await this.getSystemInfo();
      console.log('📊 系统信息:', systemInfo);

      // 获取网络信息
      const networkInfo = await this.getNetworkInfo();
      console.log('📶 网络信息:', networkInfo);

      // 合并信息
      this.deviceInfo = {
        ...systemInfo,
        ...networkInfo,
        collectedAt: new Date().toISOString(),
        environment: 'douyin_mini_game'
      };

      // 上报设备信息到服务器
      await this.reportData('/api/device-info', this.deviceInfo);

      console.log('✅ 设备信息收集完成');

    } catch (error) {
      console.error('❌ 设备信息收集失败:', error);
    }
  }

  // 获取系统信息
  getSystemInfo() {
    return new Promise((resolve, reject) => {
      tt.getSystemInfo({
        success: (res) => {
          resolve({
            deviceModel: res.model,
            platform: res.platform,
            systemVersion: res.system,
            douyinVersion: res.version,
            SDKVersion: res.SDKVersion,
            screenWidth: res.screenWidth,
            screenHeight: res.screenHeight,
            pixelRatio: res.pixelRatio,
            statusBarHeight: res.statusBarHeight,
            windowWidth: res.windowWidth,
            windowHeight: res.windowHeight,
            safeArea: res.safeArea,
            language: res.language
          });
        },
        fail: (err) => {
          reject(new Error('获取系统信息失败: ' + err.errMsg));
        }
      });
    });
  }

  // 获取网络信息
  getNetworkInfo() {
    return new Promise((resolve, reject) => {
      tt.getNetworkType({
        success: (res) => {
          resolve({
            networkType: res.networkType,
            isConnected: res.isConnected
          });
        },
        fail: (err) => {
          reject(new Error('获取网络信息失败: ' + err.errMsg));
        }
      });
    });
  }

  // 尝试获取用户信息
  async tryGetUserInfo() {
    try {
      console.log('👤 尝试获取用户信息...');

      // 检查登录状态
      const loginState = await this.checkLoginState();

      if (loginState.isLogin) {
        // 已登录，获取用户信息
        const userInfo = await this.getUserInfo();
        this.userInfo = userInfo;

        // 上报用户信息
        await this.reportData('/api/user-info', userInfo);

        console.log('✅ 用户信息获取成功');
      } else {
        console.log('⚠️ 用户未登录，跳过用户信息获取');
        // 可以在这里调用登录流程
        // await this.loginUser();
      }

    } catch (error) {
      console.error('❌ 获取用户信息失败:', error);
    }
  }

  // 检查登录状态
  checkLoginState() {
    return new Promise((resolve, reject) => {
      tt.getLoginState({
        success: (res) => {
          resolve(res);
        },
        fail: (err) => {
          reject(new Error('检查登录状态失败: ' + err.errMsg));
        }
      });
    });
  }

  // 获取用户信息
  getUserInfo() {
    return new Promise((resolve, reject) => {
      tt.getUserInfo({
        success: (res) => {
          resolve({
            openId: res.openId,
            unionId: res.unionId,
            nickName: res.nickName,
            avatarUrl: res.avatarUrl,
            gender: res.gender,
            province: res.province,
            city: res.city,
            country: res.country,
            collectedAt: new Date().toISOString()
          });
        },
        fail: (err) => {
          reject(new Error('获取用户信息失败: ' + err.errMsg));
        }
      });
    });
  }

  // 用户登录
  async loginUser() {
    try {
      console.log('🔑 开始用户登录...');

      const loginResult = await this.performLogin();

      // 使用登录code获取用户信息
      const userInfo = await this.getUserInfo();
      this.userInfo = userInfo;

      console.log('✅ 用户登录成功');
      return userInfo;

    } catch (error) {
      console.error('❌ 用户登录失败:', error);
      throw error;
    }
  }

  // 执行登录
  performLogin() {
    return new Promise((resolve, reject) => {
      tt.login({
        success: (res) => {
          resolve(res);
        },
        fail: (err) => {
          reject(new Error('登录失败: ' + err.errMsg));
        }
      });
    });
  }

  // 设置广告监听
  setupAdListeners() {
    console.log('📺 设置广告监听...');

    // 监听广告加载
    tt.onInterstitialAdLoad(() => {
      console.log('📺 插屏广告加载完成');
    });

    // 监听广告显示
    tt.onInterstitialAdShow(() => {
      console.log('📺 插屏广告显示');
      this.onAdShow();
    });

    // 监听广告点击
    tt.onInterstitialAdClick(() => {
      console.log('📺 插屏广告被点击');
      this.onAdClick();
    });

    // 监听广告关闭
    tt.onInterstitialAdClose(() => {
      console.log('📺 插屏广告关闭');
      this.onAdClose();
    });
  }

  // 显示广告
  async showAd(adUnitId) {
    try {
      console.log('📺 显示广告:', adUnitId);

      await new Promise((resolve, reject) => {
        tt.showInterstitialAd({
          adUnitId: adUnitId,
          success: (res) => {
            console.log('📺 广告显示成功:', res);
            resolve(res);
          },
          fail: (err) => {
            console.error('📺 广告显示失败:', err);
            reject(new Error('广告显示失败: ' + err.errMsg));
          }
        });
      });

    } catch (error) {
      console.error('❌ 显示广告失败:', error);
      throw error;
    }
  }

  // 广告展示事件
  onAdShow() {
    const adEvent = {
      eventType: 'ad_show',
      adUnitId: 'current_ad_unit',
      timestamp: new Date().toISOString(),
      deviceInfo: this.deviceInfo,
      userInfo: this.userInfo
    };

    this.adData.push(adEvent);
    this.reportData('/api/ad-event', adEvent);
  }

  // 广告点击事件
  onAdClick() {
    const adEvent = {
      eventType: 'ad_click',
      adUnitId: 'current_ad_unit',
      timestamp: new Date().toISOString(),
      deviceInfo: this.deviceInfo,
      userInfo: this.userInfo
    };

    this.adData.push(adEvent);
    this.reportData('/api/ad-event', adEvent);
  }

  // 广告关闭事件
  onAdClose() {
    const adEvent = {
      eventType: 'ad_close',
      adUnitId: 'current_ad_unit',
      timestamp: new Date().toISOString(),
      deviceInfo: this.deviceInfo,
      userInfo: this.userInfo
    };

    this.adData.push(adEvent);
    this.reportData('/api/ad-event', adEvent);
  }

  // 上报数据到服务器
  async reportData(endpoint, data) {
    try {
      console.log('📤 上报数据到:', endpoint);

      const response = await new Promise((resolve, reject) => {
        tt.request({
          url: 'https://your-server.com' + endpoint,
          method: 'POST',
          data: data,
          header: {
            'content-type': 'application/json'
          },
          success: (res) => {
            resolve(res);
          },
          fail: (err) => {
            reject(err);
          }
        });
      });

      console.log('✅ 数据上报成功:', response);
      return response;

    } catch (error) {
      console.error('❌ 数据上报失败:', error);
      // 可以考虑本地存储，稍后重试
      this.storeLocally(endpoint, data);
    }
  }

  // 本地存储（离线情况）
  storeLocally(endpoint, data) {
    try {
      const key = `pending_data_${Date.now()}`;
      const pendingData = {
        endpoint,
        data,
        timestamp: new Date().toISOString()
      };

      tt.setStorageSync(key, pendingData);
      console.log('💾 数据已存储到本地:', key);
    } catch (error) {
      console.error('❌ 本地存储失败:', error);
    }
  }

  // 获取地理位置（需要用户授权）
  async getLocation() {
    try {
      console.log('📍 获取地理位置...');

      const location = await new Promise((resolve, reject) => {
        tt.getLocation({
          type: 'wgs84',
          success: (res) => {
            resolve({
              latitude: res.latitude,
              longitude: res.longitude
            });
          },
          fail: (err) => {
            reject(new Error('获取地理位置失败: ' + err.errMsg));
          }
        });
      });

      console.log('✅ 地理位置获取成功:', location);
      return location;

    } catch (error) {
      console.error('❌ 获取地理位置失败:', error);
      return null;
    }
  }

  // 获取设备方向
  async getDeviceOrientation() {
    return new Promise((resolve) => {
      tt.onDeviceOrientationChange((res) => {
        resolve({
          alpha: res.alpha,
          beta: res.beta,
          gamma: res.gamma
        });
      });
    });
  }

  // 监听网络状态变化
  listenNetworkChange() {
    tt.onNetworkStatusChange((res) => {
      console.log('📶 网络状态变化:', res);
      // 可以在这里更新网络信息
      this.deviceInfo.networkType = res.networkType;
      this.deviceInfo.isConnected = res.isConnected;
    });
  }

  // 导出收集到的数据
  exportCollectedData() {
    return {
      deviceInfo: this.deviceInfo,
      userInfo: this.userInfo,
      adData: this.adData,
      exportedAt: new Date().toISOString()
    };
  }
}

// 创建游戏实例
const gameMain = new GameMain();

// 页面生命周期
tt.onShow = function() {
  console.log('📱 小游戏显示');
};

tt.onHide = function() {
  console.log('📱 小游戏隐藏');
};

// 启动游戏
gameMain.onLoad();

// 导出给其他文件使用
export default gameMain;

// 也可以挂载到全局
window.GameMain = gameMain;