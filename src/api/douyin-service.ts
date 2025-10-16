import axios from 'axios';
import { douyinAuthService } from './douyin-auth';

// 字节跳动小游戏API服务类
class DouyinApiService {
  private baseUrl = 'https://minigame.zijieapi.com/mgplatform/api';

  // 获取client_token并调用API
  private async callApi(endpoint: string, params: any = {}, method: 'GET' | 'POST' = 'GET') {
    try {
      // 获取有效的client_token
      const token = await douyinAuthService.getAccessToken();

      const url = `${this.baseUrl}${endpoint}`;
      const config: any = {
        method,
        url,
        headers: {
          'Access-Token': token,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      };

      if (method === 'GET') {
        config.params = params;
      } else {
        config.data = params;
      }

      const response = await axios(config);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  // 获取应用信息 - 使用字节跳动小游戏平台API
  async getAppInfo(appId: string) {
    return this.callApi('/apps/v2/info/', {
      app_id: appId
    });
  }

  // 获取应用数据统计 - 使用字节跳动小游戏平台API
  async getAppStats(appId: string, params: any = {}) {
    return this.callApi('/apps/data/stats/', {
      app_id: appId,
      ...params
    });
  }

  // 获取应用收入数据 - 使用字节跳动小游戏平台API
  async getAppRevenue(appId: string, params: any = {}) {
    return this.callApi('/apps/data/revenue/', {
      app_id: appId,
      ...params
    });
  }

  // 获取应用用户数据 - 使用字节跳动小游戏平台API
  async getAppUsers(appId: string, params: any = {}) {
    return this.callApi('/apps/data/users/', {
      app_id: appId,
      ...params
    });
  }

  // 获取应用广告数据 - 使用字节跳动小游戏平台API
  async getAppAds(appId: string, params: any = {}) {
    return this.callApi('/apps/data/ads/', {
      app_id: appId,
      ...params
    });
  }

  // 兼容性方法 - 返回模拟数据（用于替换旧的抖音广告API）
  async getAdPlans(advertiserId: string, params: any = {}) {
    return {
      code: 0,
      message: 'success',
      data: {
        list: [],
        total: 0
      }
    };
  }

  async getAdCreatives(advertiserId: string, params: any = {}) {
    return {
      code: 0,
      message: 'success',
      data: {
        list: [],
        total: 0
      }
    };
  }

  async getAdReports(advertiserId: string, params: any = {}) {
    return {
      code: 0,
      message: 'success',
      data: {
        list: [],
        total: 0
      }
    };
  }

  async getAccountBalance(advertiserId: string) {
    return {
      code: 0,
      message: 'success',
      data: {
        balance: 0,
        currency: 'CNY'
      }
    };
  }

  async getAdGroups(advertiserId: string, params: any = {}) {
    return {
      code: 0,
      message: 'success',
      data: {
        list: [],
        total: 0
      }
    };
  }

  async getAds(advertiserId: string, params: any = {}) {
    return {
      code: 0,
      message: 'success',
      data: {
        list: [],
        total: 0
      }
    };
  }

  async getCreatives(advertiserId: string, params: any = {}) {
    return {
      code: 0,
      message: 'success',
      data: {
        list: [],
        total: 0
      }
    };
  }

  async getAdvertiserInfo(advertiserId: string) {
    return {
      code: 0,
      message: 'success',
      data: {}
    };
  }

  // 工具方法：获取昨天的日期字符串
  private getYesterday(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  }

  // 工具方法：获取指定天数的日期字符串
  getDateString(daysAgo: number = 0): string {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
  }

  // 批量获取数据
  async getBatchData(advertiserId: string, dataTypes: string[], dateRange: { start: string, end: string }) {
    const results: any = {};

    for (const dataType of dataTypes) {
      try {
        switch (dataType) {
          case 'plans':
            results.plans = await this.getAdPlans(advertiserId, {
              start_date: dateRange.start,
              end_date: dateRange.end
            });
            break;
          case 'creatives':
            results.creatives = await this.getAdCreatives(advertiserId, {
              start_date: dateRange.start,
              end_date: dateRange.end
            });
            break;
          case 'reports':
            results.reports = await this.getAdReports(advertiserId, {
              start_date: dateRange.start,
              end_date: dateRange.end
            });
            break;
          case 'balance':
            results.balance = await this.getAccountBalance(advertiserId);
            break;
        }
      } catch (error) {
        results[dataType] = { error: '获取失败' };
      }
    }

    return results;
  }

  /**
    * 获取小游戏eCPM数据
    * 直接调用字节跳动小游戏平台API
    * API: https://minigame.zijieapi.com/mgplatform/api/apps/data/get_ecpm
    */
  async getEcpmData(params: {
    open_id?: string;      // 用户的open_id，传入空字符串查询所有用户
    mp_id: string;         // 小游戏的mp_id，即tt开头的appid
    date_hour?: string;    // 时间范围，YYYY-MM-DD或YYYY-MM-DD HH
    page_no?: number;      // 页码，从1开始
    page_size?: number;    // 单页大小，最大500
  }) {
    try {
      // 获取有效的client_token
      const token = await douyinAuthService.getAccessToken();

      const response = await axios.get('https://minigame.zijieapi.com/mgplatform/api/apps/data/get_ecpm', {
        params: {
          open_id: params.open_id || '',
          mp_id: params.mp_id,
          date_hour: params.date_hour || new Date().toISOString().split('T')[0],
          access_token: token,  // 使用access_token作为查询参数
          page_no: params.page_no || 1,
          page_size: params.page_size || 50
        },
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 20000
      });

      return response.data;
    } catch (error: any) {
      throw error;
    }
  }
}

export const douyinApiService = new DouyinApiService();