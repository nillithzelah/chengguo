# 抖音小游戏设备信息收集指南

本文档介绍如何在真实的抖音小游戏中获取观看广告用户的设备信息。

## 📋 前置条件

1. **抖音开发者账号**：需要在抖音开放平台注册并创建小游戏
2. **小游戏App ID**：格式为 `tt` 开头的字符串
3. **服务器接口**：用于接收和存储收集到的数据

## 🚀 快速开始

### 1. 集成SDK代码

将以下文件复制到您的抖音小游戏项目中：

```
src/utils/douyin-real-sdk.js      # 抖音SDK工具类
src/examples/douyin-mini-game-example.js  # 小游戏集成示例
```

### 2. 初始化SDK

在小游戏的入口文件（通常是 `game.js` 或 `main.js`）中添加：

```javascript
// 引入SDK
import { douyinRealSDK } from './utils/douyin-real-sdk.js';

// 或者使用全局对象
// 使用 window.DouyinSDK

class GameMain {
  async onLoad() {
    try {
      // 初始化SDK
      await douyinRealSDK.initialize();
      console.log('✅ 抖音SDK初始化成功');

      // 开始收集信息
      const allInfo = await douyinRealSDK.collectAllInfo();
      console.log('📊 收集到的信息:', allInfo);

    } catch (error) {
      console.error('❌ 初始化失败:', error);
    }
  }
}
```

## 📱 可获取的设备信息

### ✅ 基础设备信息
```javascript
const deviceInfo = await douyinRealSDK.getDeviceInfo();

// 返回数据示例：
{
  deviceModel: "iPhone 14",           // 设备型号
  platform: "ios",                    // 平台
  systemVersion: "iOS 17.0",          // 系统版本
  douyinVersion: "25.1.0",            // 抖音版本
  screenWidth: 375,                   // 屏幕宽度
  screenHeight: 812,                  // 屏幕高度
  pixelRatio: 2,                      // 像素密度
  statusBarHeight: 44,                // 状态栏高度
  safeArea: {                         // 安全区域
    top: 44,
    bottom: 34,
    left: 0,
    right: 0
  }
}
```

### ✅ 网络信息
```javascript
const networkInfo = await douyinRealSDK.getNetworkInfo();

// 返回数据：
{
  networkType: "wifi",     // 网络类型
  isConnected: true        // 是否连接
}
```

### ✅ 用户信息（需要用户授权）
```javascript
const userInfo = await douyinRealSDK.getUserInfo();

// 返回数据：
{
  openId: "open_xxx",           // 用户OpenID
  unionId: "union_xxx",         // 用户UnionID
  nickName: "小明",             // 昵称
  avatarUrl: "https://...",     // 头像URL
  gender: 1,                    // 性别 (1:男, 2:女)
  province: "北京",             // 省份
  city: "北京市",               // 城市
  country: "中国"               // 国家
}
```

### ❌ 隐私保护限制
```javascript
// 以下信息无法获取（隐私保护）
{
  ip: null,           // IP地址
  location: null      // 精确地理位置
}
```

## 📺 广告事件监听

### 监听广告展示
```javascript
// 设置广告监听
tt.onInterstitialAdShow(() => {
  console.log('📺 广告展示');
  // 收集广告展示数据
  collectAdEvent('ad_show');
});

tt.onInterstitialAdClick(() => {
  console.log('📺 广告点击');
  // 收集广告点击数据
  collectAdEvent('ad_click');
});

tt.onInterstitialAdClose(() => {
  console.log('📺 广告关闭');
  // 收集广告关闭数据
  collectAdEvent('ad_close');
});
```

### 广告事件数据收集
```javascript
function collectAdEvent(eventType) {
  const adData = {
    eventType: eventType,
    adUnitId: 'your_ad_unit_id',
    timestamp: new Date().toISOString(),
    deviceInfo: deviceInfo,
    userInfo: userInfo,
    // 不包含IP地址，符合隐私要求
  };

  // 上报到服务器
  reportToServer('/api/ad-event', adData);
}
```

## 🔗 数据上报

### 上报到服务器
```javascript
function reportToServer(endpoint, data) {
  tt.request({
    url: 'https://your-server.com' + endpoint,
    method: 'POST',
    data: data,
    header: {
      'content-type': 'application/json'
    },
    success: (res) => {
      console.log('✅ 数据上报成功:', res);
    },
    fail: (err) => {
      console.error('❌ 数据上报失败:', err);
      // 本地存储，稍后重试
      storeLocally(endpoint, data);
    }
  });
}
```

### 本地存储（网络异常时）
```javascript
function storeLocally(endpoint, data) {
  const key = `pending_data_${Date.now()}`;
  const pendingData = {
    endpoint,
    data,
    timestamp: new Date().toISOString()
  };

  tt.setStorageSync(key, pendingData);
}
```

## 🎮 完整集成示例

### 小游戏主文件 (game.js)
```javascript
import { douyinRealSDK } from './utils/douyin-real-sdk.js';

class Game {
  constructor() {
    this.deviceInfo = null;
    this.userInfo = null;
  }

  async onLoad() {
    // 初始化抖音SDK
    await douyinRealSDK.initialize();

    // 收集设备信息
    this.deviceInfo = await douyinRealSDK.getDeviceInfo();

    // 尝试获取用户信息
    try {
      this.userInfo = await douyinRealSDK.getUserInfo();
    } catch (error) {
      console.log('用户信息获取失败:', error.message);
    }

    // 设置广告监听
    this.setupAdListeners();

    // 上报初始化数据
    this.reportGameStart();
  }

  setupAdListeners() {
    tt.onInterstitialAdShow(() => {
      this.onAdShow();
    });

    tt.onInterstitialAdClick(() => {
      this.onAdClick();
    });
  }

  onAdShow() {
    const eventData = {
      eventType: 'ad_show',
      deviceInfo: this.deviceInfo,
      userInfo: this.userInfo,
      timestamp: new Date().toISOString()
    };

    this.reportEvent(eventData);
  }

  onAdClick() {
    const eventData = {
      eventType: 'ad_click',
      deviceInfo: this.deviceInfo,
      userInfo: this.userInfo,
      timestamp: new Date().toISOString()
    };

    this.reportEvent(eventData);
  }

  reportEvent(data) {
    tt.request({
      url: 'https://your-server.com/api/ad-event',
      method: 'POST',
      data: data,
      header: { 'content-type': 'application/json' }
    });
  }

  reportGameStart() {
    const startData = {
      eventType: 'game_start',
      deviceInfo: this.deviceInfo,
      userInfo: this.userInfo,
      timestamp: new Date().toISOString()
    };

    this.reportEvent(startData);
  }
}

// 创建游戏实例
const game = new Game();

// 抖音小游戏生命周期
tt.onShow = function() {
  game.onLoad();
};

tt.onHide = function() {
  // 游戏隐藏时的处理
};
```

## 🔒 隐私保护

### 用户授权处理
```javascript
// 检查用户授权状态
async function checkUserAuth() {
  try {
    const userInfo = await douyinRealSDK.getUserInfo();
    return true;
  } catch (error) {
    // 用户未授权，引导用户授权
    await requestUserAuth();
    return false;
  }
}

// 请求用户授权
async function requestUserAuth() {
  tt.showModal({
    title: '授权提示',
    content: '需要获取您的用户信息以提供更好的服务',
    success: (res) => {
      if (res.confirm) {
        // 用户同意，重新尝试获取
        douyinRealSDK.getUserInfo();
      }
    }
  });
}
```

### 数据脱敏
```javascript
// 对敏感数据进行脱敏处理
function sanitizeData(data) {
  return {
    ...data,
    // 移除或哈希敏感信息
    ip: undefined,           // 不收集IP
    location: undefined,     // 不收集精确位置
    deviceId: hash(data.deviceId), // 对设备ID进行哈希
  };
}
```

## 📊 数据分析

收集到的数据可用于：

1. **广告效果分析**
   - 不同设备的广告展示效果
   - 用户点击行为分析
   - 转化率统计

2. **用户体验优化**
   - 根据设备类型调整UI
   - 网络状况下的内容适配
   - 性能优化

3. **商业决策**
   - 受众特征分析
   - 广告投放策略优化
   - 收益预测

## ⚠️ 注意事项

1. **隐私合规**：确保数据收集符合相关隐私法规
2. **用户同意**：获取用户信息前必须获得用户明确同意
3. **数据安全**：对收集的数据进行加密存储和传输
4. **错误处理**：妥善处理API调用失败的情况
5. **性能影响**：避免频繁调用API影响游戏性能

## 🔧 故障排除

### 常见问题

1. **SDK初始化失败**
   ```javascript
   // 检查是否在抖音环境中
   if (typeof tt === 'undefined') {
     console.error('请在抖音小程序环境中运行');
   }
   ```

2. **用户信息获取失败**
   ```javascript
   // 检查用户是否已登录
   tt.getLoginState({
     success: (res) => {
       if (!res.isLogin) {
         // 需要先登录
         tt.login();
       }
     }
   });
   ```

3. **网络请求失败**
   ```javascript
   // 检查网络状态
   tt.getNetworkType({
     success: (res) => {
       if (!res.isConnected) {
         console.log('网络未连接');
       }
     }
   });
   ```

## 📞 技术支持

如果您在集成过程中遇到问题，可以：

1. 查看抖音开放平台文档
2. 联系抖音技术支持
3. 查看控制台错误信息
4. 使用提供的示例代码进行调试

---

**重要提醒**：在收集用户数据时，请务必遵守相关隐私保护法律法规，确保用户知情权和同意权。