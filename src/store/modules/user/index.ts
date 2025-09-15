import { defineStore } from 'pinia';
import {
  login as userLogin,
  logout as userLogout,
  getUserInfo,
  LoginData,
} from '@/api/user';
import { setToken, clearToken } from '@/utils/auth';
import { removeRouteListener } from '@/utils/route-listener';
import { UserState } from './types';
import useAppStore from '../app';

const useUserStore = defineStore('user', {
  state: (): UserState => ({
    name: undefined,
    avatar: undefined,
    job: undefined,
    organization: undefined,
    location: undefined,
    email: undefined,
    introduction: undefined,
    personalWebsite: undefined,
    jobName: undefined,
    organizationName: undefined,
    locationName: undefined,
    phone: undefined,
    registrationDate: undefined,
    accountId: undefined,
    certification: undefined,
    role: '',
    deviceInfo: {
      ip: undefined,
      city: undefined,
      phoneBrand: undefined,
      phoneModel: undefined,
    },
  }),

  getters: {
    userInfo(state: UserState): UserState {
      return { ...state };
    },
  },

  actions: {
    switchRoles() {
      return new Promise((resolve) => {
        if (this.role === 'user') {
          this.role = 'admin';
        } else if (this.role === 'admin') {
          this.role = 'viewer';
        } else if (this.role === 'viewer') {
          this.role = 'super_viewer';
        } else if (this.role === 'super_viewer') {
          this.role = 'user';
        } else {
          this.role = 'user'; // 默认切换到 user
        }
        resolve(this.role);
      });
    },
    // Set user's information
    setInfo(partial: Partial<UserState>) {
      this.$patch(partial);
    },

    // Reset user's information
    resetInfo() {
      this.$reset();
    },

    // 异步获取设备信息（不阻塞登录流程）
    fetchDeviceInfoAsync() {
      // 在后台异步执行，不等待结果
      this.fetchDeviceInfo().catch(err => {
        console.warn('异步获取设备信息失败:', err);
      });
    },

    // 测试IP获取功能
    async testIPFetching() {
      console.log('🧪 开始测试IP获取功能...');
      try {
        await this.fetchDeviceInfo();
        console.log('🧪 测试完成，当前设备信息:', this.deviceInfo);
        return this.deviceInfo;
      } catch (error) {
        console.error('🧪 测试失败:', error);
        return null;
      }
    },

    // 获取设备信息
    async fetchDeviceInfo() {
      try {
        console.log('开始获取用户设备信息...');

        // 检查缓存，如果最近获取过则跳过
        const cachedDeviceInfo = localStorage.getItem('deviceInfo');
        const cacheTime = localStorage.getItem('deviceInfoTime');

        if (cachedDeviceInfo && cacheTime) {
          const cacheAge = Date.now() - parseInt(cacheTime);
          const cacheExpiry = 24 * 60 * 60 * 1000; // 24小时缓存

          if (cacheAge < cacheExpiry) {
            const cachedData = JSON.parse(cachedDeviceInfo);
            // 如果缓存中的IP不是"未知"且城市也不是"未知"，则使用缓存
            if (cachedData.ip && cachedData.ip !== '未知' && cachedData.city && cachedData.city !== '未知') {
              console.log('使用缓存的设备信息');
              this.deviceInfo = cachedData;
              return;
            } else {
              console.log('缓存中的数据无效，重新获取');
            }
          }
        }

        // 获取IP - 使用更快的API，减少数量
        const ipServices = [
          'https://api.ipify.org?format=json',  // 最快最稳定的API
          'https://httpbin.org/ip',  // 备选
          'https://api64.ipify.org?format=json'  // 备选
        ];

        const isValidIP = (ip) => {
          if (!ip || typeof ip !== 'string') return false;

          // 检查是否为IPv4
          const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
          if (ipv4Regex.test(ip)) {
            // 过滤私有地址和无效地址
            if (ip === '127.0.0.1' || ip === '0.0.0.0' || ip.startsWith('192.168.') ||
                ip.startsWith('10.') || ip.startsWith('172.')) {
              return false;
            }
            const parts = ip.split('.');
            return parts.every(part => {
              const num = parseInt(part, 10);
              return num >= 0 && num <= 255;
            });
          }

          // 检查是否为IPv6（简化检查）
          const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;
          if (ipv6Regex.test(ip)) {
            // 过滤本地IPv6地址
            return !ip.startsWith('::1') && !ip.startsWith('fc') && !ip.startsWith('fd');
          }

          return false;
        };

        const isIPv4 = (ip) => {
          const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
          return ipv4Regex.test(ip);
        };

        let userIP = '未知';

        // 并行获取IP，提高效率
        const ipPromises = ipServices.map(async (service) => {
          try {
            console.log(`尝试获取IP: ${service}`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000); // 2秒超时

            const response = await fetch(service, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
              mode: 'cors',
              signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
              console.log(`${service} 返回状态: ${response.status}`);
              return null;
            }

            let data;
            if (service.includes('ipify.org') && !service.includes('format=json')) {
              const text = await response.text();
              data = { ip: text.trim() };
            } else {
              data = await response.json();
            }

            console.log(`${service} 响应数据:`, data);

            const ip = data.ip || data.origin || data.query || data.ip_address;
            console.log(`解析到IP: ${ip}`);

            if (isValidIP(ip)) {
              return { service, ip };
            }
            return null;
          } catch (error) {
            if (error.name === 'AbortError') {
              console.log(`${service} 请求超时`);
            } else {
              console.error(`${service} 获取失败:`, error);
            }
            return null;
          }
        });

        // 等待所有IP结果，优先选择IPv4
        const ipResults = await Promise.allSettled(ipPromises);
        const validIPs = [];
        const failedServices = [];

        console.log('IP获取结果汇总:');
        for (const result of ipResults) {
          if (result.status === 'fulfilled' && result.value) {
            validIPs.push(result.value);
            console.log(`✅ ${result.value.service}: ${result.value.ip}`);
          } else {
            const service = ipServices[ipResults.indexOf(result)];
            failedServices.push(service);
            console.log(`❌ ${service}: 获取失败`);
          }
        }

        console.log(`有效IP数量: ${validIPs.length}, 失败服务: ${failedServices.length}`);

        // 优先选择IPv4地址
        const ipv4Result = validIPs.find(ip => isIPv4(ip.ip));
        if (ipv4Result) {
          userIP = ipv4Result.ip;
          console.log(`🎯 选择IPv4地址: ${userIP} (来自 ${ipv4Result.service})`);
        } else if (validIPs.length > 0) {
          // 如果没有IPv4，使用第一个可用的IP（可能是IPv6）
          userIP = validIPs[0].ip;
          console.log(`🎯 选择IPv6地址: ${userIP} (来自 ${validIPs[0].service})`);
        } else {
          console.log('❌ 所有IP服务都失败了');
          // 如果所有服务都失败，尝试重试一次
          console.log('🔄 尝试重试IP获取...');
          await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒

          const retryPromises = ipServices.slice(0, 2).map(async (service) => {
            try {
              console.log(`🔄 重试 ${service}`);
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 3000);

              const response = await fetch(service, {
                method: 'GET',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                mode: 'cors',
                signal: controller.signal
              });

              clearTimeout(timeoutId);

              if (!response.ok) return null;

              let data;
              if (service.includes('ipify.org') && !service.includes('format=json')) {
                data = { ip: await response.text() };
              } else {
                data = await response.json();
              }

              const ip = data.ip || data.origin || data.query || data.ip_address;
              if (isValidIP(ip)) {
                console.log(`✅ 重试成功: ${service} -> ${ip}`);
                return { service, ip };
              }
              return null;
            } catch (error) {
              console.log(`❌ 重试失败: ${service}`);
              return null;
            }
          });

          const retryResults = await Promise.allSettled(retryPromises);
          for (const result of retryResults) {
            if (result.status === 'fulfilled' && result.value) {
              userIP = result.value.ip;
              console.log(`🎯 重试成功获取IP: ${userIP}`);
              break;
            }
          }
        }

        // 获取城市 - 使用更快的API，减少数量，设置更短超时
        let userCity = '未知';
        const geoServices = [
          {
            name: 'ip-api.com',
            url: 'http://ip-api.com/json/',
            getCity: (data) => {
              console.log('🔍 ip-api.com 原始数据:', data);
              const city = data.city || data.regionName;
              console.log('🔍 ip-api.com 解析城市:', city);
              return city;
            }
          },
          {
            name: 'ipapi.co',
            url: 'https://ipapi.co/json/',
            getCity: (data) => {
              console.log('🔍 ipapi.co 原始数据:', data);
              const city = data.city || data.region || data.country_name;
              console.log('🔍 ipapi.co 解析城市:', city);
              return city;
            }
          }
        ];

        console.log('开始获取城市信息...');

        // 并行尝试IP地理位置服务，提高效率
        const geoPromises = geoServices.map(async (service) => {
          try {
            console.log(`尝试 ${service.name}...`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // 3秒超时

            const response = await fetch(service.url, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
              mode: 'cors',
              signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
              console.log(`${service.name} 返回状态: ${response.status}`);
              return null;
            }

            const data = await response.json();
            console.log(`${service.name} 响应数据:`, data);

            const city = service.getCity(data);
            console.log(`${service.name} 解析城市: ${city}`);

            if (city && city !== 'Unknown' && city !== 'N/A' && city !== '') {
              return { service: service.name, city };
            }
            return null;
          } catch (error) {
            if (error.name === 'AbortError') {
              console.log(`${service.name} 请求超时`);
            } else {
              console.error(`${service.name} 获取失败:`, error.message);
            }
            return null;
          }
        });

        // 等待第一个成功的地理位置结果
        const geoResults = await Promise.allSettled(geoPromises);
        for (const result of geoResults) {
          if (result.status === 'fulfilled' && result.value) {
            userCity = result.value.city;
            console.log(`成功从 ${result.value.service} 获取城市: ${userCity}`);
            break;
          }
        }

        // 如果IP地理位置都失败了，尝试GPS（设置更短超时）
        if (userCity === '未知') {
          console.log('IP地理位置获取失败，尝试GPS...');
          try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              if (!navigator.geolocation) reject(new Error('GPS不可用'));
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 5000,  // 5秒超时
                enableHighAccuracy: false,  // 不需要高精度
                maximumAge: 300000  // 5分钟内的缓存位置
              });
            });

            const { latitude, longitude } = position.coords;
            console.log('GPS坐标:', latitude, longitude);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // 3秒超时

            const geoResponse = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=zh`, {
              signal: controller.signal
            });
            clearTimeout(timeoutId);

            const geoData = await geoResponse.json();
            console.log('GPS地理编码响应:', geoData);

            userCity = geoData.city || geoData.locality || geoData.principalSubdivision || '未知';
            console.log('GPS获取城市结果:', userCity);
          } catch (gpsError) {
            console.error('GPS获取失败:', gpsError);
          }
        }

        console.log('最终城市结果:', userCity);

        // 获取设备信息
        const ua = navigator.userAgent;
        let phoneBrand = '未知';
        let phoneModel = '未知';

        // 解析手机品牌
        if (ua.includes('iPhone') || ua.includes('iPad') || ua.includes('iPod')) {
          phoneBrand = 'Apple';
        } else if (ua.includes('Android')) {
          const match = ua.match(/Android.*;\s*([^;)]+)/);
          if (match) {
            const device = match[1];
            if (device.includes('Samsung')) phoneBrand = 'Samsung';
            else if (device.includes('Huawei')) phoneBrand = 'Huawei';
            else if (device.includes('Xiaomi')) phoneBrand = 'Xiaomi';
            else if (device.includes('OPPO')) phoneBrand = 'OPPO';
            else if (device.includes('vivo')) phoneBrand = 'vivo';
            else phoneBrand = 'Android设备';
          } else {
            phoneBrand = 'Android设备';
          }
        } else if (ua.includes('Windows')) phoneBrand = 'Windows PC';
        else if (ua.includes('Mac')) phoneBrand = 'Mac';

        // 解析手机型号
        if (ua.includes('iPhone')) {
          const match = ua.match(/iPhone\s([^;]+)/);
          phoneModel = match ? match[1] : 'iPhone';
        } else if (ua.includes('Android')) {
          const match = ua.match(/Android.*;\s*([^;)]+)/);
          if (match) {
            phoneModel = match[1];
          }
        }

        // 更新设备信息
        this.deviceInfo = {
          ip: userIP,
          city: userCity,
          phoneBrand: phoneBrand,
          phoneModel: phoneModel,
        };

        console.log('设备信息获取完成:', this.deviceInfo);

        // 只有在成功获取到IP时才缓存
        if (userIP !== '未知') {
          console.log('保存设备信息到缓存');
          localStorage.setItem('deviceInfo', JSON.stringify(this.deviceInfo));
          localStorage.setItem('deviceInfoTime', Date.now().toString());
        } else {
          console.log('IP获取失败，不保存缓存');
        }
      } catch (error) {
        console.error('获取设备信息失败:', error);
        this.deviceInfo = {
          ip: '未知',
          city: '未知',
          phoneBrand: '未知',
          phoneModel: '未知',
        };
      }
    },

    // Get user's information
    async info() {
      const res = await getUserInfo();

      this.setInfo(res.data);
    },

    // Login
    async login(loginForm: LoginData) {
      try {
        console.log('userStore.login: 开始调用API', loginForm);
        const res = await userLogin(loginForm);
        console.log('userStore.login: API响应', res);
        console.log('userStore.login: token数据', res.data?.token);
        setToken(res.data.token);
        console.log('userStore.login: token已存储到localStorage');

        // 登录成功后获取用户信息
        console.log('userStore.login: 获取用户信息');
        await this.info();
        console.log('userStore.login: 用户信息已更新', this.role);

        // 异步获取设备信息，不阻塞登录流程
        console.log('userStore.login: 开始异步获取设备信息');
        this.fetchDeviceInfoAsync();
      } catch (err) {
        console.error('userStore.login: 登录失败', err);
        clearToken();
        throw err;
      }
    },
    logoutCallBack() {
      const appStore = useAppStore();
      this.resetInfo();
      clearToken();
      removeRouteListener();
      appStore.clearServerMenu();
    },
    // Logout
    async logout() {
      try {
        await userLogout();
      } finally {
        this.logoutCallBack();
      }
    },
  },
});

export default useUserStore;
