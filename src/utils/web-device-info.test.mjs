// 网站设备信息收集测试
import { webDeviceInfoCollector, getWebDeviceInfo, isMobileDevice, getDeviceType } from './web-device-info.js';

// 测试网站设备信息收集功能
console.log('🖥️ 开始测试网站设备信息收集功能...\n');

// 测试初始化
console.log('1. 测试设备信息初始化:');
try {
  const deviceInfo = webDeviceInfoCollector.initialize();
  console.log('✅ 初始化成功');
  console.log('设备信息:', {
    deviceBrand: deviceInfo.deviceBrand,
    deviceModel: deviceInfo.deviceModel,
    browserName: deviceInfo.browserName,
    osName: deviceInfo.osName,
    deviceType: deviceInfo.deviceType,
    isMobile: deviceInfo.isMobile,
    screenWidth: deviceInfo.screenWidth,
    screenHeight: deviceInfo.screenHeight
  });
} catch (error) {
  console.log('❌ 初始化失败:', error.message);
}

// 测试便捷函数
console.log('\n2. 测试便捷函数:');
console.log('getWebDeviceInfo():', getWebDeviceInfo()?.deviceBrand);
console.log('isMobileDevice():', isMobileDevice());
console.log('getDeviceType():', getDeviceType());

// 测试荣耀手机User-Agent模拟
console.log('\n3. 测试荣耀手机User-Agent解析:');
const mockHonorUA = 'Mozilla/5.0 (Linux; Android 10; HONOR V20 Build/HUAWEIV20; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/78.0.3904.62 XWEB/2571 MMWEBSDK/200201 Mobile Safari/537.36 MMWEBID/1234 MicroMessenger/7.0.12.1620(0x27000C32) Process/toolsmp WeChat/arm64 NetType/WIFI Language/zh_CN ABI/arm64';

// 临时修改navigator.userAgent进行测试
const originalUA = navigator.userAgent;
Object.defineProperty(navigator, 'userAgent', {
  value: mockHonorUA,
  configurable: true
});

// 重新初始化以使用新的User-Agent
webDeviceInfoCollector.isInitialized = false;
const honorDeviceInfo = webDeviceInfoCollector.initialize();

console.log('荣耀手机解析结果:', {
  deviceBrand: honorDeviceInfo.deviceBrand,
  deviceModel: honorDeviceInfo.deviceModel,
  browserName: honorDeviceInfo.browserName,
  osName: honorDeviceInfo.osName,
  isMobile: honorDeviceInfo.isMobile
});

// 恢复原始User-Agent
Object.defineProperty(navigator, 'userAgent', {
  value: originalUA,
  configurable: true
});

console.log('\n4. 测试不同设备类型的User-Agent:');

// 测试iPhone
const iphoneUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1';
Object.defineProperty(navigator, 'userAgent', { value: iphoneUA, configurable: true });
webDeviceInfoCollector.isInitialized = false;
const iphoneInfo = webDeviceInfoCollector.initialize();
console.log('iPhone解析结果:', {
  deviceBrand: iphoneInfo.deviceBrand,
  deviceModel: iphoneInfo.deviceModel,
  isMobile: iphoneInfo.isMobile
});

// 测试三星手机
const samsungUA = 'Mozilla/5.0 (Linux; Android 11; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36';
Object.defineProperty(navigator, 'userAgent', { value: samsungUA, configurable: true });
webDeviceInfoCollector.isInitialized = false;
const samsungInfo = webDeviceInfoCollector.initialize();
console.log('三星手机解析结果:', {
  deviceBrand: samsungInfo.deviceBrand,
  deviceModel: samsungInfo.deviceModel,
  isMobile: samsungInfo.isMobile
});

// 测试桌面浏览器
const desktopUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
Object.defineProperty(navigator, 'userAgent', { value: desktopUA, configurable: true });
webDeviceInfoCollector.isInitialized = false;
const desktopInfo = webDeviceInfoCollector.initialize();
console.log('桌面浏览器解析结果:', {
  deviceBrand: desktopInfo.deviceBrand,
  deviceModel: desktopInfo.deviceModel,
  isDesktop: desktopInfo.isDesktop
});

// 恢复原始User-Agent
Object.defineProperty(navigator, 'userAgent', { value: originalUA, configurable: true });

console.log('\n🎉 网站设备信息收集测试完成！');

// 导出测试结果
export const webDeviceTestResults = {
  honorDevice: {
    brand: honorDeviceInfo.deviceBrand,
    model: honorDeviceInfo.deviceModel,
    isMobile: honorDeviceInfo.isMobile
  },
  iphoneDevice: {
    brand: iphoneInfo.deviceBrand,
    model: iphoneInfo.deviceModel,
    isMobile: iphoneInfo.isMobile
  },
  samsungDevice: {
    brand: samsungInfo.deviceBrand,
    model: samsungInfo.deviceModel,
    isMobile: samsungInfo.isMobile
  },
  desktopDevice: {
    brand: desktopInfo.deviceBrand,
    model: desktopInfo.deviceModel,
    isDesktop: desktopInfo.isDesktop
  }
};