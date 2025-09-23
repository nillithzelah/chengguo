/**
 * 转化事件回调服务
 * 处理字节跳动广告转化事件回调API
 */

const axios = require('axios');

// 事件类型枚举映射
const EVENT_TYPES = {
  0: '激活',
  1: '注册',
  2: '付费',
  3: '表单',
  4: '在线咨询',
  5: '有效咨询',
  6: '次留',
  20: 'app内下单',
  21: 'app内访问',
  22: 'app内添加购物车',
  23: 'app内付费',
  25: '关键行为',
  28: '授权',
  29: 'app内详情页到站uv',
  179: '点击商品',
  128: '加入收藏/心愿单',
  213: '领取优惠券',
  175: '立即购买',
  212: '添加/选定收货信息、电话',
  127: '添加/选定支付信息，绑定支付宝、微信、银行卡等',
  176: '提交订单',
  214: '订单提交/确认收货',
  202: '进入直播间',
  204: '直播间内点击关注按钮',
  205: '直播间内评论',
  206: '直播间内打赏',
  207: '直播间内点击购物车按钮',
  208: '直播间内商品点击',
  209: '直播间进入种草页跳转到第三方',
  210: '直播-加购',
  211: '直播-下单',
  // 新增事件类型
  1001: '小程序广告变现ltv'
};

// 归因方式枚举
const MATCH_TYPES = {
  0: '点击',
  1: '展示',
  2: '有效播放归因'
};

class ConversionCallbackService {
  constructor() {
    // 更新为新的转化回传API
    this.apiUrl = 'https://analytics.oceanengine.com/api/v2/conversion';
    this.timeout = 15000;
  }

  /**
   * 验证事件类型
   * @param {number} eventType - 事件类型
   * @returns {boolean} 是否有效
   */
  validateEventType(eventType) {
    return eventType !== undefined && EVENT_TYPES.hasOwnProperty(eventType);
  }

  /**
   * 验证设备信息（根据新API规范）
   * @param {Object} params - 请求参数
   * @returns {Object} 验证结果 {isValid: boolean, deviceInfo: Object, error?: string}
   */
  validateDeviceInfo(params) {
    const { idfa, imei, oaid, os, muid, android_id, idfv } = params;

    // 组合一：idfa / imei / oaid
    const hasCombination1 = idfa || imei || oaid;

    // 组合二：os / muid
    const hasCombination2 = os !== undefined && muid;

    if (!hasCombination1 && !hasCombination2) {
      return {
        isValid: false,
        error: '缺少设备信息参数，必须提供以下组合之一：(idfa/imei/oaid) 或 (os+muid)'
      };
    }

    const deviceInfo = {};
    let platform = null;

    if (hasCombination1) {
      if (idfa) {
        deviceInfo.idfa = idfa;
        platform = 'ios';
      }
      if (imei) {
        deviceInfo.imei = imei;
        platform = 'android';
      }
      if (oaid) {
        deviceInfo.oaid = oaid;
        platform = 'android';
      }
    }

    if (hasCombination2) {
      deviceInfo.os = parseInt(os);
      deviceInfo.muid = muid;
      // 根据os值判断平台
      platform = deviceInfo.os === 0 ? 'android' : 'ios';
    }

    // 验证必填的设备标识
    if (platform === 'android') {
      // Android设备必须有android_id
      if (!android_id) {
        return {
          isValid: false,
          error: 'Android设备必须提供android_id参数'
        };
      }
      deviceInfo.android_id = android_id;
    } else if (platform === 'ios') {
      // iOS设备必须有idfv
      const finalIdfv = idfv || muid;
      if (!finalIdfv) {
        return {
          isValid: false,
          error: 'iOS设备必须提供idfv参数'
        };
      }
      deviceInfo.idfv = finalIdfv;
    }

    deviceInfo.platform = platform;

    return {
      isValid: true,
      deviceInfo
    };
  }

  /**
   * 验证必需参数
   * @param {Object} params - 请求参数
   * @returns {Object} 验证结果 {isValid: boolean, error?: string}
   */
  validateRequiredParams(params) {
    const { callback, event_type } = params;

    if (!callback) {
      return { isValid: false, error: '缺少必需参数：callback' };
    }

    if (event_type === undefined || event_type === null) {
      return { isValid: false, error: '缺少必需参数：event_type' };
    }

    if (!this.validateEventType(event_type)) {
      return { isValid: false, error: `无效的事件类型：${event_type}，支持的事件类型：${Object.keys(EVENT_TYPES).join(', ')}` };
    }

    const deviceValidation = this.validateDeviceInfo(params);
    if (!deviceValidation.isValid) {
      return { isValid: false, error: deviceValidation.error };
    }

    return { isValid: true };
  }

  /**
   * 构建回调参数（新API格式）
   * @param {Object} params - 原始参数
   * @returns {Object} 处理后的参数
   */
  buildCallbackParams(params) {
    // 事件类型映射到新API格式（支持更多类型用于联调）
    const eventTypeMapping = {
      0: 'active',           // 激活 - ✅ 已验证支持
      1: 'register',         // 注册 - 联调工具常用
      2: 'pay',              // 付费 - 联调工具常用
      3: 'form',             // 表单 - ✅ 已验证支持
      4: 'consult',          // 在线咨询
      5: 'effective_consult', // 有效咨询
      6: 'retention',        // 次留
      20: 'app_order',       // app内下单
      21: 'app_visit',       // app内访问
      22: 'app_add_cart',    // app内添加购物车
      23: 'app_pay',         // app内付费
      25: 'game_addiction',    // 关键行为
      28: 'authorize',       // 授权
      29: 'landing_page_uv', // 详情页到站uv
      179: 'click_product',  // 点击商品
      128: 'add_wishlist',   // 加入收藏
      213: 'coupon',         // 领取优惠券
      175: 'purchase',       // 立即购买
      212: 'fill_info',      // 填写信息
      127: 'bind_payment',   // 绑定支付
      176: 'submit_order',   // 提交订单
      214: 'confirm_receipt', // 确认收货
      202: 'enter_live',     // 进入直播间
      204: 'follow_live',    // 直播关注
      205: 'comment_live',   // 直播评论
      206: 'gift_live',      // 直播打赏
      207: 'cart_live',      // 直播购物车
      208: 'click_live',     // 直播商品点击
      209: 'seed_page',      // 种草页跳转
      210: 'add_cart_live',  // 直播加购
      211: 'order_live',     // 直播下单
      // 新增事件类型映射
      1001: 'micro_game_ltv' // 小程序广告变现ltv
    };

    const eventType = eventTypeMapping[params.event_type];
    if (!eventType) {
      console.warn(`⚠️ 未知事件类型: ${params.event_type}，使用默认事件类型 'active'`);
      console.warn('📋 支持的事件类型:', Object.keys(eventTypeMapping).join(', '));
    }
    const finalEventType = eventType || 'active'; // 默认使用active作为不支持事件类型的后备

    // 构建新API格式的请求体
    const callbackParams = {
      event_type: finalEventType,
      context: {
        ad: {
          callback: params.callback
        }
      },
      timestamp: params.conv_time ? parseInt(params.conv_time) : Date.now()
    };

    // 添加match_type（归因方式）
    if (params.match_type !== undefined) {
      callbackParams.context.ad.match_type = parseInt(params.match_type);
    }

    // 添加设备信息
    const deviceValidation = this.validateDeviceInfo(params);
    if (deviceValidation.isValid) {
      const deviceInfo = deviceValidation.deviceInfo;
      callbackParams.context.device = {};

      // 设置平台信息
      callbackParams.context.device.platform = deviceInfo.platform;

      // 设置必填设备标识
      if (deviceInfo.platform === 'android') {
        callbackParams.context.device.android_id = deviceInfo.android_id;
      } else if (deviceInfo.platform === 'ios') {
        callbackParams.context.device.idfv = deviceInfo.idfv;
      }

      // 设置可选设备标识
      if (deviceInfo.idfa) {
        callbackParams.context.device.idfa = deviceInfo.idfa;
      }
      if (deviceInfo.imei) {
        callbackParams.context.device.imei = deviceInfo.imei;
      }
      if (deviceInfo.oaid) {
        callbackParams.context.device.oaid = deviceInfo.oaid;
      }
    }

    // 添加可选参数
    const optionalParams = [
      'event_weight', 'outer_event_id', 'outer_event_identity',
      'source', 'props', 'oaid_md5', 'caid1', 'caid2'
    ];

    // 处理properties（附加属性）
    const properties = {};
    optionalParams.forEach(param => {
      if (params[param] !== undefined && params[param] !== null && params[param] !== '') {
        if (param === 'props' && typeof params.props === 'object') {
          // 扩展props到properties
          Object.assign(properties, params.props);
        } else if (param === 'event_weight') {
          // 事件权重
          callbackParams.event_weight = parseFloat(params[param]);
        } else if (param === 'outer_event_id') {
          // 外部事件ID
          callbackParams.outer_event_id = params[param];
        } else if (param === 'outer_event_identity') {
          // 外部事件身份标识
          callbackParams.outer_event_identity = params[param];
        } else {
          // 其他属性放入properties
          properties[param] = params[param];
        }
      }
    });

    // 如果有properties，添加到请求体
    if (Object.keys(properties).length > 0) {
      callbackParams.properties = properties;
    }

    return callbackParams;
  }

  /**
   * 发送转化事件回调（新API格式）
   * @param {Object} params - 回调参数
   * @param {string} method - 请求方法 (固定为POST)
   * @returns {Promise<Object>} 回调结果
   */
  async sendConversionCallback(params, method = 'POST') {
    try {
      console.log('📤 发送转化事件回调请求（新API）');
      console.log('🔗 请求URL:', this.apiUrl);
      console.log('📋 请求方法: POST');
      console.log('📝 请求体:', JSON.stringify(params, null, 2));

      const config = {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ConversionCallbackService/2.0'
        }
      };

      // 新API固定使用POST方法，发送JSON格式的请求体
      const response = await axios.post(this.apiUrl, params, config);

      console.log('📥 回调响应:', {
        status: response.status,
        data: response.data
      });

      // 检查API响应码
      if (response.data.code === 0) {
        return {
          success: true,
          status: response.status,
          data: response.data,
          request: {
            url: this.apiUrl,
            method: 'POST',
            body: params
          }
        };
      } else {
        // API调用成功但业务逻辑失败
        console.error('❌ 转化事件回调业务失败:', response.data.message || response.data);

        return {
          success: false,
          error: response.data.message || `API业务错误 (code: ${response.data.code})`,
          status: response.status,
          data: response.data,
          code: response.data.code,
          request: {
            url: this.apiUrl,
            method: 'POST',
            body: params
          }
        };
      }

    } catch (error) {
      console.error('❌ 转化事件回调失败:', error.message);

      const errorResult = {
        success: false,
        error: error.message,
        request: {
          url: this.apiUrl,
          method: 'POST',
          body: params
        }
      };

      if (error.response) {
        console.error('📄 API响应错误:', {
          status: error.response.status,
          data: error.response.data
        });
        errorResult.status = error.response.status;
        errorResult.response = error.response.data;

        // 根据新API的错误码处理
        if (error.response.data && error.response.data.code) {
          errorResult.code = error.response.data.code;
          errorResult.message = error.response.data.message;
        }
      }

      return errorResult;
    }
  }

  /**
   * 处理转化事件回调请求
   * @param {Object} params - 请求参数
   * @param {string} method - 请求方法
   * @returns {Promise<Object>} 处理结果
   */
  async processConversionCallback(params, method = 'GET') {
    const startTime = Date.now();

    try {
      console.log('🚀 开始处理转化事件回调');
      console.log('📊 原始参数:', params);

      // 验证必需参数
      const validation = this.validateRequiredParams(params);
      if (!validation.isValid) {
        console.error('❌ 参数验证失败:', validation.error);
        return {
          success: false,
          error: validation.error,
          code: 400
        };
      }

      // 构建回调参数
      const callbackParams = this.buildCallbackParams(params);

      // 发送回调请求
      const callbackResult = await this.sendConversionCallback(callbackParams, method);

      const processingTime = Date.now() - startTime;

      const result = {
        success: callbackResult.success,
        processing_time: processingTime,
        event_info: {
          event_type: callbackParams.event_type,
          event_name: EVENT_TYPES[params.event_type] || '未知事件',
          callback: callbackParams.context.ad.callback.substring(0, 20) + '...'
        },
        device_info: this.validateDeviceInfo(params).deviceInfo,
        callback_result: callbackResult,
        timestamp: new Date().toISOString()
      };

      if (callbackResult.success) {
        console.log('✅ 转化事件回调处理成功');
        console.log('⏱️ 处理时间:', processingTime + 'ms');
      } else {
        console.error('❌ 转化事件回调处理失败');
        result.error = callbackResult.error;
        result.code = callbackResult.status || 500;
      }

      return result;

    } catch (error) {
      console.error('❌ 处理转化事件回调时发生异常:', error);
      return {
        success: false,
        error: error.message,
        code: 500,
        processing_time: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 获取支持的事件类型列表
   * @returns {Object} 事件类型映射
   */
  getSupportedEventTypes() {
    return EVENT_TYPES;
  }

  /**
   * 获取支持的归因方式列表
   * @returns {Object} 归因方式映射
   */
  getSupportedMatchTypes() {
    return MATCH_TYPES;
  }
}

module.exports = new ConversionCallbackService();