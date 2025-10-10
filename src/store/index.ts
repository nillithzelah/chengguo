import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import useAppStore from './modules/app';
import useUserStore from './modules/user';
import useTabBarStore from './modules/tab-bar';

const pinia = createPinia();

// 添加持久化插件
pinia.use(piniaPluginPersistedstate);

export { useAppStore, useUserStore, useTabBarStore };
export default pinia;
