import { mergeConfig } from 'vite';
// import eslint from 'vite-plugin-eslint';
import baseConfig from './vite.config.base';
import { proxyConfig } from './proxy';

export default mergeConfig(
  {
    mode: 'development',
    server: {
      host: '0.0.0.0', // 允许外部访问
      port: 5173,
      strictPort: true, // 强制使用指定端口，不自动切换
      open: false,
      fs: {
        strict: true,
      },
      proxy: proxyConfig,
    },
    plugins: [
      // eslint({
      //   cache: false,
      //   include: ['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.vue'],
      //   exclude: ['node_modules'],
      // }),
    ],
  },
  baseConfig
);
