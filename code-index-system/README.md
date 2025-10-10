# 代码索引库系统

## 📋 概述

代码索引库系统是一个强大的代码搜索和索引工具，专为现代前端项目设计。它能够：

- 🔍 **智能搜索** - 在项目中快速搜索函数、类、变量等
- 🏷️ **标签分类** - 自动为文件生成标签便于分类管理
- 📊 **依赖分析** - 分析文件之间的依赖关系
- ⚡ **高性能** - 支持虚拟滚动和大数据量处理
- 🎯 **精准定位** - 提供文件路径、行号等详细信息

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 构建索引

```bash
# 构建代码索引库
node code-index-system/index.js build
```

### 启动搜索API服务

```bash
# 启动搜索API服务（端口3001）
node code-index-system/search-api.js
```

### 搜索代码

```bash
# 搜索关键词
node code-index-system/index.js search "function"

# 搜索指定类型的文件
node code-index-system/index.js search "export" --type=typescript

# 查看统计信息
node code-index-system/index.js stats
```

## 📡 API 接口

### 搜索接口

```http
GET /api/search?q=关键词&type=javascript&maxResults=20
```

**参数：**
- `q` (必需): 搜索关键词
- `type` (可选): 文件类型过滤
- `tags` (可选): 标签过滤，多个标签用逗号分隔
- `maxResults` (可选): 最大结果数量，默认50

**示例：**
```bash
curl "http://localhost:3001/api/search?q=vue&type=typescript&maxResults=10"
```

### 文件信息接口

```http
GET /api/file/:path
```

**示例：**
```bash
curl "http://localhost:3001/api/file/src/main.ts"
```

### 标签列表接口

```http
GET /api/tags
```

### 统计信息接口

```http
GET /api/stats
```

### 依赖关系接口

```http
GET /api/dependencies/:path
```

## 🛠️ 系统架构

### 核心组件

```
code-index-system/
├── index.ts              # 主索引系统
├── search-api.js         # HTTP搜索API
├── code-index-db.json    # 索引数据库
└── search-cache.json     # 搜索缓存
```

### 数据结构

#### FileIndex（文件索引）
```typescript
interface FileIndex {
  path: string;           // 完整文件路径
  relativePath: string;   // 相对路径
  name: string;           // 文件名
  extension: string;      // 扩展名
  size: number;           // 文件大小
  lastModified: number;   // 最后修改时间
  type: string;           // 文件类型
  content: string;        // 文件内容
  lines: number;          // 行数
  functions: string[];    // 函数列表
  classes: string[];      // 类列表
  imports: string[];      // 导入列表
  exports: string[];      // 导出列表
  keywords: string[];     // 关键词列表
  tags: string[];         // 标签列表
  hash: string;           // 文件哈希
}
```

#### SearchResult（搜索结果）
```typescript
interface SearchResult {
  file: string;           // 文件路径
  line: number;           // 行号
  content: string;        // 内容
  type: string;           // 结果类型
  relevance: number;      // 相关性评分
}
```

## 🔧 配置说明

### 环境变量

```bash
# 搜索API端口
SEARCH_API_PORT=3001

# 日志级别
LOG_LEVEL=info

# 索引数据库路径
INDEX_DB_PATH=./code-index-db.json
```

### 文件类型配置

系统支持以下文件类型：

| 类型 | 扩展名 | 功能 |
|------|--------|------|
| JavaScript | `.js`, `.mjs`, `.jsx` | JS/JSX文件 |
| TypeScript | `.ts`, `.tsx` | TS/TSX文件 |
| Vue | `.vue` | Vue单文件组件 |
| CSS | `.css`, `.less`, `.scss` | 样式文件 |
| JSON | `.json` | 配置文件 |
| Markdown | `.md` | 文档文件 |

## 🎯 使用场景

### 1. 代码搜索
```bash
# 搜索函数定义
node code-index-system/index.js search "function"

# 搜索组件
node code-index-system/index.js search "component"

# 搜索API调用
node code-index-system/index.js search "axios"
```

### 2. 依赖分析
```bash
# 查看文件依赖关系
node code-index-system/index.js search "import" --type=typescript
```

### 3. 标签分类
```bash
# 查看特定标签的文件
node code-index-system/index.js search "component" --tags=vue
```

### 4. 代码统计
```bash
# 查看项目统计
node code-index-system/index.js stats
```

## 📊 性能特性

### 搜索性能
- **毫秒级响应** - 优化后的搜索算法
- **智能缓存** - 搜索结果缓存机制
- **相关性排序** - 按匹配度排序结果

### 索引性能
- **增量更新** - 只索引变更的文件
- **内存优化** - 高效的内存使用
- **并发处理** - 支持并发文件处理

### 存储优化
- **压缩存储** - 索引数据压缩存储
- **版本控制** - 支持索引版本管理
- **备份恢复** - 自动备份索引数据

## 🔍 高级功能

### 1. 模糊搜索
```bash
# 模糊搜索函数名
node code-index-system/index.js search "func*"
```

### 2. 正则表达式搜索
```bash
# 使用正则表达式
node code-index-system/index.js search "export.*function"
```

### 3. 多条件筛选
```bash
# 按类型和标签筛选
node code-index-system/index.js search "component" --type=vue --tags=typescript
```

### 4. 依赖关系分析
```bash
# 查看文件依赖链
node code-index-system/index.js search "import" --file=src/main.ts
```

## 🛡️ 最佳实践

### 索引维护
1. **定期重建索引** - 建议每周重建一次
2. **监控索引大小** - 防止索引文件过大
3. **备份重要索引** - 定期备份索引数据库

### 搜索优化
1. **使用具体关键词** - 避免过于宽泛的搜索
2. **利用标签过滤** - 使用标签缩小搜索范围
3. **合理设置结果数量** - 根据需要调整maxResults

### 性能调优
1. **调整缓存大小** - 根据内存情况调整缓存
2. **优化搜索频率** - 避免高频重复搜索
3. **监控API性能** - 关注搜索API响应时间

## 🚨 故障排除

### 常见问题

#### 1. 索引构建失败
```bash
# 检查文件权限
ls -la code-index-system/

# 检查磁盘空间
df -h

# 查看错误日志
node code-index-system/index.js build 2>&1 | tee build.log
```

#### 2. 搜索无结果
```bash
# 检查索引是否构建
node code-index-system/index.js stats

# 重新构建索引
node code-index-system/index.js build

# 检查搜索语法
node code-index-system/index.js search "test" --maxResults=5
```

#### 3. API服务启动失败
```bash
# 检查端口占用
netstat -tlnp | grep 3001

# 更换端口
SEARCH_API_PORT=3002 node code-index-system/search-api.js
```

## 📈 扩展开发

### 添加新的文件类型

```typescript
// 在 FILE_TYPES 中添加新类型
const FILE_TYPES = {
  // ... 现有类型
  python: {
    extensions: ['.py', '.pyx'],
    commentPatterns: [/#.*$/gm],
    stringPatterns: [/(["'])((?:\\.|(?!\1)[^\\])*?)\1/g, /"""[\s\S]*?"""/g],
    keywords: ['def', 'class', 'import', 'from', 'async', 'await']
  }
};
```

### 自定义搜索算法

```typescript
// 扩展搜索功能
class CustomSearchEngine extends CodeIndexSystem {
  advancedSearch(query: string, options: AdvancedSearchOptions) {
    // 实现高级搜索逻辑
  }
}
```

## 🤝 贡献指南

### 开发环境设置
```bash
# 克隆项目
git clone <repository-url>
cd code-index-system

# 安装依赖
npm install

# 运行测试
npm test

# 构建项目
npm run build
```

### 代码规范
- 使用 TypeScript 进行类型检查
- 遵循 ESLint 代码规范
- 编写单元测试
- 更新文档

## 📄 许可证

MIT License - 详见 LICENSE 文件

## 🆘 支持

如有问题或建议，请：

1. 查阅本文档
2. 搜索现有Issues
3. 提交新的Issue
4. 联系维护团队

---

*文档最后更新：2025年10月10日*
*版本：v1.0.0*