/**
 * 代码索引库系统 - 主入口文件
 * 用于扫描、索引和搜索项目中的代码文件
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 索引数据库文件路径
const INDEX_DB_PATH = path.join(__dirname, 'code-index-db.json');
const SEARCH_CACHE_PATH = path.join(__dirname, 'search-cache.json');

// 文件类型配置
const FILE_TYPES = {
  javascript: {
    extensions: ['.js', '.mjs', '.jsx'],
    commentPatterns: [/\/\/.*$/gm, /\/\*[\s\S]*?\*\//g],
    stringPatterns: [/(["'])((?:\\.|(?!\1)[^\\])*?)\1/g],
    keywords: ['function', 'class', 'const', 'let', 'var', 'export', 'import', 'async', 'await']
  },
  typescript: {
    extensions: ['.ts', '.tsx'],
    commentPatterns: [/\/\/.*$/gm, /\/\*[\s\S]*?\*\//g],
    stringPatterns: [/(["'])((?:\\.|(?!\1)[^\\])*?)\1/g, /`[\s\S]*?`/g],
    keywords: ['interface', 'type', 'enum', 'namespace', 'declare', 'public', 'private', 'protected']
  },
  vue: {
    extensions: ['.vue'],
    commentPatterns: [/\/\/.*$/gm, /\/\*[\s\S]*?\*\//g],
    stringPatterns: [/(["'])((?:\\.|(?!\1)[^\\])*?)\1/g, /`[\s\S]*?`/g],
    keywords: ['template', 'script', 'style', 'setup', 'computed', 'watch', 'props', 'emits']
  },
  css: {
    extensions: ['.css', '.less', '.scss', '.sass'],
    commentPatterns: [/\/\*[\s\S]*?\*\//g],
    stringPatterns: [/(["'])((?:\\.|(?!\1)[^\\])*?)\1/g],
    keywords: ['@media', '@import', '@keyframes', 'animation', 'transition', 'transform']
  },
  json: {
    extensions: ['.json'],
    commentPatterns: [],
    stringPatterns: [/("(?:[^"\\]|\\.)*")/g],
    keywords: ['name', 'version', 'dependencies', 'scripts', 'config']
  },
  markdown: {
    extensions: ['.md'],
    commentPatterns: [],
    stringPatterns: [],
    keywords: ['#', '##', '###', '####', '#####', '######', '-', '*', '1.', '```']
  }
};

// 索引数据结构
interface FileIndex {
  path: string;
  relativePath: string;
  name: string;
  extension: string;
  size: number;
  lastModified: number;
  type: string;
  content: string;
  lines: number;
  functions: string[];
  classes: string[];
  imports: string[];
  exports: string[];
  keywords: string[];
  tags: string[];
  hash: string;
}

interface SearchResult {
  file: string;
  line: number;
  content: string;
  type: string;
  relevance: number;
}

interface IndexDatabase {
  files: { [key: string]: FileIndex };
  tags: { [key: string]: string[] };
  dependencies: { [key: string]: string[] };
  lastUpdated: number;
  totalFiles: number;
  totalSize: number;
}

class CodeIndexSystem {
  private db: IndexDatabase;
  private searchCache: Map<string, SearchResult[]>;

  constructor() {
    this.db = this.loadDatabase();
    this.searchCache = new Map();
  }

  /**
   * 加载索引数据库
   */
  private loadDatabase(): IndexDatabase {
    try {
      if (fs.existsSync(INDEX_DB_PATH)) {
        const data = fs.readFileSync(INDEX_DB_PATH, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('加载索引数据库失败:', error);
    }

    return {
      files: {},
      tags: {},
      dependencies: {},
      lastUpdated: 0,
      totalFiles: 0,
      totalSize: 0
    };
  }

  /**
   * 保存索引数据库
   */
  private saveDatabase(): void {
    try {
      fs.writeFileSync(INDEX_DB_PATH, JSON.stringify(this.db, null, 2));
      console.log('索引数据库已保存');
    } catch (error) {
      console.error('保存索引数据库失败:', error);
    }
  }

  /**
   * 获取文件类型
   */
  private getFileType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();

    for (const [type, config] of Object.entries(FILE_TYPES)) {
      if (config.extensions.includes(ext)) {
        return type;
      }
    }

    return 'unknown';
  }

  /**
   * 提取函数和类名
   */
  private extractFunctionsAndClasses(content: string, fileType: string): { functions: string[], classes: string[] } {
    const functions: string[] = [];
    const classes: string[] = [];

    if (fileType === 'javascript' || fileType === 'typescript' || fileType === 'vue') {
      // 提取函数定义
      const functionPatterns = [
        /function\s+(\w+)\s*\(/g,
        /const\s+(\w+)\s*=\s*(?:\([^)]*\)|[^=]*)\s*=>/g,
        /(\w+)\s*\([^)]*\)\s*{/g
      ];

      functionPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          if (match[1] && !['if', 'for', 'while', 'catch'].includes(match[1])) {
            functions.push(match[1]);
          }
        }
      });

      // 提取类定义
      const classPattern = /class\s+(\w+)/g;
      let match;
      while ((match = classPattern.exec(content)) !== null) {
        classes.push(match[1]);
      }
    }

    return { functions, classes };
  }

  /**
   * 提取导入和导出
   */
  private extractImportsAndExports(content: string, fileType: string): { imports: string[], exports: string[] } {
    const imports: string[] = [];
    const exports: string[] = [];

    if (fileType === 'javascript' || fileType === 'typescript' || fileType === 'vue') {
      // 提取import语句
      const importPatterns = [
        /import\s+.*?\s+from\s+['"](.+?)['"]/g,
        /import\s*\(\s*['"](.+?)['"]/g,
        /require\s*\(\s*['"](.+?)['"]/g
      ];

      importPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          if (match[1]) {
            imports.push(match[1]);
          }
        }
      });

      // 提取export语句
      const exportPatterns = [
        /export\s+(?:const|let|var|function|class)\s+(\w+)/g,
        /export\s+{\s*([^}]+)\s*}/g,
        /export\s+default\s+(\w+)/g
      ];

      exportPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          if (match[1]) {
            exports.push(match[1]);
          }
        }
      });
    }

    return { imports, exports };
  }

  /**
   * 提取关键词
   */
  private extractKeywords(content: string, fileType: string): string[] {
    const config = FILE_TYPES[fileType];
    if (!config) return [];

    const keywords = new Set<string>();

    // 查找关键词
    config.keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      if (regex.test(content)) {
        keywords.add(keyword);
      }
    });

    return Array.from(keywords);
  }

  /**
   * 生成文件哈希
   */
  private generateFileHash(content: string): string {
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * 索引单个文件
   */
  private indexFile(filePath: string): FileIndex | null {
    try {
      const relativePath = path.relative(process.cwd(), filePath);
      const content = fs.readFileSync(filePath, 'utf8');
      const stats = fs.statSync(filePath);
      const fileType = this.getFileType(filePath);

      // 提取代码结构信息
      const { functions, classes } = this.extractFunctionsAndClasses(content, fileType);
      const { imports, exports } = this.extractImportsAndExports(content, fileType);
      const keywords = this.extractKeywords(content, fileType);

      // 生成标签
      const tags = this.generateTags(filePath, content, fileType);

      const fileIndex: FileIndex = {
        path: filePath,
        relativePath,
        name: path.basename(filePath),
        extension: path.extname(filePath),
        size: stats.size,
        lastModified: stats.mtime.getTime(),
        type: fileType,
        content,
        lines: content.split('\n').length,
        functions,
        classes,
        imports,
        exports,
        keywords,
        tags,
        hash: this.generateFileHash(content)
      };

      return fileIndex;
    } catch (error) {
      console.error(`索引文件失败 ${filePath}:`, error);
      return null;
    }
  }

  /**
   * 生成文件标签
   */
  private generateTags(filePath: string, content: string, fileType: string): string[] {
    const tags = new Set<string>();

    // 根据文件路径生成标签
    const pathParts = filePath.split(/[/\\]/);
    pathParts.forEach(part => {
      if (part && part !== 'src' && part !== 'components' && part !== 'views') {
        tags.add(part);
      }
    });

    // 根据文件类型生成标签
    tags.add(fileType);

    // 根据内容生成标签
    if (content.includes('export') && content.includes('import')) {
      tags.add('module');
    }
    if (content.includes('function') || content.includes('=>')) {
      tags.add('functionality');
    }
    if (content.includes('class')) {
      tags.add('class-based');
    }
    if (content.includes('interface') || content.includes('type')) {
      tags.add('typescript');
    }

    return Array.from(tags);
  }

  /**
   * 扫描项目文件
   */
  private scanProjectFiles(): string[] {
    const files: string[] = [];
    const extensions = Object.values(FILE_TYPES).flatMap(config => config.extensions);

    const scanDirectory = (dir: string) => {
      try {
        const items = fs.readdirSync(dir);

        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            // 跳过node_modules、dist等目录
            if (!['node_modules', 'dist', '.git', 'coverage'].includes(item)) {
              scanDirectory(fullPath);
            }
          } else if (stat.isFile()) {
            const ext = path.extname(item).toLowerCase();
            if (extensions.includes(ext)) {
              files.push(fullPath);
            }
          }
        }
      } catch (error) {
        console.error(`扫描目录失败 ${dir}:`, error);
      }
    };

    scanDirectory(process.cwd());
    return files;
  }

  /**
   * 构建索引
   */
  async buildIndex(): Promise<void> {
    console.log('🔍 开始构建代码索引库...');

    const files = this.scanProjectFiles();
    console.log(`📁 发现 ${files.length} 个文件需要索引`);

    let processed = 0;
    const newFiles: { [key: string]: FileIndex } = {};

    for (const file of files) {
      const fileIndex = this.indexFile(file);
      if (fileIndex) {
        newFiles[fileIndex.relativePath] = fileIndex;
      }

      processed++;
      if (processed % 100 === 0) {
        console.log(`📊 已处理 ${processed}/${files.length} 个文件`);
      }
    }

    // 更新数据库
    this.db.files = newFiles;
    this.db.totalFiles = Object.keys(newFiles).length;
    this.db.totalSize = Object.values(newFiles).reduce((sum, file) => sum + file.size, 0);
    this.db.lastUpdated = Date.now();

    // 重新构建标签索引
    this.rebuildTagIndex();

    // 重新构建依赖关系
    this.rebuildDependencyIndex();

    this.saveDatabase();
    console.log('✅ 代码索引库构建完成！');
  }

  /**
   * 重建标签索引
   */
  private rebuildTagIndex(): void {
    const tagIndex: { [key: string]: string[] } = {};

    Object.values(this.db.files).forEach(file => {
      file.tags.forEach(tag => {
        if (!tagIndex[tag]) {
          tagIndex[tag] = [];
        }
        tagIndex[tag].push(file.relativePath);
      });
    });

    this.db.tags = tagIndex;
  }

  /**
   * 重建依赖关系索引
   */
  private rebuildDependencyIndex(): void {
    const dependencyIndex: { [key: string]: string[] } = {};

    Object.values(this.db.files).forEach(file => {
      const filePath = file.relativePath;

      // 查找引用此文件的文件
      Object.values(this.db.files).forEach(otherFile => {
        if (otherFile.relativePath !== filePath) {
          // 检查imports中是否有引用
          otherFile.imports.forEach(importPath => {
            if (importPath.includes(file.name) || importPath.includes(filePath)) {
              if (!dependencyIndex[filePath]) {
                dependencyIndex[filePath] = [];
              }
              dependencyIndex[filePath].push(otherFile.relativePath);
            }
          });
        }
      });
    });

    this.db.dependencies = dependencyIndex;
  }

  /**
   * 搜索功能
   */
  search(query: string, options: {
    type?: string;
    tags?: string[];
    includeContent?: boolean;
    maxResults?: number;
  } = {}): SearchResult[] {
    const cacheKey = `${query}-${JSON.stringify(options)}`;
    if (this.searchCache.has(cacheKey)) {
      return this.searchCache.get(cacheKey)!;
    }

    const results: SearchResult[] = [];
    const {
      type,
      tags,
      includeContent = true,
      maxResults = 100
    } = options;

    Object.values(this.db.files).forEach(file => {
      let relevance = 0;

      // 文件类型过滤
      if (type && file.type !== type) {
        return;
      }

      // 标签过滤
      if (tags && tags.length > 0) {
        const hasMatchingTag = tags.some(tag => file.tags.includes(tag));
        if (!hasMatchingTag) {
          return;
        }
      }

      // 文件名搜索
      if (file.name.toLowerCase().includes(query.toLowerCase())) {
        relevance += 10;
        results.push({
          file: file.relativePath,
          line: 0,
          content: `文件名匹配: ${file.name}`,
          type: 'filename',
          relevance
        });
      }

      // 函数和类名搜索
      [...file.functions, ...file.classes].forEach((name, index) => {
        if (name.toLowerCase().includes(query.toLowerCase())) {
          relevance += 8;
          results.push({
            file: file.relativePath,
            line: index + 1,
            content: `函数/类: ${name}`,
            type: 'function',
            relevance
          });
        }
      });

      // 关键词搜索
      file.keywords.forEach((keyword, index) => {
        if (keyword.toLowerCase().includes(query.toLowerCase())) {
          relevance += 5;
          results.push({
            file: file.relativePath,
            line: index + 1,
            content: `关键词: ${keyword}`,
            type: 'keyword',
            relevance
          });
        }
      });

      // 内容搜索
      if (includeContent) {
        const lines = file.content.split('\n');
        lines.forEach((line, lineIndex) => {
          if (line.toLowerCase().includes(query.toLowerCase())) {
            // 过滤掉注释和字符串
            const config = FILE_TYPES[file.type];
            if (config) {
              let isInComment = false;
              let isInString = false;

              // 简单的启发式检查
              if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
                return;
              }

              if (line.includes('"') || line.includes("'") || line.includes('`')) {
                const stringCount = (line.match(/["'`]/g) || []).length;
                if (stringCount % 2 !== 0) {
                  isInString = true;
                }
              }

              if (!isInString) {
                relevance += 3;
                results.push({
                  file: file.relativePath,
                  line: lineIndex + 1,
                  content: line.trim(),
                  type: 'content',
                  relevance
                });
              }
            }
          }
        });
      }
    });

    // 按相关性排序
    results.sort((a, b) => b.relevance - a.relevance);

    // 限制结果数量
    const limitedResults = results.slice(0, maxResults);

    // 缓存搜索结果
    this.searchCache.set(cacheKey, limitedResults);

    return limitedResults;
  }

  /**
   * 获取文件信息
   */
  getFileInfo(relativePath: string): FileIndex | null {
    return this.db.files[relativePath] || null;
  }

  /**
   * 获取标签下的文件
   */
  getFilesByTag(tag: string): string[] {
    return this.db.tags[tag] || [];
  }

  /**
   * 获取依赖关系
   */
  getDependencies(filePath: string): string[] {
    return this.db.dependencies[filePath] || [];
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    totalFiles: number;
    totalSize: number;
    filesByType: { [key: string]: number };
    lastUpdated: number;
  } {
    const filesByType: { [key: string]: number } = {};

    Object.values(this.db.files).forEach(file => {
      filesByType[file.type] = (filesByType[file.type] || 0) + 1;
    });

    return {
      totalFiles: this.db.totalFiles,
      totalSize: this.db.totalSize,
      filesByType,
      lastUpdated: this.db.lastUpdated
    };
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.searchCache.clear();
  }

  /**
   * 导出索引数据
   */
  exportIndex(): IndexDatabase {
    return JSON.parse(JSON.stringify(this.db));
  }
}

// 导出单例实例
export const codeIndexSystem = new CodeIndexSystem();

// CLI 命令处理
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case 'build':
      codeIndexSystem.buildIndex().then(() => {
        console.log('索引构建完成！');
        process.exit(0);
      }).catch(error => {
        console.error('索引构建失败:', error);
        process.exit(1);
      });
      break;

    case 'search':
      const query = process.argv[3];
      if (!query) {
        console.error('请提供搜索关键词');
        process.exit(1);
      }

      const results = codeIndexSystem.search(query, {
        maxResults: 20
      });

      console.log(`\n🔍 搜索结果 "${query}":\n`);
      results.forEach((result, index) => {
        console.log(`${index + 1}. ${result.file}:${result.line}`);
        console.log(`   ${result.content}`);
        console.log(`   类型: ${result.type}, 相关性: ${result.relevance}\n`);
      });
      break;

    case 'stats':
      const stats = codeIndexSystem.getStats();
      console.log('\n📊 代码索引统计:');
      console.log(`总文件数: ${stats.totalFiles}`);
      console.log(`总大小: ${(stats.totalSize / 1024).toFixed(2)} KB`);
      console.log(`最后更新: ${new Date(stats.lastUpdated).toLocaleString()}`);
      console.log('\n按类型分布:');
      Object.entries(stats.filesByType).forEach(([type, count]) => {
        console.log(`  ${type}: ${count} 个文件`);
      });
      break;

    default:
      console.log(`
代码索引库系统使用方法:

构建索引:
  node code-index-system/index.js build

搜索代码:
  node code-index-system/index.js search <关键词>

查看统计:
  node code-index-system/index.js stats

示例:
  node code-index-system/index.js search "function"
  node code-index-system/index.js search "export" --type=typescript
      `);
  }
}