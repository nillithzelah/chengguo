<script lang="tsx">
  import { defineComponent, ref, h, compile, computed } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useRoute, useRouter, RouteRecordRaw } from 'vue-router';
  import type { RouteMeta } from 'vue-router';
  import { useAppStore } from '@/store';
  import { listenerRouteChange } from '@/utils/route-listener';
  import { openWindow, regexUrl } from '@/utils';
  import useMenuTree from './use-menu-tree';

  export default defineComponent({
    emit: ['collapse'],
    setup() {
      const { t } = useI18n();
      const appStore = useAppStore();
      const router = useRouter();
      const route = useRoute();
      const { menuTree } = useMenuTree();
      const collapsed = computed({
        get() {
          if (appStore.device === 'desktop') return appStore.menuCollapse;
          return false;
        },
        set(value: boolean) {
          appStore.updateSettings({ menuCollapse: value });
        },
      });

      const topMenu = computed(() => appStore.topMenu);
      const openKeys = ref<string[]>([]);
      const selectedKey = ref<string[]>([]);

      const goto = async (item: RouteRecordRaw) => {
        console.log('🔗 [菜单] goto函数被调用，目标页面:', item.name, '路径:', item.path);
        console.log('🔗 [菜单] 菜单项详情:', {
          name: item.name,
          path: item.path,
          meta: item.meta,
          component: item.component ? '组件存在' : '组件不存在',
          componentType: typeof item.component
        });

        // Open external link
        if (regexUrl.test(item.path)) {
          console.log('🔗 [菜单] 检测到外部链接，正在打开:', item.path);
          openWindow(item.path);
          selectedKey.value = [item.name as string];
          return;
        }

        // 路由跳转
        console.log('🔗 [菜单] 开始路由跳转:', { name: item.name, currentRoute: route.name });
        console.log('🔗 [菜单] 路由跳转前状态:', {
          currentName: route.name,
          currentPath: route.path,
          targetName: item.name
        });

        try {
          await router.push({
            name: item.name,
          });

          console.log('🔗 [菜单] 路由跳转成功');
          console.log('🔗 [菜单] 路由跳转后状态:', {
            name: route.name,
            path: route.path,
            fullPath: route.fullPath
          });

          // 等待一小段时间让组件加载
          setTimeout(() => {
            console.log('🔗 [菜单] 组件加载等待完成，检查页面状态');
          }, 100);

        } catch (error) {
          console.error('🔗 [菜单] 路由跳转失败:', error);
          console.error('🔗 [菜单] 错误详情:', {
            message: error.message,
            stack: error.stack
          });
        }
      };
      const findMenuOpenKeys = (target: string) => {
        const result: string[] = [];
        let isFind = false;
        const backtrack = (item: RouteRecordRaw, keys: string[]) => {
          if (item.name === target) {
            isFind = true;
            result.push(...keys);
            return;
          }
          if (item.children?.length) {
            item.children.forEach((el) => {
              backtrack(el, [...keys, el.name as string]);
            });
          }
        };
        menuTree.value.forEach((el: RouteRecordRaw) => {
          if (isFind) return; // Performance optimization
          backtrack(el, [el.name as string]);
        });
        return result;
      };
      listenerRouteChange((newRoute) => {
        const { requiresAuth, activeMenu, hideInMenu } = newRoute.meta;
        if (requiresAuth && (!hideInMenu || activeMenu)) {
          const menuOpenKeys = findMenuOpenKeys(
            (activeMenu || newRoute.name) as string
          );

          const keySet = new Set([...menuOpenKeys, ...openKeys.value]);
          openKeys.value = [...keySet];

          selectedKey.value = [
            activeMenu || menuOpenKeys[menuOpenKeys.length - 1],
          ];
        }
      }, true);
      const setCollapse = (val: boolean) => {
        if (appStore.device === 'desktop')
          appStore.updateSettings({ menuCollapse: val });
      };

      const renderSubMenu = () => {
        function travel(_route: RouteRecordRaw[], nodes = []) {
          if (_route) {
            _route.forEach((element) => {
              // This is demo, modify nodes as needed
              const icon = element?.meta?.icon
                ? () => h(compile(`<${element?.meta?.icon}/>`))
                : null;
              const node =
                element?.children && element?.children.length !== 0 ? (
                  <a-sub-menu
                    key={element?.name}
                    v-slots={{
                      icon,
                      title: () => h(compile(t(element?.meta?.locale || ''))),
                    }}
                  >
                    {travel(element?.children)}
                  </a-sub-menu>
                ) : (
                  <a-menu-item
                    key={element?.name}
                    v-slots={{ icon }}
                    onClick={() => {
                      console.log('🖱️ [菜单] 菜单项被点击:', element?.name);
                      console.log('🖱️ [菜单] 菜单项完整信息:', {
                        name: element?.name,
                        path: element?.path,
                        meta: element?.meta,
                        hasChildren: element?.children?.length > 0,
                        component: element?.component ? '有组件' : '无组件'
                      });
                      goto(element);
                    }}
                  >
                    {t(element?.meta?.locale || '')}
                  </a-menu-item>
                );
              nodes.push(node as never);
            });
          }
          return nodes;
        }
        return travel(menuTree.value);
      };

      return () => (
        <a-menu
          mode={topMenu.value ? 'horizontal' : 'vertical'}
          v-model:collapsed={collapsed.value}
          v-model:open-keys={openKeys.value}
          show-collapse-button={appStore.device !== 'mobile'}
          auto-open={false}
          selected-keys={selectedKey.value}
          auto-open-selected={true}
          level-indent={34}
          style="height: 100%;width:100%;"
          onCollapse={setCollapse}
        >
          {renderSubMenu()}
        </a-menu>
      );
    },
  });
</script>

<style lang="less" scoped>
  :deep(.arco-menu-inner) {
    .arco-menu-inline-header {
      display: flex;
      align-items: center;
    }
    .arco-icon {
      &:not(.arco-icon-down) {
        font-size: 18px;
      }
    }
  }
</style>
