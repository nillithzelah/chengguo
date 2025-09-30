import { defineConfig } from 'vite';

export const proxyConfig = {
  // 用户相关API代理
  '/api/user': {
    target: 'http://localhost:3000',
    changeOrigin: true,
    secure: false,
    rewrite: (path: string) => {
      return path;
    },
    configure: (proxy: any) => {
      proxy.on('error', (err: any, req: any, res: any) => {
        console.error('用户API代理错误:', err);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
        }
        res.end(JSON.stringify({ code: 500, message: '用户服务连接失败' }));
      });

      proxy.on('proxyReq', (proxyReq: any) => {
        console.log('🔄 代理用户API请求:', proxyReq.method, proxyReq.path);
      });

      proxy.on('proxyRes', (proxyRes: any, req: any) => {
        console.log('✅ 代理用户API响应:', proxyRes.statusCode, req.url);
      });
    },
  },

  // 抖音webhook API代理
  '/api/douyin/webhook': {
    target: 'http://localhost:3000',
    changeOrigin: true,
    secure: false,
    rewrite: (path: string) => {
      return path;
    },
    configure: (proxy: any) => {
      proxy.on('error', (err: any, req: any, res: any) => {
        console.error('webhook API代理错误:', err);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
        }
        res.end(JSON.stringify({ code: 500, message: 'webhook服务连接失败' }));
      });

      proxy.on('proxyReq', (proxyReq: any) => {
        console.log('🔄 代理webhook API请求:', proxyReq.method, proxyReq.path);
      });

      proxy.on('proxyRes', (proxyRes: any, req: any) => {
        console.log('✅ 代理webhook API响应:', proxyRes.statusCode, req.url);
      });
    },
  },

  // 抖音广告数据API代理
  '/api/douyin/ads': {
    target: 'http://localhost:3000',
    changeOrigin: true,
    secure: false,
    rewrite: (path: string) => {
      return path;
    },
    configure: (proxy: any) => {
      proxy.on('error', (err: any, req: any, res: any) => {
        console.error('广告数据API代理错误:', err);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
        }
        res.end(JSON.stringify({ code: 500, message: '广告数据服务连接失败' }));
      });

      proxy.on('proxyReq', (proxyReq: any) => {
        console.log('🔄 代理广告数据API请求:', proxyReq.method, proxyReq.path);
      });

      proxy.on('proxyRes', (proxyRes: any, req: any) => {
        console.log('✅ 代理广告数据API响应:', proxyRes.statusCode, req.url);
      });
    },
  },

  // 健康检查API代理
  '/api/health': {
    target: 'http://localhost:3000',
    changeOrigin: true,
    secure: false,
    rewrite: (path: string) => {
      return path;
    },
    configure: (proxy: any) => {
      proxy.on('error', (err: any, req: any, res: any) => {
        console.error('健康检查API代理错误:', err);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
        }
        res.end(JSON.stringify({ code: 500, message: '健康检查服务连接失败' }));
      });

      proxy.on('proxyReq', (proxyReq: any) => {
        console.log('🔄 代理健康检查API请求:', proxyReq.method, proxyReq.path);
      });

      proxy.on('proxyRes', (proxyRes: any, req: any) => {
        console.log('✅ 代理健康检查API响应:', proxyRes.statusCode, req.url);
      });
    },
  },

  // 游戏管理API代理
  '/api/game': {
    target: 'http://localhost:3000',
    changeOrigin: true,
    secure: false,
    rewrite: (path: string) => {
      return path;
    },
    configure: (proxy: any) => {
      proxy.on('error', (err: any, req: any, res: any) => {
        console.error('游戏管理API代理错误:', err);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
        }
        res.end(JSON.stringify({ code: 500, message: '游戏管理服务连接失败' }));
      });

      proxy.on('proxyReq', (proxyReq: any) => {
        console.log('🔄 代理游戏管理API请求:', proxyReq.method, proxyReq.path);
      });

      proxy.on('proxyRes', (proxyRes: any, req: any) => {
        console.log('✅ 代理游戏管理API响应:', proxyRes.statusCode, req.url);
      });
    },
  },

  // 抖音认证API代理（需要后端处理）
  '/api/douyin/token': {
    target: 'http://localhost:3000',
    changeOrigin: true,
    secure: false,
    rewrite: (path: string) => {
      return path;
    },
    configure: (proxy: any) => {
      proxy.on('error', (err: any, req: any, res: any) => {
        console.error('抖音认证API代理错误:', err);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
        }
        res.end(JSON.stringify({ code: 500, message: '认证服务器连接失败' }));
      });

      proxy.on('proxyReq', (proxyReq: any) => {
        console.log('🔄 代理认证API请求:', proxyReq.method, proxyReq.path);
      });

      proxy.on('proxyRes', (proxyRes: any, req: any) => {
        console.log('✅ 代理认证API响应:', proxyRes.statusCode, req.url);
      });
    },
  },

  // 抖音连接测试API代理
  '/api/douyin/test-connection': {
    target: 'http://localhost:3000',
    changeOrigin: true,
    secure: false,
    rewrite: (path: string) => {
      return path;
    },
    configure: (proxy: any) => {
      proxy.on('error', (err: any, req: any, res: any) => {
        console.error('连接测试API代理错误:', err);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
        }
        res.end(JSON.stringify({ code: 500, message: '连接测试服务连接失败' }));
      });

      proxy.on('proxyReq', (proxyReq: any) => {
        console.log('🔄 代理连接测试API请求:', proxyReq.method, proxyReq.path);
      });

      proxy.on('proxyRes', (proxyRes: any, req: any) => {
        console.log('✅ 代理连接测试API响应:', proxyRes.statusCode, req.url);
      });
    },
  },



  // 广告预览二维码API代理
  '/api/douyin/ad-preview-qrcode': {
    target: 'http://localhost:3000',
    changeOrigin: true,
    secure: false,
    rewrite: (path: string) => {
      return path;
    },
    configure: (proxy: any) => {
      proxy.on('error', (err: any, req: any, res: any) => {
        console.error('广告预览二维码API代理错误:', err);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
        }
        res.end(JSON.stringify({ code: 500, message: '广告预览二维码服务连接失败' }));
      });

      proxy.on('proxyReq', (proxyReq: any) => {
        console.log('🔄 代理广告预览二维码API请求:', proxyReq.method, proxyReq.path);
      });

      proxy.on('proxyRes', (proxyRes: any, req: any) => {
        console.log('✅ 代理广告预览二维码API响应:', proxyRes.statusCode, req.url);
      });
    },
  },

  // eCPM数据API代理到后端服务器（使用后端处理逻辑）
  '/api/douyin/ecpm': {
    target: 'http://localhost:3000',
    changeOrigin: true,
    secure: false,
    rewrite: (path: string) => {
      return path;
    },
    configure: (proxy: any) => {
      proxy.on('error', (err: any, req: any, res: any) => {
        console.error('eCPM API代理错误:', err);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
        }
        res.end(JSON.stringify({ code: 500, message: 'eCPM服务连接失败' }));
      });

      proxy.on('proxyReq', (proxyReq: any) => {
        console.log('🔄 代理eCPM API请求:', proxyReq.method, proxyReq.path);
      });

      proxy.on('proxyRes', (proxyRes: any, req: any) => {
        console.log('✅ 代理eCPM API响应:', proxyRes.statusCode, req.url);
      });
    },
  },

  // 广告报告API代理
  '/api/douyin/ad-report': {
    target: 'http://localhost:3000',
    changeOrigin: true,
    secure: false,
    rewrite: (path: string) => {
      return path;
    },
    configure: (proxy: any) => {
      proxy.on('error', (err: any, req: any, res: any) => {
        console.error('广告报告API代理错误:', err);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
        }
        res.end(JSON.stringify({ code: 500, message: '广告报告服务连接失败' }));
      });

      proxy.on('proxyReq', (proxyReq: any) => {
        console.log('🔄 代理广告报告API请求:', proxyReq.method, proxyReq.path);
      });

      proxy.on('proxyRes', (proxyRes: any, req: any) => {
        console.log('✅ 代理广告报告API响应:', proxyRes.statusCode, req.url);
      });
    },
  },

  // 二维码扫描API代理
  '/api/qr-scan': {
    target: 'http://localhost:3000',
    changeOrigin: true,
    secure: false,
    rewrite: (path: string) => {
      return path;
    },
    configure: (proxy: any) => {
      proxy.on('error', (err: any, req: any, res: any) => {
        console.error('二维码扫描API代理错误:', err);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
        }
        res.end(JSON.stringify({ code: 500, message: '二维码扫描服务连接失败' }));
      });

      proxy.on('proxyReq', (proxyReq: any) => {
        console.log('🔄 代理二维码扫描API请求:', proxyReq.method, proxyReq.path);
      });

      proxy.on('proxyRes', (proxyRes: any, req: any) => {
        console.log('✅ 代理二维码扫描API响应:', proxyRes.statusCode, req.url);
      });
    },
  },

  // 通用API代理（用于解决前端跨域问题）
  '/api/douyin/proxy': {
    target: 'http://localhost:3000',
    changeOrigin: true,
    secure: false,
    rewrite: (path: string) => {
      return path;
    },
    configure: (proxy: any) => {
      proxy.on('error', (err: any, req: any, res: any) => {
        console.error('通用API代理错误:', err);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
        }
        res.end(JSON.stringify({ code: 500, message: '通用API代理服务连接失败' }));
      });

      proxy.on('proxyReq', (proxyReq: any) => {
        console.log('🔄 代理通用API请求:', proxyReq.method, proxyReq.path);
      });

      proxy.on('proxyRes', (proxyRes: any, req: any) => {
        console.log('✅ 代理通用API响应:', proxyRes.statusCode, req.url);
      });
    },
  },

  // 流量主金额管理API代理
  '/api/traffic-master': {
    target: 'http://localhost:3000',
    changeOrigin: true,
    secure: false,
    rewrite: (path: string) => {
      return path;
    },
    configure: (proxy: any) => {
      proxy.on('error', (err: any, req: any, res: any) => {
        console.error('流量主API代理错误:', err);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
        }
        res.end(JSON.stringify({ code: 500, message: '流量主服务连接失败' }));
      });

      proxy.on('proxyReq', (proxyReq: any) => {
        console.log('🔄 代理流量主API请求:', proxyReq.method, proxyReq.path);
      });

      proxy.on('proxyRes', (proxyRes: any, req: any) => {
        console.log('✅ 代理流量主API响应:', proxyRes.statusCode, req.url);
      });
    },
  },
};