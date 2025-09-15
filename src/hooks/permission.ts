import { RouteLocationNormalized, RouteRecordRaw } from 'vue-router';
import { useUserStore } from '@/store';

export default function usePermission() {
  const userStore = useUserStore();
  return {
    accessRouter(route: RouteLocationNormalized | RouteRecordRaw) {
      return (
        !route.meta?.requiresAuth ||
        !route.meta?.roles ||
        route.meta?.roles?.includes('*') ||
        route.meta?.roles?.includes(userStore.role)
      );
    },
    findFirstPermissionRoute(_routers: any, role = 'admin') {
      // 优先跳转到ECPM用户数据查看页面
      const preferredRoutes = ['EcpmUser'];

      // 首先尝试跳转到首选路由
      for (const preferredRoute of preferredRoutes) {
        const route = this.findRouteByName(_routers, preferredRoute);
        if (route && this.accessRouter(route)) {
          return { name: route.name };
        }
      }

      // 如果首选路由不可访问，则使用原来的逻辑
      const cloneRouters = [..._routers];
      while (cloneRouters.length) {
        const firstElement = cloneRouters.shift();
        if (
          firstElement?.meta?.roles?.find((el: string[]) => {
            return el.includes('*') || el.includes(role);
          })
        )
          return { name: firstElement.name };
        if (firstElement?.children) {
          cloneRouters.push(...firstElement.children);
        }
      }
      return null;
    },

    // 辅助函数：根据路由名称查找路由
    findRouteByName(routers: any[], name: string): any {
      for (const router of routers) {
        if (router.name === name) {
          return router;
        }
        if (router.children) {
          const found = this.findRouteByName(router.children, name);
          if (found) return found;
        }
      }
      return null;
    },
    // You can add any rules you want
  };
}
