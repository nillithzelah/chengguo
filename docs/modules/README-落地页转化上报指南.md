# 落地页/小程序转化上报指南

## 🎯 概述

对于落地页和小程序广告投放，巨量引擎会在URL中添加广告参数，您需要从中提取`clickid`作为callback参数，并在用户完成转化行为时上报给转化接口。

## 📋 URL参数说明

巨量引擎会在您的落地页URL后添加以下参数：

```
原始URL: https://your-domain.com/landing-page/
添加参数后: https://your-domain.com/landing-page/?adid=__AID__&creativeid=__CID__&creativetype=__CTYPE__&clickid=__CLICKID__
```

投放时宏参数会被替换为真实值：
```
https://your-domain.com/landing-page/?adid=123456&creativeid=654321&creativetype=3&clickid=EPHk9cX3pv4CGJax4ZENKI7w4MDev_4C
```

### 参数含义
- `adid`: 广告ID
- `creativeid`: 创意ID
- `creativetype`: 创意类型
- `clickid`: **转化上报所需的callback参数**

## 🛠️ 前端实现方案

### 1. 获取URL参数

```javascript
// 获取URL参数的工具函数
function getUrlParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

// 获取巨量引擎广告参数
const adParams = {
  adid: getUrlParameter('adid'),
  creativeid: getUrlParameter('creativeid'),
  creativetype: getUrlParameter('creativetype'),
  clickid: getUrlParameter('clickid')  // 这就是callback参数
};

// 存储到本地存储或全局变量
if (adParams.clickid) {
  localStorage.setItem('oceanengine_callback', adParams.clickid);
  console.log('巨量引擎广告参数已获取:', adParams);
}
```

### 2. 转化事件上报

```javascript
// 转化上报函数
async function reportConversion(eventType, additionalData = {}) {
  const callback = localStorage.getItem('oceanengine_callback');

  if (!callback) {
    console.warn('未找到巨量引擎callback参数，跳过转化上报');
    return;
  }

  // 构建上报数据
  const reportData = {
    callback: callback,
    event_type: eventType,  // 事件类型：0=激活, 1=注册, 2=付费, 3=表单等
    // 设备信息（根据实际情况获取）
    android_id: getAndroidId(),  // Android设备必填
    idfv: getIdfv(),            // iOS设备必填
    idfa: getIdfa(),            // iOS设备可选
    imei: getImei(),            // Android设备可选
    // 其他可选参数
    ...additionalData
  };

  try {
    const response = await fetch('https://your-server-domain/api/conversion/callback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reportData)
    });

    const result = await response.json();
    if (result.code === 0) {
      console.log('转化事件上报成功');
      // 可选：清除已使用的callback
      localStorage.removeItem('oceanengine_callback');
    } else {
      console.error('转化事件上报失败:', result.message);
    }
  } catch (error) {
    console.error('转化事件上报异常:', error);
  }
}
```

### 3. 具体转化场景示例

#### 注册转化
```javascript
// 用户完成注册后调用
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  // 提交注册表单
  const registerResult = await submitRegistration(formData);

  if (registerResult.success) {
    // 上报注册转化事件
    await reportConversion(1, {  // 1 = 注册事件
      outer_event_id: registerResult.userId,  // 去重ID
      properties: {
        register_method: 'email'  // 自定义属性
      }
    });
  }
});
```

#### 付费转化
```javascript
// 用户完成支付后调用
async function onPaymentSuccess(orderData) {
  await reportConversion(2, {  // 2 = 付费事件
    outer_event_id: orderData.orderId,
    properties: {
      pay_amount: orderData.amount,
      pay_method: orderData.paymentMethod
    }
  });
}
```

#### 表单提交转化
```javascript
// 用户提交表单后调用
async function onFormSubmit(formData) {
  await reportConversion(3, {  // 3 = 表单事件
    outer_event_id: generateUniqueId(),
    properties: {
      form_type: formData.type,
      lead_score: calculateLeadScore(formData)
    }
  });
}
```

## 📱 小程序实现方案

### 1. 获取启动参数

```javascript
// app.js
App({
  onLaunch(options) {
    // 获取小程序启动参数
    if (options.query) {
      const adParams = {
        adid: options.query.adid,
        creativeid: options.query.creativeid,
        creativetype: options.query.creativetype,
        clickid: options.query.clickid
      };

      if (adParams.clickid) {
        wx.setStorageSync('oceanengine_callback', adParams.clickid);
        console.log('巨量引擎小程序广告参数:', adParams);
      }
    }
  }
});
```

### 2. 小程序转化上报

```javascript
// 转化上报工具函数
const reportConversion = async (eventType, additionalData = {}) => {
  const callback = wx.getStorageSync('oceanengine_callback');

  if (!callback) {
    console.warn('未找到巨量引擎callback参数');
    return;
  }

  // 获取设备信息
  const deviceInfo = await getDeviceInfo();

  const reportData = {
    callback: callback,
    event_type: eventType,
    // 设备信息
    android_id: deviceInfo.androidId,
    idfv: deviceInfo.idfv,
    idfa: deviceInfo.idfa,
    imei: deviceInfo.imei,
    // 其他参数
    ...additionalData
  };

  try {
    const response = await new Promise((resolve, reject) => {
      wx.request({
        url: 'https://your-server-domain/api/conversion/callback',
        method: 'POST',
        data: reportData,
        header: {
          'Content-Type': 'application/json'
        },
        success: resolve,
        fail: reject
      });
    });

    if (response.data.code === 0) {
      console.log('小程序转化上报成功');
      wx.removeStorageSync('oceanengine_callback');
    } else {
      console.error('小程序转化上报失败:', response.data.message);
    }
  } catch (error) {
    console.error('小程序转化上报异常:', error);
  }
};
```

## 🔍 调试和验证

### 1. 检查参数获取
```javascript
// 在浏览器控制台执行
console.log('当前URL参数:', new URLSearchParams(window.location.search));
console.log('存储的callback:', localStorage.getItem('oceanengine_callback'));
```

### 2. 测试转化上报
```javascript
// 手动触发测试上报
reportConversion(0, { test: true });  // 0 = 激活事件
```

### 3. 服务器日志检查
检查您的服务器日志，确认收到正确的转化上报请求：
```
📡 收到转化事件回调请求
📊 原始参数: { callback: "EPHk9cX3pv4CGJax4ZENKI7w4MDev_4C", ... }
✅ 转化事件回调处理成功
```

## ⚠️ 重要注意事项

1. **参数持久化**: callback参数需要在用户会话期间保持，可能跨越多个页面
2. **去重处理**: 使用`outer_event_id`避免重复上报同一转化事件
3. **隐私合规**: 确保符合相关隐私政策要求
4. **错误处理**: 实现完善的错误处理和重试机制
5. **测试验证**: 在正式投放前进行充分测试

## 📞 技术支持

如有问题，请检查：
1. URL参数是否正确获取
2. 设备信息是否完整（Android必填android_id，iOS必填idfv）
3. 服务器端点是否可访问
4. 转化事件类型是否正确映射

---

**这样实现后，您的落地页/小程序就能正确获取巨量引擎的广告参数，并在用户转化时准确上报数据了！** 🎉