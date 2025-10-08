import { DEFAULT_LAYOUT } from '../base';
import { AppRouteRecordRaw } from '../types';

const USER: AppRouteRecordRaw = {
  path: '/user',
  name: 'user',
  component: DEFAULT_LAYOUT,
  redirect: '/user/management', // 重定向到用户管理页面
  meta: {
    locale: 'menu.user',
    icon: 'icon-user',
    requiresAuth: true,
    order: 7,
    roles: ['admin'], // 只有管理员可以访问用户模块
  },
  children: [
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
    {
      path: 'user-game-management',
      name: 'UserGameManagement',
      component: () => import('@/views/user/game-management/index.vue'),
      meta: {
        locale: 'menu.user.game.user',
        requiresAuth: true,
        roles: ['admin'], // 只有管理员可以访问
      },
    },
    {
      path: 'game-management',
      name: 'GameManagement',
      component: () => import('@/views/game-management/index.vue'),
      meta: {
        locale: 'menu.user.game.admin',
        requiresAuth: true,
        roles: ['admin'], // 只有管理员可以访问
      },
    },
  ],
};

export default USER;
