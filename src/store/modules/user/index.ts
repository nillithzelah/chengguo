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
        if (this.role === 'admin') {
          this.role = 'admin';
        } else if (this.role === 'internal_boss') {
          this.role = 'internal_service';
        } else if (this.role === 'internal_service') {
          this.role = 'internal_user';
        } else if (this.role === 'internal_user') {
          this.role = 'external_boss';
        } else if (this.role === 'external_boss') {
          this.role = 'external_service';
        } else if (this.role === 'external_service') {
          this.role = 'external_user';
        } else {
          this.role = 'external_user'; // 默认切换到 external_user
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
      this.fetchDeviceInfo().catch(() => {
        // 静默处理错误
      });
    },

    // 测试IP获取功能
    async testIPFetching() {
      try {
        await this.fetchDeviceInfo();
        return this.deviceInfo;
      } catch (error) {
        return null;
      }
    },

    // 获取设备信息
    async fetchDeviceInfo() {
      try {
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
              this.deviceInfo = cachedData;
              return;
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
              return null;
            }

            let data;
            if (service.includes('ipify.org') && !service.includes('format=json')) {
              const text = await response.text();
              data = { ip: text.trim() };
            } else {
              data = await response.json();
            }

            const ip = data.ip || data.origin || data.query || data.ip_address;

            if (isValidIP(ip)) {
              return { service, ip };
            }
            return null;
          } catch (error) {
            return null;
          }
        });

        // 等待所有IP结果，优先选择IPv4
        const ipResults = await Promise.allSettled(ipPromises);
        const validIPs = [];
        const failedServices = [];

        for (const result of ipResults) {
          if (result.status === 'fulfilled' && result.value) {
            validIPs.push(result.value);
          }
        }

        // 优先选择IPv4地址
        const ipv4Result = validIPs.find(ip => isIPv4(ip.ip));
        if (ipv4Result) {
          userIP = ipv4Result.ip;
        } else if (validIPs.length > 0) {
          // 如果没有IPv4，使用第一个可用的IP（可能是IPv6）
          userIP = validIPs[0].ip;
        } else {
          // 如果所有服务都失败，尝试重试一次
          await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒

          const retryPromises = ipServices.slice(0, 2).map(async (service) => {
            try {
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
                return { service, ip };
              }
              return null;
            } catch (error) {
              return null;
            }
          });

          const retryResults = await Promise.allSettled(retryPromises);
          for (const result of retryResults) {
            if (result.status === 'fulfilled' && result.value) {
              userIP = result.value.ip;
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

        // 并行尝试IP地理位置服务，提高效率
        const geoPromises = geoServices.map(async (service) => {
          try {
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
              return null;
            }

            const data = await response.json();

            const city = service.getCity(data);

            if (city && city !== 'Unknown' && city !== 'N/A' && city !== '') {
              return { service: service.name, city };
            }
            return null;
          } catch (error) {
            return null;
          }
        });

        // 等待第一个成功的地理位置结果
        const geoResults = await Promise.allSettled(geoPromises);
        for (const result of geoResults) {
          if (result.status === 'fulfilled' && result.value) {
            userCity = result.value.city;
            break;
          }
        }

        // 如果IP地理位置都失败了，尝试GPS（设置更短超时）
        if (userCity === '未知') {
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

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // 3秒超时

            const geoResponse = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=zh`, {
              signal: controller.signal
            });
            clearTimeout(timeoutId);

            const geoData = await geoResponse.json();

            userCity = geoData.city || geoData.locality || geoData.principalSubdivision || '未知';
          } catch (gpsError) {
            // GPS获取失败，静默处理
          }
        }

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

        // 只有在成功获取到IP时才缓存
        if (userIP !== '未知') {
          localStorage.setItem('deviceInfo', JSON.stringify(this.deviceInfo));
          localStorage.setItem('deviceInfoTime', Date.now().toString());
        }
      } catch (error) {
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

      // 角色映射：将旧的角色名映射到新的角色名
      const roleMapping = {
        'super_viewer': 'admin',  // 将旧的super_viewer映射为admin
        'viewer': 'external_user',
        'editor': 'internal_service',
        // 可以根据需要添加更多映射
      };

      const originalRole = res.data.role;
      const mappedRole = roleMapping[originalRole] || originalRole;

      // 角色映射处理

      this.setInfo({
        ...res.data,
        role: mappedRole
      });
    },

    // Login
    async login(loginForm: LoginData) {
      try {
        const res = await userLogin(loginForm);
        setToken(res.data.token);

        // 登录成功后获取用户信息
        await this.info();

        // 异步获取设备信息，不阻塞登录流程
        this.fetchDeviceInfoAsync();
      } catch (err) {
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
