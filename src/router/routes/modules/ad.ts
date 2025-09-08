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
  },
  children: [
    {
      path: 'ecpm-simple',
      name: 'EcpmSimple',
      component: () => import('@/views/ad/ecpm-simple/index.vue'),
      meta: {
        locale: 'menu.ad.ecpm.simple',
        requiresAuth: true,
        roles: ['admin'],
      },
    },
  ],
};

export default AD;
