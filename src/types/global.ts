// 基础类型
export interface AnyObject {
  [key: string]: unknown;
}

export interface Options {
  value: unknown;
  label: string;
}

export interface NodeOptions extends Options {
  children?: NodeOptions[];
}

export interface GetParams {
  body: null;
  type: string;
  url: string;
}

export interface PostData {
  body: string;
  type: string;
  url: string;
}

export interface Pagination {
  current: number;
  pageSize: number;
  total?: number;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  showTotal?: boolean;
}

export type TimeRanger = [string, string];

export interface GeneralChart {
  xAxis: string[];
  data: Array<{ name: string; value: number[] }>;
}

// API响应类型
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
  success?: boolean;
}

// 用户相关类型
export interface UserInfo {
  id: number;
  username: string;
  name: string;
  email?: string;
  role: string;
  avatar?: string;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
  accountId?: number;
}

// 游戏相关类型
export interface GameInfo {
  id: number;
  name: string;
  appid: string;
  appSecret?: string;
  description?: string;
  advertiser_id?: string;
  promotion_id?: string;
  status: 'active' | 'inactive';
  validated: boolean;
  created_at: string;
}

// 权限相关类型
export type UserRole = 'admin' | 'internal_boss' | 'external_boss' | 'internal_service' | 'external_service' | 'internal_user' | 'external_user';

export interface PermissionGroup {
  MANAGEMENT: UserRole[];
  ADMIN_ONLY: UserRole[];
  ADMIN_BOSS: UserRole[];
}

// 设备信息类型
export interface DeviceInfo {
  ip: string;
  city: string;
  phoneBrand: string;
  phoneModel: string;
}

// 统计数据类型
export interface StatsData {
  totalRecords: number;
  totalRevenue: string;
  totalEcpm: string;
  totalUsers: number;
}

// 表格数据类型
export interface TableColumn {
  key: string;
  title: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
}

export interface TableData {
  id: string | number;
  [key: string]: any;
}

// 表单相关类型
export interface FormItem {
  label: string;
  name: string;
  type: 'input' | 'select' | 'textarea' | 'date' | 'number';
  required?: boolean;
  placeholder?: string;
  options?: Options[];
  rules?: any[];
}

// 主题类型
export type ThemeType = 'light' | 'dark' | 'auto';

// 路由相关类型
export interface RouteMeta {
  title?: string;
  requiresAuth?: boolean;
  roles?: UserRole[];
  icon?: string;
  order?: number;
  hideInMenu?: boolean;
  hideChildrenInMenu?: boolean;
}

// 组件Props类型
export interface ComponentProps {
  loading?: boolean;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  type?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
}

// 事件类型
export interface CustomEvents {
  'update:modelValue': [value: any];
  'change': [value: any];
  'submit': [data: any];
  'cancel': [];
  'retry': [];
}
