import axios from 'axios';

// 抖音OAuth认证服务
class DouyinAuthService {
  private appKey: string;
  private appSecret: string;
  private baseUrl: string;

  constructor() {
    this.appKey = import.meta.env.VITE_DOUYIN_APP_KEY || 'tt8c62fadf136c334702';
    this.appSecret = import.meta.env.VITE_DOUYIN_APP_SECRET || '969c80995b1fc13fdbe952d73fb9f8c086706b6b';
    // 现在统一使用后端代理接口
    this.baseUrl = '/api/douyin';
  }

  // 获取Access Token
  async getAccessToken(authCode?: string): Promise<string> {
    try {
      // 如果已有缓存的token且未过期，直接返回
      const cachedToken = this.getCachedToken();
      if (cachedToken) {
        return cachedToken;
      }

      // 方式1: 如果有授权码，使用授权码获取token
      if (authCode) {
        return await this.getTokenByAuthCode(authCode);
      }

      // 方式2: 使用app credentials获取token (适用于服务端应用)
      return await this.getTokenByCredentials();
    } catch (error) {
      throw new Error('获取Access Token失败，请检查App Key和App Secret');
    }
  }

  // 通过授权码获取token
  private async getTokenByAuthCode(authCode: string): Promise<string> {
    const response = await axios.post(`${this.baseUrl}/access_token/`, {
      app_id: this.appKey,
      secret: this.appSecret,
      grant_type: 'auth_code',
      auth_code: authCode,
    });

    if (response.data.code !== 0) {
      throw new Error(response.data.message || '获取token失败');
    }

    const { access_token, expires_in } = response.data.data;
    this.cacheToken(access_token, expires_in);
    return access_token;
  }

  // 通过App凭证获取client_token
  private async getTokenByCredentials(): Promise<string> {
    try {
      // 使用后端代理接口获取client_token
      const response = await axios.post('/douyin/token', {}, {
        timeout: 15000, // 15秒超时
        headers: {
          'Content-Type': 'application/json',
        }
      });

      // 处理后端API响应格式
      if (response.data.data && response.data.data.access_token) {
        // 成功获取token
        const { access_token, expires_in } = response.data.data;
        this.cacheToken(access_token, expires_in);
        return access_token;
      } else if (response.data.err_no !== undefined && response.data.err_no !== 0) {
        // 字节跳动API错误
        throw new Error(response.data.err_tips || response.data.err_msg || '获取client_token失败');
      } else {
        // 其他错误情况
        throw new Error('获取client_token失败：响应格式异常');
      }
    } catch (error: any) {
      // 详细的错误诊断
      this.diagnoseNetworkError(error);

      // 重新抛出错误，不使用模拟token
      throw new Error('获取client_token失败，请检查网络连接或API配置');
    }
  }


  // 缓存token
  private cacheToken(token: string, expiresIn: number): void {
    const expiryTime = Date.now() + (expiresIn - 300) * 1000; // 提前5分钟过期
    localStorage.setItem('douyin_access_token', JSON.stringify({
      token,
      expiryTime,
    }));
  }

  // 获取缓存的token
  private getCachedToken(): string | null {
    try {
      const cached = localStorage.getItem('douyin_access_token');
      if (!cached) return null;

      const { token, expiryTime } = JSON.parse(cached);
      if (Date.now() >= expiryTime) {
        localStorage.removeItem('douyin_access_token');
        return null;
      }

      return token;
    } catch {
      return null;
    }
  }

  // 获取授权URL（用于网页授权）
  getAuthUrl(redirectUri: string, state?: string): string {
    const params = new URLSearchParams({
      app_id: this.appKey,
      redirect_uri: redirectUri,
      scope: 'ads_read',
      response_type: 'code',
      state: state || Date.now().toString(),
    });

    return `https://ad.oceanengine.com/openapi/audit/oauth.html?${params.toString()}`;
  }

  // 刷新token
  async refreshToken(refreshToken: string): Promise<string> {
    const response = await axios.post(`${this.baseUrl}/refresh_token/`, {
      app_id: this.appKey,
      secret: this.appSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    if (response.data.code !== 0) {
      throw new Error(response.data.message || '刷新token失败');
    }

    const { access_token, expires_in } = response.data.data;
    this.cacheToken(access_token, expires_in);
    return access_token;
  }

  // 诊断网络错误
  private diagnoseNetworkError(error: any): void {
    // 网络错误诊断信息已移除，错误信息通过异常抛出
  }

  // 验证配置是否正确
  validateConfig(): boolean {
    return !!(this.appKey && this.appSecret);
  }

  // 获取当前模式状态
  getCurrentMode(): { mode: string; description: string; recommendation: string } {
    const isDev = import.meta.env.DEV;
    const hasValidConfig = this.validateConfig();
    const cachedToken = this.getCachedToken();

    if (!hasValidConfig) {
      return {
        mode: 'config_missing',
        description: '缺少API配置',
        recommendation: '请配置抖音App Key和App Secret'
      };
    }


    if (cachedToken) {
      return {
        mode: 'production',
        description: '生产模式 (真实client_token)',
        recommendation: '正在使用真实的抖音API client_token'
      };
    }

    return {
      mode: 'unknown',
      description: '未知状态',
      recommendation: '请尝试重新获取client_token'
    };
  }
}

export const douyinAuthService = new DouyinAuthService();