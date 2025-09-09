import axios from 'axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Message, Modal } from '@arco-design/web-vue';
import { useUserStore } from '@/store';
import { getToken } from '@/utils/auth';

export interface HttpResponse<T = unknown> {
  status: number;
  msg: string;
  code: number;
  data: T;
}

// 抖音API响应接口
export interface DouyinResponse<T = unknown> {
  err_no: number;
  err_tips?: string;
  err_msg?: string;
  data: T;
  log_id?: string;
}

// 强制清除baseURL，确保使用相对路径
axios.defaults.baseURL = '';
console.log('interceptor: 强制清除baseURL，确保使用相对路径');
console.log('interceptor: 当前baseURL:', axios.defaults.baseURL);

axios.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // let each request carry token
    // this example using the JWT token
    // Authorization is a custom headers key
    // please modify it according to the actual situation
    const token = getToken();
    if (token) {
      if (!config.headers) {
        config.headers = {};
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // do something
    return Promise.reject(error);
  }
);
// add response interceptors
axios.interceptors.response.use(
  (response: AxiosResponse<HttpResponse | DouyinResponse>) => {
    const res = response.data as any;

    console.log('axios.interceptor.response: 收到响应', {
      url: response.config.url,
      status: response.status,
      data: res
    });

    // 检查是否是抖音API响应（抖音API使用 err_no 字段）
    if (res.err_no !== undefined) {
      // 抖音API响应格式处理
      if (res.err_no !== 0) {
        Message.error({
          content: res.err_tips || res.err_msg || '抖音API错误',
          duration: 5 * 1000,
        });
        return Promise.reject(new Error(res.err_tips || res.err_msg || '抖音API错误'));
      }
      return res;
    }

    // 标准API响应格式处理
    // if the custom code is not 20000, it is judged as an error.
    console.log('axios.interceptor.response: 检查响应码', {
      code: res.code,
      expected: 20000,
      isMatch: res.code === 20000
    });

    if (res.code !== 20000) {
      console.log('axios.interceptor.response: 响应码不匹配，抛出错误');
      Message.error({
        content: res.msg || 'Error',
        duration: 5 * 1000,
      });
      // 50008: Illegal token; 50012: Other clients logged in; 50014: Token expired;
      if (
        [50008, 50012, 50014].includes(res.code) &&
        response.config.url !== '/api/user/info'
      ) {
        Modal.error({
          title: 'Confirm logout',
          content:
            'You have been logged out, you can cancel to stay on this page, or log in again',
          okText: 'Re-Login',
          async onOk() {
            const userStore = useUserStore();

            await userStore.logout();
            window.location.reload();
          },
        });
      }
      return Promise.reject(new Error(res.msg || 'Error'));
    }

    console.log('axios.interceptor.response: 响应处理成功');
    return res;
  },
  (error) => {
    Message.error({
      content: error.msg || 'Request Error',
      duration: 5 * 1000,
    });
    return Promise.reject(error);
  }
);
