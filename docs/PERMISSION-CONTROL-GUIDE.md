# 权限控制实现指南

## 概述
本文档记录了基于Vue Router的权限控制实现机制，用于控制不同用户角色对页面的访问权限。

## 核心原理

### 1. 路由配置层面的权限控制
在路由配置中通过 `meta.roles` 定义允许访问的角色：

```typescript
// src/router/routes/modules/ad.ts
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
    // 管理员ECPM数据管理 - 只有管理员和超级查看者可以访问
    {
      path: 'ecpm-simple',
      name: 'EcpmSimple',
      component: () => import('@/views/ad/ecpm-simple/index.vue'),
      meta: {
        locale: 'menu.ad.ecpm.simple',
        requiresAuth: true,
        roles: ['admin', 'super_viewer'], // 关键：定义允许的角色
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
        roles: ['*'], // 允许所有用户访问
      },
    },
  ],
};
```

### 2. 权限检查逻辑
在权限钩子中实现角色匹配逻辑：

```typescript
// src/hooks/permission.ts
export default function usePermission() {
  const userStore = useUserStore();
  return {
    accessRouter(route: RouteLocationNormalized | RouteRecordRaw) {
      return (
        !route.meta?.requiresAuth ||           // 不需要认证
        !route.meta?.roles ||                  // 没有角色限制
        route.meta?.roles?.includes('*') ||    // 允许所有角色
        route.meta?.roles?.includes(userStore.role) // 当前用户角色匹配
      );
    },
    // ... 其他权限方法
  };
}
```

### 3. 菜单过滤机制
在菜单树生成时过滤无权限的菜单项：

```typescript
// src/components/menu/use-menu-tree.ts
const menuTree = computed(() => {
  const copyRouter = cloneDeep(appRoute.value) as RouteRecordNormalized[];

  function travel(_routes: RouteRecordRaw[], layer: number) {
    if (!_routes) return null;

    const collector: any = _routes.map((element) => {
      // 核心：权限检查，如果无权限则返回null（菜单项被过滤）
      if (!permission.accessRouter(element)) {
        return null;
      }

      // ... 其他菜单处理逻辑
    });
    return collector.filter(Boolean); // 过滤掉null项
  }
  return travel(copyRouter, 0);
});
```

### 4. 路由守卫保护
在路由守卫中进行最终的权限验证：

```typescript
// src/router/guard/permission.ts
export default function setupPermissionGuard(router: Router) {
  router.beforeEach(async (to, from, next) => {
    const userStore = useUserStore();
    const Permission = usePermission();
    const permissionsAllow = Permission.accessRouter(to);

    if (permissionsAllow) {
      next();
    } else {
      // 权限不足，重定向到有权限的页面
      const destination = Permission.findFirstPermissionRoute(appRoutes, userStore.role) || NOT_FOUND;
      next(destination);
    }
  });
}
```

## 角色定义
系统支持的角色类型：
- `admin`: 管理员
- `super_viewer`: 超级查看者
- `viewer`: 查看者
- `user`: 普通用户
- `*`: 所有用户（通配符）

## 实现步骤

### 步骤1: 配置路由权限
在路由定义中添加 `meta.roles`：

```typescript
{
  path: 'admin-only-page',
  name: 'AdminOnlyPage',
  component: () => import('@/views/admin-only-page/index.vue'),
  meta: {
    locale: 'menu.admin.only',
    requiresAuth: true,
    roles: ['admin'], // 只允许管理员访问
  },
}
```

### 步骤2: 确保权限钩子正确实现
权限钩子需要正确检查用户角色：

```typescript
// 确保 userStore.role 正确设置
const userStore = useUserStore();
console.log('当前用户角色:', userStore.role); // 应该输出如 'admin', 'user' 等
```

### 步骤3: 验证菜单过滤
检查菜单组件是否正确导入了权限钩子：

```typescript
// src/components/menu/use-menu-tree.ts
import usePermission from '@/hooks/permission'; // 确保正确导入
```

### 步骤4: 测试权限控制
1. 以不同角色用户登录
2. 检查菜单是否正确显示/隐藏
3. 尝试直接访问受限URL，确认重定向行为

## 最佳实践

### 1. 角色命名规范
- 使用小写英文单词
- 多个单词用下划线连接
- 保持一致性

### 2. 权限配置原则
- 遵循最小权限原则
- 敏感功能只分配给必要角色
- 使用 `*` 通配符时要谨慎

### 3. 错误处理
- 无权限访问时提供友好的提示
- 记录权限检查失败的日志
- 确保重定向到合适的页面

### 4. 性能优化
- 在菜单生成时进行权限过滤，避免运行时重复检查
- 缓存权限检查结果
- 合理使用通配符减少检查次数

## 常见问题

### Q: 菜单项不显示怎么办？
A: 检查以下几点：
1. 路由的 `meta.roles` 配置是否正确
2. 用户角色是否正确设置
3. 权限钩子的逻辑是否正确
4. 菜单组件是否正确导入了权限钩子

### Q: 直接访问URL没有重定向怎么办？
A: 检查路由守卫是否正确配置：
1. 确保 `setupPermissionGuard` 被调用
2. 检查 `Permission.accessRouter(to)` 的返回值
3. 确认重定向逻辑正确

### Q: 如何添加新角色？
A: 按以下步骤：
1. 在角色定义中添加新角色
2. 更新相关路由的 `meta.roles`
3. 测试权限控制是否正常工作

## 扩展功能

### 动态权限
如果需要支持动态权限（从服务器获取），可以扩展权限钩子：

```typescript
// 支持从服务器获取权限列表
const serverPermissions = ref([]);
const hasPermission = (permission: string) => {
  return serverPermissions.value.includes(permission);
};
```

### 页面级权限控制
在组件内部进行更细粒度的权限控制：

```vue
<template>
  <div>
    <!-- 只有管理员可见 -->
    <button v-if="userStore.role === 'admin'">
      管理员功能
    </button>

    <!-- 多个角色可见 -->
    <button v-if="['admin', 'super_viewer'].includes(userStore.role)">
      高级功能
    </button>
  </div>
</template>
```

## 总结
这种基于路由 `meta.roles` 的权限控制机制具有以下优势：
- 集中化配置：权限在路由层面统一管理
- 自动化过滤：菜单自动根据权限显示/隐藏
- 路由保护：防止直接URL访问
- 易于维护：角色和权限逻辑分离
- 可扩展性：支持动态权限和细粒度控制

这种实现方式已成为项目的标准权限控制模式，适用于所有需要角色权限控制的场景。