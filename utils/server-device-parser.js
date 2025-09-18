// 服务器端设备信息解析工具
// 在服务器端解析User-Agent等信息并存储到数据库

class ServerDeviceParser {

  constructor() {
    // 设备型号到品牌的映射表
    this.brandMappings = {
      // 荣耀手机型号映射
      'wv': '荣耀',
      'wv-': '荣耀',
      'honor': '荣耀',
      'honor-': '荣耀',

      // 华为手机型号映射
      'hw': '华为',
      'huawei': '华为',
      'hw-': '华为',
      'huawei-': '华为',
      'kirin': '华为',
      'mate': '华为',
      'p40': '华为',
      'p50': '华为',
      'nova': '华为',

      // 小米手机型号映射
      'mi': '小米',
      'xiaomi': '小米',
      'redmi': '小米',
      'pocophone': '小米',

      // OPPO手机型号映射
      'pe': 'OPPO',
      'oppo': 'OPPO',
      'realme': 'OPPO',

      // vivo手机型号映射
      'vivo': 'vivo',
      'iqoo': 'vivo',

      // 苹果设备型号映射
      'iphone': 'Apple',
      'ipad': 'Apple',

      // 三星手机型号映射
      'sm-': 'Samsung',
      'samsung': 'Samsung',
      'galaxy': 'Samsung',

      // 其他品牌映射
      'pixel': 'Google',
      'nexus': 'Google',
      'lg': 'LG',
      'sony': 'Sony',
      'asus': 'ASUS',
      'lenovo': '联想',
      'zte': '中兴',
      'meizu': '魅族'
    };
  }

  // 解析User-Agent字符串
  parseUserAgent(userAgent) {
    if (!userAgent || typeof userAgent !== 'string') {
      return {
        deviceModel: 'Unknown Device',
        deviceType: 'desktop',
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        browserName: 'Unknown Browser',
        browserVersion: 'Unknown',
        engineName: 'Unknown Engine',
        engineVersion: 'Unknown',
        osName: 'Unknown OS',
        osVersion: 'Unknown'
      };
    }

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
    let browserVersion = 'Unknown';

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
    let engineVersion = 'Unknown';

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
    let osVersion = 'Unknown';

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
  generateDeviceId(userAgent, ipAddress) {
    // 使用User-Agent和IP地址生成设备指纹
    const fingerprint = userAgent + (ipAddress || '');
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return 'web_' + Math.abs(hash).toString(36) + '_' + Date.now().toString(36);
  }

  // 解析完整的设备信息
  parseDeviceInfo(userAgent, additionalInfo = {}) {
    const parsedInfo = this.parseUserAgent(userAgent);

    // 简化的品牌解析
    const brand = parsedInfo.deviceModel.includes('荣耀') ? '荣耀' :
                  parsedInfo.deviceModel.includes('华为') ? '华为' :
                  parsedInfo.deviceModel.includes('小米') ? '小米' :
                  parsedInfo.deviceModel.includes('OPPO') ? 'OPPO' :
                  parsedInfo.deviceModel.includes('vivo') ? 'vivo' :
                  parsedInfo.deviceModel.includes('iPhone') || parsedInfo.deviceModel.includes('iPad') ? 'Apple' :
                  parsedInfo.deviceModel.includes('三星') ? 'Samsung' :
                  '未知品牌';

    const deviceId = this.generateDeviceId(userAgent, additionalInfo.ipAddress);

    return {
      deviceId,
      deviceBrand: brand,
      deviceModel: parsedInfo.deviceModel,
      friendlyModel: parsedInfo.deviceModel,
      platform: additionalInfo.platform || 'Web',
      browserName: parsedInfo.browserName,
      browserVersion: parsedInfo.browserVersion,
      osName: parsedInfo.osName,
      osVersion: parsedInfo.osVersion,
      deviceType: parsedInfo.deviceType,
      screenWidth: additionalInfo.screenWidth || null,
      screenHeight: additionalInfo.screenHeight || null,
      screenPixelRatio: additionalInfo.screenPixelRatio || null,
      viewportWidth: additionalInfo.viewportWidth || null,
      viewportHeight: additionalInfo.viewportHeight || null,
      language: additionalInfo.language || 'zh-CN',
      timezone: additionalInfo.timezone || 'Asia/Shanghai',
      userAgent: userAgent,
      ipAddress: additionalInfo.ipAddress || null,
      environment: additionalInfo.environment || 'web_browser'
    };
  }

  // 从请求中提取设备信息
  extractFromRequest(req) {
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.ip ||
                     req.connection.remoteAddress ||
                     req.socket.remoteAddress ||
                     (req.connection.socket ? req.connection.socket.remoteAddress : null);

    // 从请求头中提取其他信息
    const additionalInfo = {
      platform: req.headers['sec-ch-ua-platform'] || null,
      language: req.headers['accept-language']?.split(',')[0] || 'zh-CN',
      screenWidth: req.headers['sec-ch-ua-mobile'] ? null : 1920, // 简化的屏幕宽度检测
      screenHeight: req.headers['sec-ch-ua-mobile'] ? null : 1080,
      screenPixelRatio: null,
      viewportWidth: null,
      viewportHeight: null,
      timezone: req.headers['timezone'] || 'Asia/Shanghai',
      ipAddress: ipAddress,
      environment: 'web_browser'
    };

    return this.parseDeviceInfo(userAgent, additionalInfo);
  }
}

module.exports = new ServerDeviceParser();