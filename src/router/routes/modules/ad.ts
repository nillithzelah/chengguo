import { DEFAULT_LAYOUT } from '../base';
import { AppRouteRecordRaw } from '../types';

const AD: AppRouteRecordRaw = {
  path: '/ad',
  name: 'ad',
  component: DEFAULT_LAYOUT,
  meta: {
    locale: 'menu.ad',
    requiresAuth: true,
    icon: 'icon-advertisement',
    order: 2,
    roles: ['*'], // 允许所有登录用户访问，因为ecpm-user对所有用户开放
  },
  children: [
    // 管理员ECPM数据管理 - 已隐藏，不允许任何用户访问
    {
      path: 'ecpm-simple',
      name: 'EcpmSimple',
      component: () => import('@/views/ad/ecpm-simple/index.vue'),
      meta: {
        locale: 'menu.ad.ecpm.simple',
        requiresAuth: true,
        roles: [], // 设置为空数组，完全禁止访问
        hideInMenu: true, // 隐藏菜单项
      },
    },
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
  ],
};

export default AD;
