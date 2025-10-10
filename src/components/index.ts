import { App } from 'vue';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart, LineChart, PieChart, RadarChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  GraphicComponent,
} from 'echarts/components';

// 手动引入 ECharts 模块以减少打包体积
use([
  CanvasRenderer,
  BarChart,
  LineChart,
  PieChart,
  RadarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  GraphicComponent,
]);

// 自动注册组件
const componentModules = import.meta.glob('./**/index.vue', { eager: true });

export default {
  install(Vue: App) {
    // 自动注册所有组件
    Object.entries(componentModules).forEach(([path, componentModule]) => {
      try {
        const componentName = path
          .split('/')
          .pop()
          ?.replace('.vue', '') || 'Unknown';

        // 类型断言确保componentModule是正确的类型
        const module = componentModule as { default: any };
        if (module.default) {
          Vue.component(componentName, module.default);
        }
      } catch (error) {
        console.warn(`Failed to register component from ${path}:`, error);
      }
    });
  },
};
