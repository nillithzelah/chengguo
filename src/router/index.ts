import { createRouter, createWebHistory } from 'vue-router';
import NProgress from 'nprogress'; // progress bar
import 'nprogress/nprogress.css';

import { appRoutes } from './routes';
import { REDIRECT_MAIN, NOT_FOUND_ROUTE } from './routes/base';
import createRouteGuard from './guard';

NProgress.configure({ showSpinner: false }); // NProgress Configuration

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: () => {
        // 检查域名，如果是www.wubug.cc，重定向到武霸哥页面
        if (typeof window !== 'undefined' && window.location.hostname === 'www.wubug.cc') {
          return '/wubage';
        }
        return '/login';
      },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/login/index.vue'),
      meta: {
        requiresAuth: false,
        title: '登录',
      },
    },
    {
      path: '/login-form',
      name: 'loginForm',
      component: () => import('@/views/login/login-form.vue'),
      meta: {
        requiresAuth: false,
        title: '登录表单',
      },
    },
    ...appRoutes,
    REDIRECT_MAIN,
    NOT_FOUND_ROUTE,
  ],
  scrollBehavior(to, from, savedPosition) {
    // 如果有保存的滚动位置，返回该位置
    if (savedPosition) {
      return savedPosition;
    }

    // 如果目标路由有hash，滚动到对应元素
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth',
      };
    }

    // 默认滚动到顶部
    return {
      top: 0,
      behavior: 'smooth',
    };
  },
});

createRouteGuard(router);

export default router;
