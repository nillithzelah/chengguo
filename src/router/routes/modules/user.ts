import { DEFAULT_LAYOUT } from '../base';
import { AppRouteRecordRaw } from '../types';

const USER: AppRouteRecordRaw = {
  path: '/user',
  name: 'user',
  component: DEFAULT_LAYOUT,
  meta: {
    locale: 'menu.user',
    icon: 'icon-user',
    requiresAuth: true,
    order: 7,
    hideInMenu: true,
  },
  children: [
    // {
    //   path: 'info',
    //   name: 'Info',
    //   component: () => import('@/views/user/info/index.vue'),
    //   meta: {
    //     locale: 'menu.user.info',
    //     requiresAuth: true,
    //     roles: ['admin'], // 只有管理员可以访问
    //   },
    // },
    // {
    //   path: 'setting',
    //   name: 'Setting',
    //   component: () => import('@/views/user/setting/index.vue'),
    //   meta: {
    //     locale: 'menu.user.setting',
    //     requiresAuth: true,
    //     roles: ['admin'], // 只有管理员可以访问
    //   },
    // },
    {
      path: 'management',
      name: 'UserManagement',
      component: () => import('@/views/user/management/index.vue'),
      meta: {
        locale: 'menu.user.management',
        requiresAuth: true,
        roles: ['admin'], // 只有管理员可以访问
      },
    },
  ],
};

export default USER;
