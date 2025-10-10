/**
 * 代码索引库搜索API
 * 提供HTTP API接口用于搜索代码
 */

const express = require('express');
const cors = require('cors');
const { codeIndexSystem } = require('./index');

const app = express();
const PORT = process.env.SEARCH_API_PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 搜索接口
app.get('/api/search', (req, res) => {
  try {
    const { q: query, type, tags, maxResults = 50 } = req.query;

    if (!query) {
      return res.status(400).json({
        error: '查询参数 q 是必需的',
        usage: '/api/search?q=关键词&type=javascript&maxResults=20'
      });
    }

    const options = {
      type: type || undefined,
      tags: tags ? tags.split(',') : undefined,
      maxResults: parseInt(maxResults)
    };

    const results = codeIndexSystem.search(query, options);

    res.json({
      success: true,
      query,
      options,
      results,
      total: results.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('搜索API错误:', error);
    res.status(500).json({
      error: '搜索失败',
      message: error.message
    });
  }
});

// 获取文件信息
app.get('/api/file/:path(*)', (req, res) => {
  try {
    const filePath = req.params.path;
    const fileInfo = codeIndexSystem.getFileInfo(filePath);

    if (!fileInfo) {
      return res.status(404).json({
        error: '文件未找到',
        path: filePath
      });
    }

    res.json({
      success: true,
      file: fileInfo
    });
  } catch (error) {
    console.error('获取文件信息错误:', error);
    res.status(500).json({
      error: '获取文件信息失败',
      message: error.message
    });
  }
});

// 获取标签列表
app.get('/api/tags', (req, res) => {
  try {
    const tags = Object.keys(codeIndexSystem.db.tags).sort();
    const tagStats = tags.map(tag => ({
      tag,
      count: codeIndexSystem.db.tags[tag].length
    }));

    res.json({
      success: true,
      tags: tagStats,
      total: tags.length
    });
  } catch (error) {
    console.error('获取标签列表错误:', error);
    res.status(500).json({
      error: '获取标签列表失败',
      message: error.message
    });
  }
});

// 获取文件类型统计
app.get('/api/stats', (req, res) => {
  try {
    const stats = codeIndexSystem.getStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('获取统计信息错误:', error);
    res.status(500).json({
      error: '获取统计信息失败',
      message: error.message
    });
  }
});

// 获取依赖关系
app.get('/api/dependencies/:path(*)', (req, res) => {
  try {
    const filePath = req.params.path;
    const dependencies = codeIndexSystem.getDependencies(filePath);

    res.json({
      success: true,
      file: filePath,
      dependencies,
      count: dependencies.length
    });
  } catch (error) {
    console.error('获取依赖关系错误:', error);
    res.status(500).json({
      error: '获取依赖关系失败',
      message: error.message
    });
  }
});

// 重新构建索引
app.post('/api/rebuild', async (req, res) => {
  try {
    await codeIndexSystem.buildIndex();
    res.json({
      success: true,
      message: '索引重建完成'
    });
  } catch (error) {
    console.error('重建索引错误:', error);
    res.status(500).json({
      error: '重建索引失败',
      message: error.message
    });
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'code-index-search-api',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 代码索引搜索API服务启动在端口 ${PORT}`);
  console.log(`📡 API文档: http://localhost:${PORT}/api/health`);
  console.log(`🔍 搜索接口: http://localhost:${PORT}/api/search?q=关键词`);
});

// 导出app实例（用于测试）
module.exports = app;