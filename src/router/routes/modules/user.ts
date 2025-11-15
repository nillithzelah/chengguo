import { DEFAULT_LAYOUT } from '../base';
import { AppRouteRecordRaw } from '../types';

const USER: AppRouteRecordRaw = {
  path: '/user',
  name: 'user',
  component: DEFAULT_LAYOUT,
  redirect: '/user/entity-management', // 程序员和文员重定向到主体管理页面
  meta: {
    locale: 'menu.user',
    icon: 'icon-user',
    requiresAuth: true,
    order: 7,
    roles: ['admin', 'super_viewer', 'internal_boss', 'external_boss', 'internal_service', 'external_service', 'programmer', 'clerk'], // 管理员、超级查看者、老板、客服、程序员可以访问
  },
  children: [
    {
      path: 'management',
      name: 'UserManagement',
      component: () => import('@/views/user/management/index.vue'),
      meta: {
        locale: 'menu.user.management',
        requiresAuth: true,
        roles: ['admin', 'super_viewer', 'internal_boss', 'external_boss', 'internal_service', 'external_service', 'clerk'], // 管理员、超级查看者、老板、客服、文员可以访问
        hideForProgrammer: true, // 程序员不显示此菜单
      },
    },
    {
      path: 'entity-management',
      name: 'EntityManagement',
      component: () => import('@/views/user/entity-management/index.vue'),
      meta: {
        locale: 'menu.user.entity',
        requiresAuth: true,
        roles: ['admin', 'internal_boss', 'programmer', 'clerk'], // 管理员、内部老板、程序员和文员可以访问
      },
    },
    {
      path: 'user-game-management',
      name: 'UserGameManagement',
      component: () => import('@/views/user/user-game-management/index.vue'),
      meta: {
        locale: 'menu.user.game.user',
        requiresAuth: true,
        roles: ['admin', 'super_viewer', 'internal_boss', 'external_boss', 'internal_service', 'external_service', 'clerk'], // 管理员、超级查看者、老板、客服、文员可以访问
        hideForProgrammer: true, // 程序员不显示此菜单
      },
    },
    {
      path: 'game-management',
      name: 'GameManagement',
      component: () => import('@/views/user/game-management/index.vue'),
      meta: {
        locale: 'menu.user.game.admin',
        requiresAuth: true,
        roles: ['admin', 'super_viewer', 'internal_boss', 'external_boss', 'internal_service', 'external_service', 'clerk'], // 管理员、超级查看者、老板、客服、文员可以访问
        hideForProgrammer: true, // 程序员不显示此菜单
      },
    },
  ],
};

export default USER;
