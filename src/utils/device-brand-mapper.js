// 设备品牌映射工具
// 将抖音小程序返回的设备型号代码映射到用户友好的品牌名称

export class DeviceBrandMapper {

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
      'blackshark': '小米',

      // OPPO手机型号映射
      'pe': 'OPPO',
      'oppo': 'OPPO',
      'realme': 'OPPO',
      'oneplus': 'OPPO',

      // vivo手机型号映射
      'vivo': 'vivo',
      'iqoo': 'vivo',
      'v20': 'vivo',
      'v21': 'vivo',
      'v22': 'vivo',
      'v23': 'vivo',
      'v25': 'vivo',
      'v26': 'vivo',
      'v27': 'vivo',
      'v28': 'vivo',
      'v29': 'vivo',
      'v30': 'vivo',

      // 苹果手机型号映射
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

    // 品牌别名映射
    this.brandAliases = {
      'huawei': '华为',
      'honor': '荣耀',
      'xiaomi': '小米',
      'oppo': 'OPPO',
      'vivo': 'vivo',
      'apple': 'Apple',
      'samsung': 'Samsung',
      'google': 'Google',
      'lg': 'LG',
      'sony': 'Sony',
      'asus': 'ASUS',
      'lenovo': '联想',
      'zte': '中兴',
      'meizu': '魅族'
    };
  }

  // 解析设备型号，返回品牌名称
  parseBrand(deviceModel) {
    if (!deviceModel || typeof deviceModel !== 'string') {
      return '未知品牌';
    }

    const model = deviceModel.toLowerCase().trim();

    // 直接匹配品牌名称
    for (const [key, brand] of Object.entries(this.brandMappings)) {
      if (model.includes(key)) {
        return brand;
      }
    }

    // 尝试从型号中提取品牌信息
    const extractedBrand = this.extractBrandFromModel(model);
    if (extractedBrand) {
      return extractedBrand;
    }

    // 如果无法识别，返回原始型号
    console.warn(`无法识别设备品牌，型号: ${deviceModel}`);
    return '未知品牌';
  }

  // 从设备型号中提取品牌信息
  extractBrandFromModel(model) {
    // 常见的品牌前缀模式
    const patterns = [
      /^([a-z]+)-/,  // 如: hw-, sm-, mi-
      /^([a-z]+)\s/, // 如: huawei , samsung
      /^([a-z]{2,})\d/, // 如: hw10, mi12
    ];

    for (const pattern of patterns) {
      const match = model.match(pattern);
      if (match) {
        const prefix = match[1].toLowerCase();
        if (this.brandMappings[prefix]) {
          return this.brandMappings[prefix];
        }
        if (this.brandAliases[prefix]) {
          return this.brandAliases[prefix];
        }
      }
    }

    return null;
  }

  // 获取设备型号的友好名称
  getFriendlyModelName(deviceModel, brand) {
    if (!deviceModel) return '未知型号';

    // 如果品牌是荣耀，尝试给出更友好的型号名称
    if (brand === '荣耀') {
      const model = deviceModel.toLowerCase();
      if (model.includes('wv')) {
        return '荣耀手机';
      }
    }

    return deviceModel;
  }

  // 完整的设备信息解析
  parseDeviceInfo(deviceModel) {
    const brand = this.parseBrand(deviceModel);
    const friendlyModel = this.getFriendlyModelName(deviceModel, brand);

    return {
      originalModel: deviceModel,
      brand: brand,
      friendlyModel: friendlyModel,
      isRecognized: brand !== '未知品牌'
    };
  }

  // 添加自定义映射
  addMapping(modelPattern, brand) {
    this.brandMappings[modelPattern.toLowerCase()] = brand;
  }

  // 获取所有支持的品牌列表
  getSupportedBrands() {
    const brands = new Set(Object.values(this.brandMappings));
    return Array.from(brands).sort();
  }
}

// 导出单例实例
export const deviceBrandMapper = new DeviceBrandMapper();

// 便捷函数
export const parseDeviceBrand = (deviceModel) => deviceBrandMapper.parseBrand(deviceModel);
export const parseDeviceInfo = (deviceModel) => deviceBrandMapper.parseDeviceInfo(deviceModel);