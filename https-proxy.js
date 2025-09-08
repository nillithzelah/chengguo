#!/usr/bin/env node

const https = require('https');
const http = require('http');
const { createProxyMiddleware } = require('http-proxy-middleware');
const express = require('express');

async function startHttpsProxy() {
  const app = express();
  
  // 配置代理中间件
  const proxy = createProxyMiddleware({
    target: 'http://localhost:5173',
    changeOrigin: true,
    ws: true,
    logLevel: 'info',
    onProxyReq: (proxyReq, req, res) => {
      console.log('🔄 代理请求:', req.method, req.url);
    },
    onError: (err, req, res) => {
      console.error('❌ 代理错误:', err.message);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('代理服务器错误: ' + err.message);
      }
    },
  });

  app.use('/', proxy);

  // 使用简单的HTTPS配置，让Node.js自动生成证书
  const server = https.createServer(app);

  server.listen(8443, () => {
    console.log('\n🔒 HTTPS代理服务器已启动!');
    console.log('📡 代理端口: 8443 (HTTPS)');
    console.log('🎯 目标服务器: http://localhost:5173');
    console.log('\n✅ 可以使用以下地址访问:');
    console.log('   🌐 主页: https://localhost:8443/');
    console.log('   🔗 Webhook: https://localhost:8443/api/douyin/webhook');
    console.log('\n📋 抖音开放平台配置:');
    console.log('   URL: https://localhost:8443/api/douyin/webhook');
    console.log('   Token: douyingameads2024');
    console.log('\n💡 注意: 浏览器会显示SSL警告，请选择"继续访问"');
    console.log('=========================================\n');
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error('❌ 端口8443已被占用，请先关闭其他服务');
    } else {
      console.error('❌ HTTPS代理服务器启动失败:', err.message);
      console.log('💡 尝试使用备用端口8444...');
      
      // 尝试备用端口
      const backupServer = https.createServer(app);
      backupServer.listen(8444, () => {
        console.log('\n🔒 HTTPS代理服务器已在备用端口启动!');
        console.log('📡 代理端口: 8444 (HTTPS)');
        console.log('🎯 目标服务器: http://localhost:5173');
        console.log('\n✅ 请使用以下地址:');
        console.log('   🌐 主页: https://localhost:8444/');
        console.log('   🔗 Webhook: https://localhost:8444/api/douyin/webhook');
      });
    }
  });

  // 优雅关闭
  process.on('SIGINT', () => {
    console.log('\n📴 正在关闭HTTPS代理服务器...');
    server.close(() => {
      console.log('✅ HTTPS代理服务器已关闭');
      process.exit(0);
    });
  });
}

// 检查HTTP服务器是否运行
function checkHttpServer() {
  return new Promise((resolve) => {
    const req = http.request('http://localhost:5173', (res) => {
      resolve(true);
    });
    
    req.on('error', () => resolve(false));
    req.setTimeout(3000, () => {
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
}

async function main() {
  console.log('🔍 检查HTTP开发服务器状态...');
  
  const isHttpRunning = await checkHttpServer();
  
  if (!isHttpRunning) {
    console.log('⚠️  HTTP开发服务器未运行');
    console.log('💡 请先运行: npm run dev');
    console.log('🔄 然后再启动此HTTPS代理');
    process.exit(1);
  }
  
  console.log('✅ HTTP开发服务器运行正常');
  console.log('🚀 启动HTTPS代理服务器...\n');
  
  await startHttpsProxy();
}

if (require.main === module) {
  main().catch(console.error);
}