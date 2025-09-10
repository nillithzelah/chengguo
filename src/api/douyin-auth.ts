import axios from 'axios';

// 抖音OAuth认证服务
class DouyinAuthService {
  private appKey: string;
  private appSecret: string;
  private baseUrl: string;

  constructor() {
    this.appKey = import.meta.env.VITE_DOUYIN_APP_KEY || 'tt8c62fadf136c334702';
    this.appSecret = import.meta.env.VITE_DOUYIN_APP_SECRET || '56808246ee49c052ecc7be8be79551859837409e';
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
      console.error('获取Access Token失败:', error);
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
      console.log('🔄 正在获取抖音API client_token...');
      // 使用后端代理接口获取client_token
      const response = await axios.post('/douyin/token', {}, {
        timeout: 15000, // 15秒超时
        headers: {
          'Content-Type': 'application/json',
        }
      });

      // 处理后端API响应格式
      if (response.data.data && response.data.data.access_token) {
        console.log('🔑 获取到的token:', response.data.data.access_token)
        // 成功获取token
        const { access_token, expires_in } = response.data.data;
        this.cacheToken(access_token, expires_in);
        console.log('✅ 成功获取client_token');
        console.log('⏰ 过期时间:', new Date(Date.now() + expires_in * 1000).toLocaleString());
        return access_token;
      } else if (response.data.err_no !== undefined && response.data.err_no !== 0) {
        // 字节跳动API错误
        throw new Error(response.data.err_tips || response.data.err_msg || '获取client_token失败');
      } else {
        // 其他错误情况
        throw new Error('获取client_token失败：响应格式异常');
      }
    } catch (error: any) {
      console.error('❌ 通过凭证获取client_token失败:', error);

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
    console.group('🔍 网络错误诊断');
    
    if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
      console.error('📡 网络连接问题:');
      console.error('   • 检查网络连接是否正常');
      console.error('   • 抖音开放平台要求HTTPS协议');
      console.error('   • 当前使用HTTP可能被拒绝连接');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🚫 连接被拒绝:');
      console.error('   • 服务器拒绝连接');
      console.error('   • 检查防火墙设置');
      console.error('   • 可能需要VPN或代理');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('⏰ 请求超时:');
      console.error('   • 网络延迟过高');
      console.error('   • 尝试重新请求');
    } else if (error.response) {
      console.error('📄 服务器响应错误:');
      console.error('   • 状态码:', error.response.status);
      console.error('   • 响应内容:', error.response.data);
    }
    
    console.error('💡 建议解决方案:');
    console.error('   1. 检查网络连接是否正常');
    console.error('   2. 确认抖音开放平台配置正确');
    console.error('   3. 检查防火墙和代理设置');
    console.error('   4. 联系技术支持获取帮助');
    
    console.groupEnd();
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