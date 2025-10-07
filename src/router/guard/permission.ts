import type { Router, RouteRecordNormalized } from 'vue-router';
import NProgress from 'nprogress'; // progress bar

import usePermission from '@/hooks/permission';
import { useUserStore, useAppStore } from '@/store';
import { appRoutes } from '../routes';
import { WHITE_LIST, NOT_FOUND } from '../constants';

export default function setupPermissionGuard(router: Router) {
  router.beforeEach(async (to, from, next) => {
    console.log('🔍 Route guard triggered:', { to: to.name, from: from.name, path: to.path });
    const appStore = useAppStore();
    const userStore = useUserStore();
    const Permission = usePermission();
    const permissionsAllow = Permission.accessRouter(to);
    console.log('Access router check:', { route: to.name, requiresAuth: to.meta?.requiresAuth, roles: to.meta?.roles, userRole: userStore.role, hasAccess: permissionsAllow });

    if (appStore.menuFromServer) {
      // 针对来自服务端的菜单配置进行处理
      // Handle routing configuration from the server

      // 根据需要自行完善来源于服务端的菜单配置的permission逻辑
      // Refine the permission logic from the server's menu configuration as needed
      if (
        !appStore.appAsyncMenus.length &&
        !WHITE_LIST.find((el) => el.name === to.name)
      ) {
        await appStore.fetchServerMenuConfig();
      }
      const serverMenuConfig = [...appStore.appAsyncMenus, ...WHITE_LIST];

      let exist = false;
      while (serverMenuConfig.length && !exist) {
        const element = serverMenuConfig.shift();
        if (element?.name === to.name) exist = true;

        if (element?.children) {
          serverMenuConfig.push(
            ...(element.children as unknown as RouteRecordNormalized[])
          );
        }
      }
      if (exist && permissionsAllow) {
        console.log('Server menu config: access allowed');
        next();
      } else {
        console.log('Server menu config: access denied, redirecting to NOT_FOUND');
        next(NOT_FOUND);
      }
    } else {
      // eslint-disable-next-line no-lonely-if
      if (permissionsAllow) {
        console.log('Client menu config: access allowed');
        next();
      } else {
        const destination =
          Permission.findFirstPermissionRoute(appRoutes, userStore.role) ||
          NOT_FOUND;
        console.log('Client menu config: access denied, redirecting to:', destination);
        next(destination);
      }
    }
    NProgress.done();
  });
}
