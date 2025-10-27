import { RouteLocationNormalized, RouteRecordRaw } from 'vue-router';
import { useUserStore } from '@/store';
import { getToken } from '@/utils/auth';

export default function usePermission() {
  const userStore = useUserStore();

  // 角色映射：兼容以前的角色类型，默认迁移为内部角色
  const roleMapping: Record<string, string> = {
    'admin': 'admin',
    'super_viewer': 'internal_boss',
    'viewer': 'internal_user',
    'user': 'internal_user',
    'moderator': 'internal_service', // 审核角色映射为内部客服
  };

  // 获取映射后的角色
  const getMappedRole = (role: string) => roleMapping[role] || role;

  return {
    accessRouter(route: RouteLocationNormalized | RouteRecordRaw) {
      const mappedRole = getMappedRole(userStore.role);
      const hasAccess = (
        !route.meta?.requiresAuth ||
        !route.meta?.roles ||
        route.meta?.roles?.includes('*') ||
        route.meta?.roles?.includes(mappedRole)
      );

      // 程序员特殊处理：如果路由标记为hideForProgrammer且用户是程序员，则隐藏
      if (mappedRole === 'programmer' && route.meta?.hideForProgrammer) {
        return false;
      }

      return hasAccess;
    },
    findFirstPermissionRoute(_routers: any, role = 'admin') {
      // 优先跳转到用户管理页面
      const preferredRoutes = ['UserManagement'];

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
          firstElement?.meta?.roles?.find((el: string) => {
            return el === '*' || el === role;
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
