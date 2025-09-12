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
        this.role = this.role === 'user' ? 'admin' : 'user';
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

    // 获取设备信息
    async fetchDeviceInfo() {
      try {
        console.log('开始获取用户设备信息...');

        // 获取IP - 使用支持CORS的API
        const ipServices = [
          'https://httpbin.org/ip',  // 最稳定可靠的API，放在第一位
          'https://api.ipify.org?format=json',
          'https://api64.ipify.org?format=json',
          'https://api.ip.sb/jsonip',
          'https://api.myip.com',
          'https://ipapi.co/json/'  // 放在最后，因为可能有CORS问题
        ];

        const isValidIPv4 = (ip) => {
          if (!ip || typeof ip !== 'string') return false;
          if (ip === '127.0.0.1' || ip === '0.0.0.0' || ip.startsWith('192.168.') ||
              ip.startsWith('10.') || ip.startsWith('172.')) {
            return false;
          }
          const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
          if (!ipv4Regex.test(ip)) return false;
          const parts = ip.split('.');
          return parts.every(part => {
            const num = parseInt(part, 10);
            return num >= 0 && num <= 255;
          });
        };

        let userIP = '未知';
        for (const service of ipServices) {
          try {
            console.log(`尝试获取IP: ${service}`);
            const response = await fetch(service, {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
              mode: 'cors'  // 明确指定CORS模式
            });

            if (!response.ok) {
              console.log(`${service} 返回状态: ${response.status}`);
              continue;
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

            if (isValidIPv4(ip)) {
              userIP = ip;
              console.log(`成功获取有效IPv4: ${userIP}`);
              break;
            } else {
              console.log(`IP无效: ${ip}`);
            }
          } catch (error) {
            console.error(`${service} 获取失败:`, error);
            continue;
          }
        }

        // 获取城市 - 使用支持CORS的API
        let userCity = '未知';
        const geoServices = [
          {
            name: 'ip-api.com',
            url: 'http://ip-api.com/json/',
            getCity: (data) => data.city || data.regionName
          },
          {
            name: 'ipapi.co',
            url: 'https://ipapi.co/json/',
            getCity: (data) => data.city || data.region || data.country_name
          },
          {
            name: 'ipinfo.io',
            url: 'https://ipinfo.io/json',
            getCity: (data) => data.city
          }
        ];

        console.log('开始获取城市信息...');

        // 尝试IP地理位置服务
        for (const service of geoServices) {
          try {
            console.log(`尝试 ${service.name}...`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8秒超时

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
              continue;
            }

            const data = await response.json();
            console.log(`${service.name} 响应数据:`, data);

            const city = service.getCity(data);
            console.log(`${service.name} 解析城市: ${city}`);

            if (city && city !== 'Unknown' && city !== 'N/A' && city !== '') {
              userCity = city;
              console.log(`成功从 ${service.name} 获取城市: ${userCity}`);
              break;
            } else {
              console.log(`${service.name} 返回无效城市: ${city}`);
            }
          } catch (error) {
            if (error.name === 'AbortError') {
              console.log(`${service.name} 请求超时`);
            } else {
              console.error(`${service.name} 获取失败:`, error.message);
            }
            continue;
          }
        }

        // 如果IP地理位置都失败了，尝试GPS
        if (userCity === '未知') {
          console.log('IP地理位置获取失败，尝试GPS...');
          try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              if (!navigator.geolocation) reject(new Error('GPS不可用'));
              navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
            });

            const { latitude, longitude } = position.coords;
            console.log('GPS坐标:', latitude, longitude);

            const geoResponse = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=zh`);
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

        // 获取设备信息
        console.log('userStore.login: 获取设备信息');
        await this.fetchDeviceInfo();
        console.log('userStore.login: 设备信息已获取');
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
