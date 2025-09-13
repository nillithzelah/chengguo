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
    roles: ['admin', 'super_viewer', 'viewer', 'moderator'], // 与子路由权限一致
  },
  children: [
    {
      path: 'management',
      name: 'UserManagement',
      component: () => import('@/views/user/management/index.vue'),
      meta: {
        locale: 'menu.user.management',
        requiresAuth: true,
        roles: ['admin', 'super_viewer', 'viewer', 'moderator'], // 除了user外的所有角色可以访问
      },
    },
    {
      path: 'user-game-management',
      name: 'UserGameManagement',
      component: () => import('@/views/user/game-management/index.vue'),
      meta: {
        locale: 'menu.user.game.user',
        requiresAuth: true,
        roles: ['admin', 'super_viewer', 'viewer', 'moderator'], // 除了user外的所有角色可以访问
      },
    },
    {
      path: 'game-management',
      name: 'GameManagement',
      component: () => import('@/views/game-management/index.vue'),
      meta: {
        locale: 'menu.user.game.admin',
        requiresAuth: true,
        roles: ['admin', 'super_viewer', 'viewer', 'moderator'], // 除了user外的所有角色可以访问
      },
    },
  ],
};

export default USER;
