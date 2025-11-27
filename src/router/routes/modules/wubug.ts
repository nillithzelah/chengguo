import { AppRouteRecordRaw } from '../types';

const WUBUG: AppRouteRecordRaw[] = [
  {
    path: '/wubug',
    name: 'wubug',
    component: () => import('@/views/wubug/index.vue'),
    meta: {
      requiresAuth: false,
      title: '武霸哥登录',
    },
  },
  {
    path: '/wubug/login-form',
    name: 'wubugLoginForm',
    component: () => import('@/views/wubug/login-form.vue'),
    meta: {
      requiresAuth: false,
      title: '武霸哥登录表单',
    },
  },
];

export default WUBUG;