import { DEFAULT_LAYOUT } from '../base';
import { AppRouteRecordRaw } from '../types';

const AD: AppRouteRecordRaw = {
  path: '/ad',
  name: 'ad',
  component: DEFAULT_LAYOUT,
  meta: {
    locale: 'menu.ad',
    requiresAuth: true,
    icon: 'icon-bar-chart',
    order: 2,
    roles: ['*'], // 父级路由允许所有登录用户访问，具体权限由子路由控制
  },
  children: [
    // 用户ECPM数据查看 - 所有登录用户都可以访问
    {
      path: 'ecpm-user',
      name: 'EcpmUser',
      component: () => import('@/views/ad/ecpm-user/index.vue'),
      meta: {
        locale: 'menu.ad.ecpm.user',
        requiresAuth: true,
        roles: ['*'], // 所有用户都可以访问
      },
    },
    // 灰游ECPM数据查看 - 仅内部角色和管理员可以访问
    {
      path: 'ecpm-gray',
      name: 'EcpmGray',
      component: () => import('@/views/ad/ecpm-gray/index.vue'),
      meta: {
        locale: 'menu.ad.ecpm.gray',
        requiresAuth: true,
        roles: ['admin', 'internal_boss', 'internal_service', 'internal_user_1', 'internal_user_2', 'internal_user_3'], // 仅内部角色可以访问
      },
    },
    // Token管理页面 - 管理员可以访问
    // {
    //   path: 'token-management',
    //   name: 'TokenManagement',
    //   component: () => import('@/views/token-management/index.vue'),
    //   meta: {
    //     locale: 'menu.ad.token.management',
    //     requiresAuth: true,
    //     roles: ['admin'], // 只有管理员可以访问
    //   },
    // },
  ],
};

export default AD;
