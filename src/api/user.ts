import axios from 'axios';
import type { RouteRecordNormalized } from 'vue-router';
import { UserState } from '@/store/modules/user/types';

export interface LoginData {
  username: string;
  password: string;
}

export interface LoginRes {
  token: string;
}
export function login(data: LoginData) {
  console.log('api.user.login: 发送登录请求', data);
  // 临时直接调用后端API，绕过代理配置问题
  // 确保发送的是普通对象而不是Proxy对象
  const requestData = {
    username: data.username,
    password: data.password
  };
  console.log('api.user.login: 请求数据', requestData);

  // 使用相对路径，让Vite代理处理
  return axios.post<LoginRes>('/api/user/login', requestData);
}

export function logout() {
  return axios.post<LoginRes>('/api/user/logout');
}

export function getUserInfo() {
  return axios.post<UserState>('/api/user/info');
}

export function getMenuList() {
  return axios.post<RouteRecordNormalized[]>('/api/user/menu');
}

// 创建新用户
export interface CreateUserData {
  username: string;
  password: string;
  name?: string;
  email?: string;
  role?: string;
}

export function createUser(data: CreateUserData) {
  return axios.post('/api/user/create', data);
}

// 获取用户列表 (管理员)
export interface UserListItem {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface UserListRes {
  users: UserListItem[];
  total: number;
}

export function getUserList() {
  return axios.get<UserListRes>('/api/user/list');
}

// 删除用户 (管理员)
export function deleteUser(userId: number) {
  return axios.delete(`/api/user/delete/${userId}`);
}
