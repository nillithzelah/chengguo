import { APP_CONSTANTS, RESPONSE_CODES } from '@/constants';

/**
 * 统一的日志工具
 */
export const logger = {
  debug: (message: string, ...args: any[]) => {
    if (import.meta.env.DEV) {
      console.log(`🐛 [DEBUG] ${message}`, ...args);
    }
  },
  info: (message: string, ...args: any[]) => {
    console.log(`ℹ️  [INFO] ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`⚠️  [WARN] ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`❌ [ERROR] ${message}`, ...args);
  }
};

/**
 * 统一的API响应处理
 */
export const apiResponse = {
  success: (data: any, message = '操作成功') => ({
    code: RESPONSE_CODES.SUCCESS,
    data,
    message,
    timestamp: new Date().toISOString()
  }),

  error: (message: string, code = RESPONSE_CODES.SERVER_ERROR, details?: any) => ({
    code,
    message,
    data: null,
    timestamp: new Date().toISOString(),
    ...(details && import.meta.env.DEV && { details })
  })
};

/**
 * 广告平台识别工具
 */
export const adPlatformUtils = {
  /**
   * 根据广告ID识别平台
   */
  identifyPlatform: (aid: string | number): string => {
    if (!aid) return '未知';

    const aidStr = String(aid);

    // 抖音广告ID特征：19位数字，以7开头
    if (aidStr.startsWith('7') && aidStr.length >= 18 && /^\d+$/.test(aidStr)) {
      return '抖音';
    }

    // 头条广告ID特征：16-17位数字，以16或17开头
    if ((aidStr.startsWith('16') || aidStr.startsWith('17')) &&
        aidStr.length >= 15 && aidStr.length <= 17 && /^\d+$/.test(aidStr)) {
      return '头条';
    }

    // 西瓜视频广告ID特征：15位数字，以18开头
    if (aidStr.startsWith('18') && aidStr.length >= 15 && /^\d+$/.test(aidStr)) {
      return '西瓜视频';
    }

    // 火山小视频广告ID特征：15位数字，以19开头
    if (aidStr.startsWith('19') && aidStr.length >= 15 && /^\d+$/.test(aidStr)) {
      return '火山小视频';
    }

    // 测试广告ID：较小的数字
    const aidNum = parseInt(aidStr);
    if (aidNum >= 1000 && aidNum <= 9999) {
      return '抖音(测试)';
    }

    if (aidNum >= 1 && aidNum <= 99) {
      return '头条(测试)';
    }

    return '未知平台';
  },

  /**
   * 根据来源字段识别平台
   */
  identifyBySource: (source: string): string => {
    if (!source) return '未知';

    const lowerSource = source.toLowerCase();

    if (lowerSource.includes('douyin') || lowerSource.includes('抖音')) {
      return '抖音';
    }

    if (lowerSource.includes('toutiao') || lowerSource.includes('头条')) {
      return '头条';
    }

    if (lowerSource.includes('xigua') || lowerSource.includes('西瓜')) {
      return '西瓜视频';
    }

    if (lowerSource.includes('huoshan') || lowerSource.includes('火山')) {
      return '火山小视频';
    }

    return source;
  }
};

/**
 * 日期时间工具
 */
export const dateUtils = {
  /**
   * 格式化日期时间
   */
  formatDateTime: (dateTimeStr: string): string => {
    if (!dateTimeStr) return '-';
    return dateTimeStr.replace('T', ' ').substring(0, 19);
  },

  /**
   * 获取今天的日期字符串
   */
  getTodayString: (): string => {
    return new Date().toISOString().split('T')[0];
  },

  /**
   * 格式化时间戳
   */
  formatTimestamp: (timestamp: number): string => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }
};

/**
 * 字符串工具
 */
export const stringUtils = {
  /**
   * 截断字符串
   */
  truncate: (str: string, length: number): string => {
    if (!str || str.length <= length) return str;
    return str.substring(0, length) + '...';
  },

  /**
   * 首字母大写
   */
  capitalize: (str: string): string => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
};

/**
 * 数字工具
 */
export const numberUtils = {
  /**
   * 格式化金额
   */
  formatCurrency: (amount: number, decimals = 2): string => {
    return `¥${amount.toFixed(decimals)}`;
  },

  /**
   * 格式化百分比
   */
  formatPercentage: (value: number, total: number): string => {
    if (total === 0) return '0%';
    return `${((value / total) * 100).toFixed(1)}%`;
  }
};

/**
 * 缓存工具
 */
export const cacheUtils = {
  /**
   * 设置缓存
   */
  set: (key: string, data: any, expiry = APP_CONSTANTS.CACHE.DEVICE_INFO_EXPIRY): void => {
    const cacheData = {
      data,
      expiry: Date.now() + expiry,
      timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(cacheData));
  },

  /**
   * 获取缓存
   */
  get: (key: string): any => {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      if (Date.now() > cacheData.expiry) {
        localStorage.removeItem(key);
        return null;
      }

      return cacheData.data;
    } catch {
      return null;
    }
  },

  /**
   * 清除缓存
   */
  clear: (key: string): void => {
    localStorage.removeItem(key);
  }
};

/**
 * 权限工具
 */
export const permissionUtils = {
  /**
   * 检查是否为管理员
   */
  isAdmin: (role: string): boolean => {
    return role === APP_CONSTANTS.ROLES.ADMIN;
  },

  /**
   * 检查是否为管理层
   */
  isManagement: (role: string): boolean => {
    const managementRoles = ['admin', 'internal_boss', 'external_boss', 'internal_service', 'external_service'];
    return managementRoles.includes(role);
  },

  /**
   * 检查是否有指定权限
   */
  hasPermission: (userRole: string, allowedRoles: string[]): boolean => {
    return allowedRoles.includes(userRole);
  }
};

/**
 * 验证工具
 */
export const validationUtils = {
  /**
   * 验证用户名
   */
  validateUsername: (username: string): boolean => {
    return username.length >= 3 &&
           username.length <= 20 &&
           /^[a-zA-Z0-9_]+$/.test(username);
  },

  /**
   * 验证密码
   */
  validatePassword: (password: string): boolean => {
    return password.length >= 6 && password.length <= 32;
  },

  /**
   * 验证邮箱
   */
  validateEmail: (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
};