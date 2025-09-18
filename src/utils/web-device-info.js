// 网站环境设备信息收集工具
// 使用navigator.userAgent获取设备信息并解析品牌

// 由于ES模块导入问题，暂时注释掉品牌映射器的导入
// import { deviceBrandMapper } from './device-brand-mapper';

export class WebDeviceInfoCollector {

  constructor() {
    this.deviceInfo = null;
    this.isInitialized = false;
  }

  // 初始化设备信息收集
  initialize() {
    if (this.isInitialized) {
      return this.deviceInfo;
    }

    try {
      this.deviceInfo = this.collectDeviceInfo();
      this.isInitialized = true;
      console.log('✅ 网站设备信息收集初始化成功');
      return this.deviceInfo;
    } catch (error) {
      console.error('❌ 网站设备信息收集初始化失败:', error);
      return null;
    }
  }

  // 收集设备信息
  collectDeviceInfo() {
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js/Unknown';
    const platform = typeof navigator !== 'undefined' ? navigator.platform : 'Unknown';
    const language = typeof navigator !== 'undefined' ? navigator.language : 'zh-CN';
    const cookieEnabled = typeof navigator !== 'undefined' ? navigator.cookieEnabled : false;
    const onLine = typeof navigator !== 'undefined' ? navigator.onLine : true;

    // 解析User-Agent获取设备信息
    const parsedInfo = this.parseUserAgent(userAgent);

    // 简化的品牌解析（不依赖外部映射器）
    const brandInfo = {
      brand: parsedInfo.deviceModel.includes('荣耀') ? '荣耀' :
             parsedInfo.deviceModel.includes('华为') ? '华为' :
             parsedInfo.deviceModel.includes('小米') ? '小米' :
             parsedInfo.deviceModel.includes('OPPO') ? 'OPPO' :
             parsedInfo.deviceModel.includes('vivo') ? 'vivo' :
             parsedInfo.deviceModel.includes('iPhone') ? 'Apple' :
             parsedInfo.deviceModel.includes('三星') ? 'Samsung' :
             '未知品牌',
      friendlyModel: parsedInfo.deviceModel,
      isRecognized: true
    };

    const deviceInfo = {
      // 基础设备信息
      deviceId: this.generateDeviceId(),
      deviceModel: parsedInfo.deviceModel,
      deviceBrand: brandInfo.brand,
      friendlyModel: brandInfo.friendlyModel,
      platform: platform,
      userAgent: userAgent,

      // 浏览器信息
      browserName: parsedInfo.browserName,
      browserVersion: parsedInfo.browserVersion,
      engineName: parsedInfo.engineName,
      engineVersion: parsedInfo.engineVersion,

      // 系统信息
      osName: parsedInfo.osName,
      osVersion: parsedInfo.osVersion,

      // 设备类型
      deviceType: parsedInfo.deviceType,
      isMobile: parsedInfo.isMobile,
      isTablet: parsedInfo.isTablet,
      isDesktop: parsedInfo.isDesktop,

      // 屏幕信息
      screenWidth: typeof screen !== 'undefined' ? screen.width : 1920,
      screenHeight: typeof screen !== 'undefined' ? screen.height : 1080,
      screenColorDepth: typeof screen !== 'undefined' ? screen.colorDepth : 24,
      screenPixelRatio: typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1,

      // 视窗信息
      viewportWidth: typeof window !== 'undefined' ? window.innerWidth : 1920,
      viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 1080,

      // 网络信息
      isOnline: onLine,
      cookieEnabled: cookieEnabled,

      // 语言和时区
      language: language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,

      // 时间戳
      timestamp: new Date().toISOString(),

      // 收集环境
      environment: 'web_browser',
      collectedAt: new Date().toISOString()
    };

    console.log('📱 收集到的设备信息:', {
      brand: deviceInfo.deviceBrand,
      model: deviceInfo.deviceModel,
      browser: deviceInfo.browserName,
      os: deviceInfo.osName,
      type: deviceInfo.deviceType
    });

    return deviceInfo;
  }

  // 解析User-Agent字符串
  parseUserAgent(userAgent) {
    const ua = userAgent.toLowerCase();

    // 设备型号提取
    let deviceModel = 'Unknown Device';
    let deviceType = 'desktop';
    let isMobile = false;
    let isTablet = false;
    let isDesktop = true;

    // 荣耀手机检测
    if (ua.includes('honor') || ua.includes('荣耀')) {
      deviceModel = '荣耀手机';
      deviceType = 'mobile';
      isMobile = true;
      isDesktop = false;
    }
    // 华为手机检测
    else if (ua.includes('huawei') || ua.includes('华为')) {
      deviceModel = '华为手机';
      deviceType = 'mobile';
      isMobile = true;
      isDesktop = false;
    }
    // 小米手机检测
    else if (ua.includes('xiaomi') || ua.includes('mi ') || ua.includes('redmi')) {
      deviceModel = '小米手机';
      deviceType = 'mobile';
      isMobile = true;
      isDesktop = false;
    }
    // OPPO手机检测
    else if (ua.includes('oppo') || ua.includes('realme')) {
      deviceModel = 'OPPO手机';
      deviceType = 'mobile';
      isMobile = true;
      isDesktop = false;
    }
    // vivo手机检测
    else if (ua.includes('vivo') || ua.includes('iqoo')) {
      deviceModel = 'vivo手机';
      deviceType = 'mobile';
      isMobile = true;
      isDesktop = false;
    }
    // 苹果设备检测
    else if (ua.includes('iphone')) {
      deviceModel = 'iPhone';
      deviceType = 'mobile';
      isMobile = true;
      isDesktop = false;
    }
    else if (ua.includes('ipad')) {
      deviceModel = 'iPad';
      deviceType = 'tablet';
      isTablet = true;
      isDesktop = false;
    }
    else if (ua.includes('mac')) {
      deviceModel = 'Mac';
      deviceType = 'desktop';
    }
    // 三星设备检测
    else if (ua.includes('samsung') || ua.includes('sm-')) {
      deviceModel = '三星手机';
      deviceType = 'mobile';
      isMobile = true;
      isDesktop = false;
    }
    // 移动设备通用检测
    else if (ua.includes('android')) {
      deviceModel = 'Android设备';
      deviceType = 'mobile';
      isMobile = true;
      isDesktop = false;
    }
    else if (ua.includes('mobile') || ua.includes('phone')) {
      deviceModel = '移动设备';
      deviceType = 'mobile';
      isMobile = true;
      isDesktop = false;
    }

    // 浏览器检测
    let browserName = 'Unknown Browser';
    let browserVersion = 'Unknown Version';

    if (ua.includes('chrome') && !ua.includes('edg')) {
      browserName = 'Chrome';
      const match = ua.match(/chrome\/([\d.]+)/);
      browserVersion = match ? match[1] : 'Unknown';
    }
    else if (ua.includes('firefox')) {
      browserName = 'Firefox';
      const match = ua.match(/firefox\/([\d.]+)/);
      browserVersion = match ? match[1] : 'Unknown';
    }
    else if (ua.includes('safari') && !ua.includes('chrome')) {
      browserName = 'Safari';
      const match = ua.match(/version\/([\d.]+)/);
      browserVersion = match ? match[1] : 'Unknown';
    }
    else if (ua.includes('edg')) {
      browserName = 'Edge';
      const match = ua.match(/edg\/([\d.]+)/);
      browserVersion = match ? match[1] : 'Unknown';
    }
    else if (ua.includes('opera') || ua.includes('opr')) {
      browserName = 'Opera';
      const match = ua.match(/(?:opera|opr)\/([\d.]+)/);
      browserVersion = match ? match[1] : 'Unknown';
    }

    // 引擎检测
    let engineName = 'Unknown Engine';
    let engineVersion = 'Unknown Version';

    if (ua.includes('webkit')) {
      engineName = 'WebKit';
      const match = ua.match(/webkit\/([\d.]+)/);
      engineVersion = match ? match[1] : 'Unknown';
    }
    else if (ua.includes('gecko')) {
      engineName = 'Gecko';
      const match = ua.match(/rv:([\d.]+)/);
      engineVersion = match ? match[1] : 'Unknown';
    }
    else if (ua.includes('trident')) {
      engineName = 'Trident';
      const match = ua.match(/trident\/([\d.]+)/);
      engineVersion = match ? match[1] : 'Unknown';
    }

    // 操作系统检测
    let osName = 'Unknown OS';
    let osVersion = 'Unknown Version';

    if (ua.includes('windows nt')) {
      osName = 'Windows';
      const match = ua.match(/windows nt ([\d.]+)/);
      if (match) {
        const version = match[1];
        const versionMap = {
          '10.0': '10',
          '6.3': '8.1',
          '6.2': '8',
          '6.1': '7',
          '6.0': 'Vista',
          '5.1': 'XP'
        };
        osVersion = versionMap[version] || version;
      }
    }
    else if (ua.includes('mac os x')) {
      osName = 'macOS';
      const match = ua.match(/mac os x ([\d_]+)/);
      if (match) {
        osVersion = match[1].replace(/_/g, '.');
      }
    }
    else if (ua.includes('linux')) {
      osName = 'Linux';
    }
    else if (ua.includes('android')) {
      osName = 'Android';
      const match = ua.match(/android ([\d.]+)/);
      osVersion = match ? match[1] : 'Unknown';
    }
    else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) {
      osName = 'iOS';
      const match = ua.match(/os ([\d_]+)/);
      if (match) {
        osVersion = match[1].replace(/_/g, '.');
      }
    }

    return {
      deviceModel,
      deviceType,
      isMobile,
      isTablet,
      isDesktop,
      browserName,
      browserVersion,
      engineName,
      engineVersion,
      osName,
      osVersion
    };
  }

  // 生成设备ID
  generateDeviceId() {
    // 检查是否在浏览器环境中
    if (typeof document === 'undefined') {
      // Node.js环境：使用简单的随机ID
      return 'web_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
    }

    try {
      // 浏览器环境：使用canvas指纹
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const txt = 'device_fingerprint';
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText(txt, 2, 2);
      const fingerprint = canvas.toDataURL().slice(-50);

      return 'web_' + btoa(fingerprint).slice(0, 16) + '_' + Date.now().toString(36);
    } catch (error) {
      // 如果canvas不可用，使用备用方法
      return 'web_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
    }
  }

  // 获取设备信息
  getDeviceInfo() {
    if (!this.isInitialized) {
      return this.initialize();
    }
    return this.deviceInfo;
  }

  // 检查是否在移动设备上
  isMobileDevice() {
    if (typeof navigator === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // 检查是否在平板设备上
  isTabletDevice() {
    if (typeof navigator === 'undefined') return false;
    return /iPad|Android(?=.*\bMobile\b)|Tablet|PlayBook|Silk/i.test(navigator.userAgent);
  }

  // 获取设备类型
  getDeviceType() {
    if (this.isTabletDevice()) return 'tablet';
    if (this.isMobileDevice()) return 'mobile';
    return 'desktop';
  }
}

// 导出单例实例
export const webDeviceInfoCollector = new WebDeviceInfoCollector();

// 便捷函数
export const getWebDeviceInfo = () => webDeviceInfoCollector.getDeviceInfo();
export const isMobileDevice = () => webDeviceInfoCollector.isMobileDevice();
export const isTabletDevice = () => webDeviceInfoCollector.isTabletDevice();
export const getDeviceType = () => webDeviceInfoCollector.getDeviceType();