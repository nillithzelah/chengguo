import axios from 'axios';
import type { RouteRecordNormalized } from 'vue-router';
import { UserState } from '@/store/modules/user/types';

export interface LoginData {
  username: string;
  password: string;
  deviceInfo?: any; // 设备信息（可选）
}

export interface LoginRes {
  token: string;
}
export function login(data: LoginData) {
  // 临时直接调用后端API，绕过代理配置问题
  // 确保发送的是普通对象而不是Proxy对象
  const requestData = {
    username: data.username,
    password: data.password,
    deviceInfo: data.deviceInfo // 添加设备信息
  };

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
  created_by?: number;
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
  created_by?: number | null;
  creator_name?: string;
  parent_id?: number | null;
  parent_name?: string;
  password?: string;
}

export interface UserListRes {
  users: UserListItem[];
  total: number;
}

export function getUserList() {
  return axios.get<UserListRes>('/api/user/list');
}

// 更新用户 (管理员)
export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: string;
  is_active?: boolean;
}

export function updateUser(userId: number, data: UpdateUserData) {
  return axios.put(`/api/user/update/${userId}`, data);
}

// 删除用户 (管理员)
export function deleteUser(userId: number) {
  return axios.delete(`/api/user/delete/${userId}`);
}

// 获取用户基本信息列表 (管理员，用于用户选择器)
export interface UserBasicItem {
  id: number;
  username: string;
  name: string;
  role: string;
  created_by?: number;
}

export interface UserBasicListRes {
  users: UserBasicItem[];
  total: number;
}

export function getUserBasicList() {
  return axios.get<UserBasicListRes>('/api/user/basic-list');
}

// 获取用户游戏列表 (管理员)
export interface GameInfo {
  id: number;
  appid: string;
  name: string;
  description: string;
  status: string;
  validated: boolean;
  advertiser_id?: string;
  promotion_id?: string;
  created_at: string;
}

export interface UserGameItem {
  id: number;
  game: GameInfo;
  role: string;
  permissions: any;
  assigned_at: string;
  assigned_by: {
    username: string;
    name: string;
  } | null;
}

export interface UserGameListRes {
  user: {
    id: number;
    username: string;
    name: string;
    role: string;
  };
  games: UserGameItem[];
  total: number;
}

export function getUserGames(userId: number) {
  return axios.get<UserGameListRes>(`/api/game/user-games/${userId}`);
}

// 为用户分配游戏权限
export interface AssignGameData {
  userId: number;
  gameId: number;
  role?: 'owner' | 'editor' | 'viewer';
}

export function assignGameToUser(data: AssignGameData) {
  return axios.post('/api/game/assign', data);
}

// 移除用户的游戏权限
export function removeUserGame(userId: number, gameId: number) {
  return axios.delete(`/api/game/remove/${userId}/${gameId}`);
}

// 获取所有游戏列表
export interface GameItem {
  id: number;
  appid: string;
  name: string;
  description: string;
  status: string;
  validated: boolean;
  created_at: string;
}

export interface GameListRes {
  games: GameItem[];
  total: number;
}

export function getGameList() {
  return axios.get<GameListRes>('/api/game/list');
}

// 创建新游戏
export interface CreateGameData {
  name: string;
  appid: string;
  appSecret: string;
  description?: string;
  advertiser_id?: string;
  promotion_id?: string;
}

export interface CreateGameRes {
  game: GameItem;
  id: number;
}

export function createGame(data: CreateGameData) {
  return axios.post<CreateGameRes>('/api/game/create', data);
}

// 删除游戏 (管理员)
export function deleteGame(gameId: number) {
  return axios.delete(`/api/game/delete/${gameId}`);
}

// 用户等级晋升相关接口

// 获取用户层级信息和可晋升用户列表
export interface UserHierarchyInfo {
  user: UserListItem;
  subordinateUsers: UserListItem[];
  promotableUsers: Array<{
    user: UserListItem;
    newRole: string;
    canPromote: boolean;
  }>;
  hierarchyChain: Array<{
    id: number;
    username: string;
    name: string;
    role: string;
  }>;
}

export function getUserHierarchy(userId: number) {
  return axios.get<UserHierarchyInfo>(`/api/user/hierarchy/${userId}`);
}

// 执行用户等级晋升
export interface PromoteUsersData {
  userId: number; // 被晋升的用户ID
  targetRole?: string; // 目标角色（可选，如果不提供则自动晋升一级）
  promoteSubordinates?: boolean; // 是否同时晋升所有下级用户
}

export interface PromoteUsersRes {
  promotedUsers: Array<{
    id: number;
    username: string;
    oldRole: string;
    newRole: string;
  }>;
  totalPromoted: number;
}

export function promoteUsers(data: PromoteUsersData) {
  return axios.post<PromoteUsersRes>('/api/user/promote', data);
}

// 获取所有下级用户ID（用于批量操作）
export function getAllSubordinateIds(userId: number) {
  return axios.get<number[]>(`/api/user/subordinates/${userId}`);
}
