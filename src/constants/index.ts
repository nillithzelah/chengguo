// 应用常量配置
export const APP_CONSTANTS = {
  // API相关
  API: {
    BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api',
    TIMEOUT: 15000,
  },

  // 抖音API相关
  DOUYIN: {
    APP_ID: import.meta.env.VITE_DOUYIN_APP_ID,
    APP_SECRET: import.meta.env.VITE_DOUYIN_APP_SECRET,
    ADVERTISER_ID: import.meta.env.VITE_DOUYIN_ADVERTISER_ID,
    PROMOTION_ID: import.meta.env.VITE_DOUYIN_PROMOTION_ID,
  },

  // 分页配置
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 50,
    MAX_PAGE_SIZE: 100,
    PAGE_SIZE_OPTIONS: [20, 50, 100],
  },

  // 缓存配置
  CACHE: {
    DEVICE_INFO_EXPIRY: 24 * 60 * 60 * 1000, // 24小时
    TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5分钟
  },

  // 广告平台识别
  AD_PLATFORMS: {
    DOUYIN: {
      ID_PREFIX: '7',
      ID_LENGTH: 19,
      NAME: '抖音',
    },
    TOUTIAO: {
      ID_PREFIX: ['16', '17'],
      ID_LENGTH: [16, 17],
      NAME: '头条',
    },
    XIGUA: {
      ID_PREFIX: '18',
      ID_LENGTH: 15,
      NAME: '西瓜视频',
    },
    HUOSHAN: {
      ID_PREFIX: '19',
      ID_LENGTH: 15,
      NAME: '火山小视频',
    },
  },

  // 角色权限
  ROLES: {
    ADMIN: 'admin',
    INTERNAL_BOSS: 'internal_boss',
    EXTERNAL_BOSS: 'external_boss',
    INTERNAL_SERVICE: 'internal_service',
    EXTERNAL_SERVICE: 'external_service',
    INTERNAL_USER: 'internal_user',
    EXTERNAL_USER: 'external_user',
  },

  // 权限组
  PERMISSION_GROUPS: {
    MANAGEMENT: ['admin', 'internal_boss', 'external_boss', 'internal_service', 'external_service'],
    ADMIN_ONLY: ['admin'],
    ADMIN_BOSS: ['admin', 'internal_boss', 'external_boss'],
  },

  // 消息类型
  MESSAGE_TYPES: {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info',
  },

  // 设备类型
  DEVICE_TYPES: {
    MOBILE: 'mobile',
    DESKTOP: 'desktop',
    TABLET: 'tablet',
  },

  // 主题配置
  THEMES: {
    LIGHT: 'light',
    DARK: 'dark',
    AUTO: 'auto',
  },
} as const;

// 验证规则
export const VALIDATION_RULES = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 20,
    PATTERN: /^[a-zA-Z0-9_]+$/,
  },
  PASSWORD: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 32,
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
} as const;

// 角色权限类型
export type RoleType = 'admin' | 'internal_boss' | 'external_boss' | 'internal_service' | 'external_service' | 'internal_user' | 'external_user';

export type PermissionGroup = 'admin' | 'internal_boss' | 'external_boss' | 'internal_service' | 'external_service';

// 默认值
export const DEFAULT_VALUES = {
  DATE_FORMAT: 'YYYY-MM-DD',
  DATETIME_FORMAT: 'YYYY-MM-DD HH:mm:ss',
  PAGE_SIZE: 50,
  RETRY_TIMES: 3,
  RETRY_DELAY: 1000,
} as const;

// API响应状态码
export const RESPONSE_CODES = {
  SUCCESS: 20000,
  UNAUTHORIZED: 50008,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
  VALIDATION_ERROR: 400,
} as const;

// 事件类型常量
export const EVENT_TYPES = {
  CONVERSION: {
    ACTIVE: 1,
    REGISTER: 2,
    PURCHASE: 3,
    VIEW_CONTENT: 4,
  },
} as const;