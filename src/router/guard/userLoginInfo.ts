import type { Router, LocationQueryRaw } from 'vue-router';
import NProgress from 'nprogress'; // progress bar

import { useUserStore } from '@/store';
import { isLogin } from '@/utils/auth';

export default function setupUserLoginInfoGuard(router: Router) {
  router.beforeEach(async (to, from, next) => {
    NProgress.start();
    const userStore = useUserStore();
    if (isLogin()) {
      if (userStore.role) {
        // 程序员和文员登录后重定向到主体管理页面
        if ((userStore.role === 'programmer' || userStore.role === 'clerk') && to.name === 'login') {
          next({ name: 'EntityManagement' });
          return;
        }
        next();
      } else {
        try {
          await userStore.info();
          // 程序员和文员登录后重定向到主体管理页面
          if ((userStore.role === 'programmer' || userStore.role === 'clerk') && to.name === 'login') {
            next({ name: 'EntityManagement' });
            return;
          }
          next();
        } catch (error) {
          await userStore.logout();
          next({
            name: 'login',
            query: {
              redirect: to.name,
              ...to.query,
            } as LocationQueryRaw,
          });
        }
      }
    } else {
      // 允许所有不需要认证的路由通过
      if (to.meta?.requiresAuth === false) {
        next();
        return;
      }
      if (to.name === 'login') {
        next();
        return;
      }
      next({
        name: 'login',
        query: {
          redirect: to.name,
          ...to.query,
        } as LocationQueryRaw,
      });
    }
  });
}
