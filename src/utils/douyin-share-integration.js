// 抖音小程序分享功能集成
// 用于收集用户分享行为数据和分析分享效果

export class DouyinShareIntegration {

  constructor() {
    this.shareData = [];
    this.shareCallbacks = {};
  }

  // 初始化分享功能
  async initialize() {
    console.log('🔗 初始化抖音分享功能...');

    try {
      // 检查是否在抖音环境中
      if (typeof tt === 'undefined') {
        console.warn('⚠️ 当前不在抖音小程序环境中，分享功能不可用');
        return false;
      }

      // 显示分享菜单
      await this.showShareMenu();

      // 设置分享监听
      this.setupShareListeners();

      console.log('✅ 抖音分享功能初始化完成');
      return true;

    } catch (error) {
      console.error('❌ 分享功能初始化失败:', error);
      return false;
    }
  }

  // 显示分享菜单
  async showShareMenu() {
    return new Promise((resolve, reject) => {
      (tt as any).showShareMenu({
        withShareTicket: true,
        success: () => {
          console.log('✅ 分享菜单显示成功');
          resolve();
        },
        fail: (err) => {
          console.error('❌ 显示分享菜单失败:', err.errMsg);
          reject(err);
        }
      });
    });
  }

  // 隐藏分享菜单
  async hideShareMenu() {
    return new Promise((resolve) => {
      (tt as any).hideShareMenu({
        success: () => {
          console.log('✅ 分享菜单隐藏成功');
          resolve();
        },
        fail: () => {
          resolve(); // 隐藏失败不影响主要功能
        }
      });
    });
  }

  // 设置分享监听器
  setupShareListeners() {
    console.log('👂 设置分享事件监听...');

    // 监听用户点击分享按钮
    (tt as any).onShareAppMessage(() => {
      console.log('📤 用户发起分享');

      // 返回分享内容配置
      return {
        title: '快来玩这个有趣的小游戏吧！',
        desc: '我在玩一个超好玩的小游戏，推荐给你！',
        path: '/pages/index/index', // 分享页面路径
        imageUrl: 'https://your-domain.com/share-image.jpg', // 分享图片
        success: (res) => {
          console.log('✅ 分享成功:', res);
          this.recordShareEvent('success', res);
        },
        fail: (err) => {
          console.error('❌ 分享失败:', err);
          this.recordShareEvent('fail', null, err);
        }
      };
    });
  }

  // 主动触发分享
  async shareAppMessage(options = {}) {
    return new Promise((resolve, reject) => {
      const shareOptions = {
        title: options.title || '快来玩这个有趣的小游戏吧！',
        desc: options.desc || '我在玩一个超好玩的小游戏，推荐给你！',
        path: options.path || '/pages/index/index',
        imageUrl: options.imageUrl || 'https://your-domain.com/share-image.jpg',
        success: (res) => {
          console.log('✅ 主动分享成功:', res);
          this.recordShareEvent('manual_success', res, null, options);
          resolve(res);
        },
        fail: (err) => {
          console.error('❌ 主动分享失败:', err);
          this.recordShareEvent('manual_fail', null, err, options);
          reject(err);
        }
      };

      (tt as any).shareAppMessage(shareOptions);
    });
  }

  // 分享到朋友圈（如果支持）
  async shareToTimeline(options = {}) {
    // 注意：抖音小程序可能不支持分享到朋友圈
    // 这里提供兼容性处理
    try {
      return await this.shareAppMessage(options);
    } catch (error) {
      console.warn('⚠️ 分享到朋友圈可能不支持:', error);
      throw error;
    }
  }

  // 记录分享事件
  recordShareEvent(eventType, result, error = null, options = {}) {
    const shareEvent = {
      eventType, // success, fail, manual_success, manual_fail
      timestamp: new Date().toISOString(),
      shareOptions: options,
      result: result,
      error: error,
      userAgent: navigator.userAgent,
      // 不包含用户个人隐私信息
      deviceInfo: this.getBasicDeviceInfo(),
      sessionId: this.generateSessionId()
    };

    this.shareData.push(shareEvent);

    // 上报分享事件到服务器
    this.reportShareEvent(shareEvent);

    console.log('📊 记录分享事件:', shareEvent);
  }

  // 获取基本设备信息（不包含隐私数据）
  getBasicDeviceInfo() {
    if (typeof tt === 'undefined') {
      return {
        platform: navigator.platform,
        userAgent: navigator.userAgent.substring(0, 100)
      };
    }

    try {
      const systemInfo = (tt as any).getSystemInfoSync();
      return {
        platform: systemInfo.platform,
        system: systemInfo.system,
        model: systemInfo.model,
        douyinVersion: systemInfo.version
      };
    } catch (error) {
      return {
        platform: 'unknown',
        error: '获取设备信息失败'
      };
    }
  }

  // 生成会话ID
  generateSessionId() {
    return 'share_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // 上报分享事件到服务器
  async reportShareEvent(eventData) {
    try {
      const response = await fetch('/api/share-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData)
      });

      if (response.ok) {
        console.log('✅ 分享事件上报成功');
      } else {
        console.log('⚠️ 分享事件上报失败');
      }
    } catch (error) {
      console.log('⚠️ 分享事件上报异常:', error);
      // 可以考虑本地存储，稍后重试
      this.storeLocally(eventData);
    }
  }

  // 本地存储分享事件
  storeLocally(eventData) {
    try {
      const key = `share_event_${Date.now()}`;
      localStorage.setItem(key, JSON.stringify(eventData));
      console.log('💾 分享事件已本地存储');
    } catch (error) {
      console.warn('⚠️ 本地存储失败:', error);
    }
  }

  // 创建分享按钮
  createShareButton(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('❌ 找不到容器元素:', containerId);
      return;
    }

    const button = document.createElement('button');
    button.innerHTML = options.text || '📤 分享给朋友';
    button.className = options.className || 'share-button';
    button.style.cssText = `
      padding: 12px 24px;
      background: linear-gradient(135deg, #FF0050, #FF4081);
      color: white;
      border: none;
      border-radius: 25px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(255, 0, 80, 0.3);
      transition: all 0.3s ease;
    `;

    button.addEventListener('click', async () => {
      try {
        button.disabled = true;
        button.innerHTML = '⏳ 分享中...';

        await this.shareAppMessage(options);

        button.innerHTML = '✅ 分享成功';
        setTimeout(() => {
          button.innerHTML = options.text || '📤 分享给朋友';
          button.disabled = false;
        }, 2000);

      } catch (error) {
        button.innerHTML = '❌ 分享失败';
        setTimeout(() => {
          button.innerHTML = options.text || '📤 分享给朋友';
          button.disabled = false;
        }, 2000);
      }
    });

    container.appendChild(button);
    return button;
  }

  // 获取分享统计数据
  getShareStats() {
    const stats = {
      totalShares: this.shareData.length,
      successfulShares: this.shareData.filter(item => item.eventType.includes('success')).length,
      failedShares: this.shareData.filter(item => item.eventType.includes('fail')).length,
      manualShares: this.shareData.filter(item => item.eventType.includes('manual')).length,
      autoShares: this.shareData.filter(item => !item.eventType.includes('manual')).length,
      shareRate: 0,
      recentShares: this.shareData.slice(-10) // 最近10条分享记录
    };

    if (stats.totalShares > 0) {
      stats.shareRate = (stats.successfulShares / stats.totalShares * 100).toFixed(1);
    }

    return stats;
  }

  // 导出分享数据
  exportShareData() {
    const data = {
      shareEvents: this.shareData,
      stats: this.getShareStats(),
      exportedAt: new Date().toISOString()
    };

    // 创建下载链接
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `share-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return data;
  }

  // 清除分享数据
  clearShareData() {
    this.shareData = [];
    console.log('🗑️ 分享数据已清除');
  }

  // 获取所有分享数据
  getShareData() {
    return {
      events: this.shareData,
      stats: this.getShareStats()
    };
  }
}

// 导出单例实例
export const douyinShareIntegration = new DouyinShareIntegration();

// 使用示例：
// 1. 初始化
// await douyinShareIntegration.initialize();
//
// 2. 创建分享按钮
// douyinShareIntegration.createShareButton('share-container', {
//   title: '快来玩这个游戏吧！',
//   desc: '超级好玩的小游戏',
//   imageUrl: 'https://your-domain.com/game-image.jpg'
// });
//
// 3. 主动分享
// await douyinShareIntegration.shareAppMessage({
//   title: '分享标题',
//   desc: '分享描述'
// });
//
// 4. 获取统计数据
// const stats = douyinShareIntegration.getShareStats();