import axios from 'axios';
import { douyinAuthService } from './douyin-auth';

export class OceanEngineService {
  private static instance: OceanEngineService;
  private baseUrl = 'https://ad.oceanengine.com/open_api/v1.0';
  private accessToken: string = '';
  private refreshToken: string = '';
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  private constructor() {}

  public static getInstance(): OceanEngineService {
    if (!OceanEngineService.instance) {
      OceanEngineService.instance = new OceanEngineService();
    }
    return OceanEngineService.instance;
  }

  private async ensureToken() {
    if (!this.accessToken) {
      await this.refreshAccessToken();
    }
    return this.accessToken;
  }

  private async refreshAccessToken() {
    if (this.isRefreshing) {
      return new Promise<string>((resolve) => {
        this.refreshSubscribers.push((token) => {
          resolve(token);
        });
      });
    }

    this.isRefreshing = true;
    
    try {
      // 使用现有的认证服务获取token
      const token = await douyinAuthService.getAccessToken();
      this.accessToken = token;
      
      // 通知所有等待token刷新的请求
      this.refreshSubscribers.forEach(callback => callback(token));
      this.refreshSubscribers = [];
      
      return token;
    } catch (error) {
      console.error('刷新Access Token失败:', error);
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  private async request(config: any) {
    try {
      const token = await this.ensureToken();
      const response = await axios({
        ...config,
        headers: {
          ...config.headers,
          'Access-Token': token,
          'Content-Type': 'application/json',
        },
        baseURL: this.baseUrl,
      });

      const { code, message, data } = response.data;
      if (code !== 0) {
        throw new Error(`OceanEngine API错误: ${message}`);
      }
      
      return data;
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        // Token过期，尝试刷新
        const token = await this.refreshAccessToken();
        
        // 使用新token重试请求
        const retryConfig = {
          ...config,
          headers: {
            ...config.headers,
            'Access-Token': token,
          },
        };
        
        const response = await axios(retryConfig);
        return response.data;
      }
      
      console.error('OceanEngine请求失败:', error);
      throw error;
    }
  }

  // 获取广告列表
  public async getAdList(params: {
    advertiser_id: string | number;
    page?: number;
    page_size?: number;
    filtering?: any;
  }) {
    return this.request({
      method: 'GET',
      url: '/report/ad/get/',
      params: {
        ...params,
        page: params.page || 1,
        page_size: params.page_size || 20,
      },
    });
  }

  // 获取广告统计数据
  public async getAdvertiserReport(advertiserId: string | number, metrics: string[] = []) {
    return this.request({
      method: 'GET',
      url: '/report/advertiser/get/',
      params: {
        advertiser_id: advertiserId,
        metrics: metrics.length ? metrics.join(',') : 'cost,show,click,convert',
      },
    });
  }
}

export const oceanEngineService = OceanEngineService.getInstance();
