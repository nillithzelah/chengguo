import { mergeConfig } from 'vite';
import baseConfig from './vite.config.base';
import configCompressPlugin from './plugin/compress';
import configVisualizerPlugin from './plugin/visualizer';
import configArcoResolverPlugin from './plugin/arcoResolver';
import configImageminPlugin from './plugin/imagemin';

export default mergeConfig(
  {
    mode: 'production',
    plugins: [
      configCompressPlugin('gzip'),
      configVisualizerPlugin(),
      // configArcoResolverPlugin(), // 临时禁用Arco按需引入，避免循环依赖
      // configImageminPlugin(), // 禁用以避免服务器GUI错误
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks: undefined, // 禁用手动分块，使用默认分块策略
        },
      },
      chunkSizeWarningLimit: 2000,
    },
  },
  baseConfig
);
