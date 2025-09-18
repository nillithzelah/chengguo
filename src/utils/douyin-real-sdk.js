// 抖音小程序真实SDK集成示例
// 用于在真实的抖音小游戏环境中获取设备信息
import { deviceBrandMapper } from './device-brand-mapper';

export class DouyinRealSDK {

  constructor() {
    this.isInitialized = false;
    this.deviceInfo = null;
    this.userInfo = null;
  }

  // 初始化抖音小程序SDK
  async initialize() {
    return new Promise((resolve, reject) => {
      // 检查是否在抖音环境中
      if (typeof tt === 'undefined') {
        reject(new Error('请在抖音小程序环境中运行此代码'));
        return;
      }

      try {
        // 抖音小程序SDK自动初始化，无需额外配置
        this.isInitialized = true;
        console.log('✅ 抖音小程序SDK初始化成功');
        resolve({
          success: true,
          message: 'SDK初始化成功'
        });
      } catch (error) {
        console.error('❌ 抖音小程序SDK初始化失败:', error);
        reject(error);
      }
    });
  }

  // 获取设备信息 - 使用真实的tt.getSystemInfoSync
  async getDeviceInfo() {
    if (!this.isInitialized) {
      throw new Error('SDK未初始化');
    }

    try {
      // 使用同步API获取系统信息
      const res = tt.getSystemInfoSync();
      console.log('📱 获取到设备信息:', res);

      // 解析设备品牌信息
      const deviceBrandInfo = deviceBrandMapper.parseDeviceInfo(res.model);

      const deviceInfo = {
        // 基础设备信息
        deviceId: this.generateDeviceId(),
        deviceModel: res.model,
        deviceBrand: deviceBrandInfo.brand,
        friendlyModel: deviceBrandInfo.friendlyModel,
        platform: res.platform,
        systemVersion: res.system,
        version: res.version,

        // 屏幕信息
        screenWidth: res.screenWidth,
        screenHeight: res.screenHeight,
        pixelRatio: res.pixelRatio,
        statusBarHeight: res.statusBarHeight,
        windowWidth: res.windowWidth,
        windowHeight: res.windowHeight,

        // 抖音特有信息
        douyinVersion: res.version,
        SDKVersion: res.SDKVersion,
        safeArea: res.safeArea,

        // 网络信息（同步API无法获取，需要异步获取）
        networkType: 'unknown', // 需要单独获取
        isConnected: true,

        // 语言和时区
        language: res.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,

        // 时间戳
        timestamp: new Date().toISOString(),

        // 隐私保护：无法获取IP地址
        ip: null,
        location: null
      };

      this.deviceInfo = deviceInfo;
      return deviceInfo;

    } catch (error) {
      console.error('❌ 获取设备信息失败:', error);
      throw new Error('获取设备信息失败: ' + error.message);
    }
  }

  // 获取网络状态 - 使用真实的tt.getNetworkType
  async getNetworkInfo() {
    return new Promise((resolve, reject) => {
      tt.getNetworkType({
        success: (res) => {
          console.log('📶 获取到网络信息:', res);
          resolve({
            networkType: res.networkType,
            isConnected: res.isConnected
          });
        },
        fail: (err) => {
          console.error('❌ 获取网络信息失败:', err);
          reject(new Error('获取网络信息失败: ' + err.errMsg));
        }
      });
    });
  }

  // 获取用户信息 - 使用真实的tt.getUserInfo
  async getUserInfo() {
    return new Promise((resolve, reject) => {
      // 先检查登录状态
      tt.getLoginState({
        success: (loginRes) => {
          if (loginRes.isLogin) {
            // 已登录，获取用户信息
            tt.getUserInfo({
              success: (userRes) => {
                console.log('👤 获取到用户信息:', userRes);

                const userInfo = {
                  openId: userRes.openId,
                  unionId: userRes.unionId,
                  nickName: userRes.nickName,
                  avatarUrl: userRes.avatarUrl,
                  gender: userRes.gender,
                  province: userRes.province,
                  city: userRes.city,
                  country: userRes.country,

                  // 抖音特有字段
                  isDouyinUser: true,
                  timestamp: new Date().toISOString()
                };

                this.userInfo = userInfo;
                resolve(userInfo);
              },
              fail: (err) => {
                console.error('❌ 获取用户信息失败:', err);
                reject(new Error('获取用户信息失败: ' + err.errMsg));
              }
            });
          } else {
            // 未登录，需要先登录
            reject(new Error('用户未登录，请先调用登录接口'));
          }
        },
        fail: (err) => {
          console.error('❌ 检查登录状态失败:', err);
          reject(new Error('检查登录状态失败: ' + err.errMsg));
        }
      });
    });
  }

  // 用户登录 - 使用真实的tt.login
  async login() {
    return new Promise((resolve, reject) => {
      tt.login({
        success: (res) => {
          console.log('🔑 登录成功:', res);
          resolve({
            code: res.code,
            anonymousCode: res.anonymousCode,
            isLogin: true
          });
        },
        fail: (err) => {
          console.error('❌ 登录失败:', err);
          reject(new Error('登录失败: ' + err.errMsg));
        }
      });
    });
  }

  // 获取地理位置 - 使用真实的tt.getLocation
  async getLocation() {
    return new Promise((resolve, reject) => {
      tt.getLocation({
        type: 'wgs84',
        success: (res) => {
          console.log('📍 获取到地理位置:', res);
          resolve({
            latitude: res.latitude,
            longitude: res.longitude,
            // 注意：这里获取的是粗略位置，不是精确IP对应的地址
          });
        },
        fail: (err) => {
          console.error('❌ 获取地理位置失败:', err);
          reject(new Error('获取地理位置失败: ' + err.errMsg));
        }
      });
    });
  }

  // 显示广告 - 使用真实的tt.showInterstitialAd
  async showAd(adUnitId) {
    return new Promise((resolve, reject) => {
      tt.showInterstitialAd({
        adUnitId: adUnitId,
        success: (res) => {
          console.log('📺 广告展示成功:', res);
          resolve(res);
        },
        fail: (err) => {
          console.error('❌ 广告展示失败:', err);
          reject(new Error('广告展示失败: ' + err.errMsg));
        }
      });
    });
  }

  // 收集完整的设备和用户信息
  async collectAllInfo() {
    try {
      console.log('🚀 开始收集完整信息...');

      // 并行获取设备信息和网络信息
      const [deviceInfo, networkInfo] = await Promise.all([
        this.getDeviceInfo(),
        this.getNetworkInfo()
      ]);

      // 合并网络信息到设备信息
      const completeDeviceInfo = {
        ...deviceInfo,
        ...networkInfo
      };

      // 尝试获取用户信息（可能失败，需要用户授权）
      let userInfo = null;
      try {
        userInfo = await this.getUserInfo();
      } catch (userError) {
        console.log('⚠️ 获取用户信息失败（用户未授权）:', userError.message);
        userInfo = null;
      }

      // 尝试获取地理位置（可能失败，需要用户授权）
      let location = null;
      try {
        location = await this.getLocation();
      } catch (locationError) {
        console.log('⚠️ 获取地理位置失败（用户未授权）:', locationError.message);
        location = null;
      }

      const result = {
        deviceInfo: completeDeviceInfo,
        userInfo: userInfo,
        location: location,
        collectedAt: new Date().toISOString(),
        environment: 'douyin_mini_program',
        // 添加品牌识别信息
        brandRecognition: {
          originalModel: res?.model || 'unknown',
          recognizedBrand: completeDeviceInfo.deviceBrand,
          isRecognized: completeDeviceInfo.deviceBrand !== '未知品牌'
        }
      };

      console.log('✅ 信息收集完成');
      return result;

    } catch (error) {
      console.error('❌ 信息收集失败:', error);
      throw error;
    }
  }

  // 生成设备ID（用于标识）
  generateDeviceId() {
    // 在真实环境中，应该使用抖音提供的设备标识
    // 这里只是为了演示
    return 'douyin_device_' + Math.random().toString(36).substr(2, 9);
  }

  // 检查是否在抖音环境中
  isInDouyinEnvironment() {
    return typeof tt !== 'undefined';
  }

  // 获取抖音环境信息
  getDouyinEnvironmentInfo() {
    if (!this.isInDouyinEnvironment()) {
      return {
        isInDouyin: false,
        message: '当前不在抖音小程序环境中'
      };
    }

    return {
      isInDouyin: true,
      SDKVersion: tt.SDKVersion,
      platform: 'douyin',
      message: '当前在抖音小程序环境中'
    };
  }
}

// 导出单例实例
export const douyinRealSDK = new DouyinRealSDK();

// 便捷的全局函数
window.DouyinSDK = {
  // 初始化
  init: () => douyinRealSDK.initialize(),

  // 获取设备信息
  getDeviceInfo: () => douyinRealSDK.getDeviceInfo(),

  // 获取用户信息
  getUserInfo: () => douyinRealSDK.getUserInfo(),

  // 用户登录
  login: () => douyinRealSDK.login(),

  // 收集所有信息
  collectAllInfo: () => douyinRealSDK.collectAllInfo(),

  // 检查环境
  checkEnvironment: () => douyinRealSDK.getDouyinEnvironmentInfo()
};