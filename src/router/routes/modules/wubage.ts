import { AppRouteRecordRaw } from '../types';

const WUBAGE: AppRouteRecordRaw[] = [
  {
    path: '/wubug',
    name: 'wubug',
    component: () => import('@/views/wubage/index.vue'),
    meta: {
      requiresAuth: false,
      title: '武霸哥登录',
    },
  },
  {
    path: '/wubug/login-form',
    name: 'wubugLoginForm',
    component: () => import('@/views/wubage/login-form.vue'),
    meta: {
      requiresAuth: false,
      title: '武霸哥登录表单',
    },
  },
];

export default WUBAGE;