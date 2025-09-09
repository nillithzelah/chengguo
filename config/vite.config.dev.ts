import { mergeConfig } from 'vite';
// import eslint from 'vite-plugin-eslint';
import baseConfig from './vite.config.base';
import { proxyConfig } from './proxy';

export default mergeConfig(
  {
    mode: 'development',
    server: {
      // 暂时使用HTTP模式，避免SSL协议兼容性问题
      // https: {
      //   // 使用更兼容的SSL配置
      //   rejectUnauthorized: false,
      //   // 支持更多的SSL协议版本
      //   secureProtocol: 'TLSv1_2_method',
      //   // 允许低级别加密套件（仅开发环境）
      //   ciphers: 'ECDHE+AESGCM:ECDHE+CHACHA20:DHE+AESGCM:DHE+CHACHA20:!aNULL:!MD5:!DSS',
      // },
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
