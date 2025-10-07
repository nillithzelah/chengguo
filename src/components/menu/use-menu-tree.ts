import { computed } from 'vue';
import { RouteRecordRaw, RouteRecordNormalized } from 'vue-router';
import usePermission from '@/hooks/permission';
import { useAppStore } from '@/store';
import appClientMenus from '@/router/app-menus';
import { cloneDeep } from 'lodash';

export default function useMenuTree() {
  const permission = usePermission();
  const appStore = useAppStore();
  const appRoute = computed(() => {
    if (appStore.menuFromServer) {
      return appStore.appAsyncMenus;
    }
    return appClientMenus;
  });
  const menuTree = computed(() => {
    const copyRouter = cloneDeep(appRoute.value) as RouteRecordNormalized[];
    copyRouter.sort((a: RouteRecordNormalized, b: RouteRecordNormalized) => {
      return (a.meta.order || 0) - (b.meta.order || 0);
    });
    function travel(_routes: RouteRecordRaw[], layer: number) {
      if (!_routes) return null;

      const collector: any = _routes.map((element) => {
        console.log('🔍 Processing menu item:', element.name, 'layer:', layer, 'path:', element.path);
        // no access
        if (!permission.accessRouter(element)) {
          console.log('❌ No access to:', element.name);
          return null;
        }

        // leaf node - but still check hideInMenu
        if (element.meta?.hideChildrenInMenu || !element.children) {
          element.children = [];
          // Check hideInMenu even for leaf nodes
          if (element.meta?.hideInMenu !== true) {
            console.log('✅ Leaf node added:', element.name);
            return element;
          }
          return null;
        }

        // route filter hideInMenu true
        element.children = element.children.filter(
          (x) => x.meta?.hideInMenu !== true
        );

        console.log('🔄 Processing children for:', element.name, 'children count:', element.children.length);

        // Associated child node
        const subItem = travel(element.children, layer + 1);

        if (subItem.length) {
          element.children = subItem;
          console.log('✅ Parent node added with children:', element.name, 'children:', subItem.map(c => c.name));
          return element;
        }
        // the else logic
        if (layer > 1) {
          element.children = subItem;
          return element;
        }

        // Hide menu item only if hideInMenu is explicitly set to true
        if (element.meta?.hideInMenu !== true) {
          return element;
        }

        return null;
      });
      const result = collector.filter(Boolean);
      console.log('📋 Menu tree result for layer', layer, ':', result.map(r => ({ name: r.name, children: r.children?.map(c => c.name) })));
      return result;
    }
    const result = travel(copyRouter, 0);
    console.log('🎯 Final menu tree:', result);
    return result;
  });

  return {
    menuTree,
  };
}
