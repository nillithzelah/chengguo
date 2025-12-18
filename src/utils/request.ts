import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Message } from '@arco-design/web-vue';
import { getToken } from '@/utils/auth';

// 导出类型
export interface RequestResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export interface RequestOptions extends AxiosRequestConfig {
  loading?: boolean;
  errorMessage?: string;
}

export interface RequestInstance {
  <T = any>(config: AxiosRequestConfig): Promise<RequestResponse<T>>;
  get: <T = any>(url: string, params?: any, config?: RequestOptions) => Promise<RequestResponse<T>>;
  post: <T = any>(url: string, data?: any, config?: RequestOptions) => Promise<RequestResponse<T>>;
  put: <T = any>(url: string, data?: any, config?: RequestOptions) => Promise<RequestResponse<T>>;
  delete: <T = any>(url: string, params?: any, config?: RequestOptions) => Promise<RequestResponse<T>>;
}

// 创建 axios 实例
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000, // 请求超时时间
});

// 请求拦截器
service.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // 在请求发送之前做一些处理
    const token = getToken();
    if (token) {
      // 如果 token 存在，则添加到请求头中
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // 请求错误处理
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data;

    // 处理字节跳动API响应格式 (抖音API使用err_no)
    if (res.err_no !== undefined) {
      // 字节跳动API响应
      if (res.err_no === 0) {
        // 成功响应
        return res;
      } else {
        // 错误响应
        const errorMsg = res.err_tips || res.err_msg || '字节跳动API错误';
        console.error('字节跳动API错误:', errorMsg);
        return Promise.reject(new Error(errorMsg));
      }
    }

    // 处理标准API响应格式
    if (res.code === 20000) {
      // 后端成功响应，统一数据格式
      response.data = res.data;
      return response;
    }

    // 如果有data字段且没有明确的错误码，认为是成功响应
    if (res.data !== undefined && (res.code === undefined || res.code === 0 || res.code === 200 || res.code === '100')) {
      return res;
    }

    // 检查是否有明确的错误码
    if (res.code !== undefined && res.code !== '100' && res.code !== 200 && res.code !== 0 && res.code !== 20000) {
      console.error('API错误:', res.message || 'Error');

      // 401: 未登录或token过期
      if (res.code === 401) {
        // 跳转到登录页
        // router.push('/login');
      }
      return Promise.reject(new Error(res.message || 'Error'));
    }

    // 默认返回响应（兼容各种格式）
    return res;
  },
  (error) => {
    console.error('Response Error:', error);
    
    let errorMessage = '请求失败';
    if (error.response) {
      // 请求已发出，服务器返回状态码不在 2xx 范围内
      switch (error.response.status) {
        case 400:
          errorMessage = '请求参数错误';
          break;
        case 401:
          errorMessage = '未授权，请重新登录';
          // 跳转到登录页
          // router.push('/login');
          break;
        case 403:
          errorMessage = '拒绝访问';
          break;
        case 404:
          errorMessage = '请求地址出错';
          break;
        case 408:
          errorMessage = '请求超时';
          break;
        case 500:
          errorMessage = '服务器内部错误';
          break;
        case 501:
          errorMessage = '服务未实现';
          break;
        case 502:
          errorMessage = '网关错误';
          break;
        case 503:
          errorMessage = '服务不可用';
          break;
        case 504:
          errorMessage = '网关超时';
          break;
        case 505:
          errorMessage = 'HTTP版本不受支持';
          break;
        default:
          errorMessage = '未知错误';
      }
    } else if (error.message.includes('timeout')) {
      errorMessage = '请求超时';
    } else if (error.message === 'Network Error') {
      errorMessage = '网络连接错误';
    }
    
    console.error('请求错误:', errorMessage);
    
    return Promise.reject(error);
  }
);

// 封装 GET 请求
export function get<T = any>(
  url: string,
  params?: any,
  config: AxiosRequestConfig = {}
): Promise<T> {
  return service.get(url, {
    params,
    ...config,
  });
}

// 封装 POST 请求
export function post<T = any>(
  url: string,
  data?: any,
  config: AxiosRequestConfig = {}
): Promise<T> {
  return service.post(url, data, config);
}

// 封装 PUT 请求
export function put<T = any>(
  url: string,
  data?: any,
  config: AxiosRequestConfig = {}
): Promise<T> {
  return service.put(url, data, config);
}

// 封装 DELETE 请求
export function del<T = any>(
  url: string,
  params?: any,
  config: AxiosRequestConfig = {}
): Promise<T> {
  return service.delete(url, {
    params,
    ...config,
  });
}

// 类型断言
const request = service as unknown as RequestInstance;

export default request;
