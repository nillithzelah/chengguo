# 项目文档概述

## 📋 文档分类

本项目包含多个文档文件，用于指导开发、部署、配置和使用。以下是所有文档的分类和描述，按类别整理。文档位于项目根目录。

### 1. **核心项目文档**
- **README.md** - 主项目说明，包含项目简介、技术栈、快速开始、部署指南、功能特性、贡献指南、许可证。
  - 状态: 完整，SQLite 优先描述准确。
  - 用途: 新用户入门文档。

### 2. **数据库文档**
- **DATABASE-README.md** - 数据库存储实现指南，涵盖架构设计、模型定义、初始化、API接口、迁移指南、故障排除。
  - 状态: 已修复，SQLite 默认，支持 PostgreSQL 切换。
  - 用途: 数据库架构和使用说明。
- **DATABASE-OPERATIONS.md** - 数据库操作指南，包括表结构、常用脚本、查询/修改操作、统计查询、关联查询、维护操作、注意事项。
  - 状态: 已修复，SQLite 备份/恢复命令，通用故障排除。
  - 用途: 日常数据库操作参考。

### 3. **部署和配置文档**
- **DEPLOY-GUIDE.md** - 服务器部署指南，涵盖上传代码、数据库迁移、重启服务、验证步骤、故障排除。
  - 状态: 已修复，SQLite 文件同步和权限设置。
  - 用途: 生产环境部署步骤。
- **SIMPLE-DEPLOY-GUIDE.md** - 简单部署指南，5分钟快速部署，系统要求、命令步骤、故障排除。
  - 状态: 完整，SQLite 配置说明。
  - 用途: 快速部署参考。
- **SERVER-CONFIG.md** - 服务器配置文档，包含 IP (47.115.94.203)、密码 (1qaz1QAZ1qaz - 立即更改!)、端口、目录、环境变量、命令、安全建议。
  - 状态: 新建，基于项目文件生成。
  - 用途: 服务器具体配置和维护。

### 4. **API 和集成文档**
- **DOUYIN_API_GUIDE.md** - 抖音 API 指南，概述、配置、功能、故障排除。
  - 状态: 完整，无数据库误导。
  - 用途: 抖音开放平台集成说明。

### 5. **功能模块文档**
- **ECPM-SIMPLE-README.md** - eCPM 数据管理模块，功能概述、技术架构、API接口、UI设计、配置、使用指南、故障排除。
  - 状态: 完整，实时查询策略，无存储描述。
  - 用途: eCPM 模块详细说明。
- **README-抖音小游戏设备信息收集.md** - 抖音小游戏设备信息收集系统，概述、功能、技术栈、配置、部署、监控、安全、故障排除。
  - 状态: 完整，SQLite 描述准确。
  - 用途: 设备信息收集功能指南。
- **PERMISSION-CONTROL-GUIDE.md** - 权限控制实现指南，核心原理、路由配置、菜单过滤、路由守卫、角色定义、实现步骤、最佳实践、常见问题。
  - 状态: 完整，无数据库相关误导。
  - 用途: 权限系统说明。

## 📂 文档位置
所有文档位于项目根目录。建议创建 **docs/** 文件夹统一管理：

```
docs/
├── DATABASE-README.md
├── DATABASE-OPERATIONS.md
├── DEPLOY-GUIDE.md
├── DOUYIN_API_GUIDE.md
├── ECPM-SIMPLE-README.md
├── PERMISSION-CONTROL-GUIDE.md
├── README-抖音小游戏设备信息收集.md
├── SERVER-CONFIG.md
├── SIMPLE-DEPLOY-GUIDE.md
└── DOCUMENTATION-OVERVIEW.md (本文件)
```

### 移动文档命令
```bash
mkdir docs
mv *.md docs/  # 移动所有 .md 文件到 docs/
mv docs/README.md ./  # README.md 保留在根目录
```

## 🚨 缺失文档建议

基于项目规模和最佳实践，以下文档缺失，建议新建：

### 1. **CONTRIBUTING.md** - 贡献指南
- 内容: 如何 Fork、提交 PR、代码规范、测试要求。
- 优先级: 高 (开源项目必需)。

### 2. **CHANGELOG.md** - 更新日志
- 内容: 版本变更记录，按版本列出新增/修复/变更。
- 优先级: 中 (跟踪项目历史)。

### 3. **LICENSE** - 许可证文件
- 内容: MIT 许可证文本 (package.json 已声明 MIT)。
- 优先级: 高 (法律要求)。

### 4. **API-REFERENCE.md** - 完整 API 参考
- 内容: 所有后端 API 端点、参数、响应格式、错误码。
  - 包括: /api/user/*, /api/game/*, /api/douyin/* 等。
- 优先级: 高 (开发者参考)。

### 5. **TROUBLESHOOTING.md** - 故障排除指南
- 内容: 常见问题汇总 (部署失败、API错误、数据库问题、权限错误)。
  - 整合现有文档中的故障排除部分。
- 优先级: 中 (用户支持)。

### 6. **SECURITY.md** - 安全指南
- 内容: 安全最佳实践、漏洞报告、密码管理、HTTPS 配置。
  - 包含 SERVER-CONFIG.md 的安全部分。
- 优先级: 中 (生产安全)。

### 7. **ROADMAP.md** - 开发路线图
- 内容: 未来计划、待办功能、优先级。
- 优先级: 低 (项目规划)。

### 8. **CONTRIBUTORS.md** - 贡献者列表
- 内容: 项目维护者和贡献者。
- 优先级: 低 (开源社区)。

## 📝 文档维护建议

### 更新策略
- **定期审查**: 每版本发布前检查所有文档准确性。
- **版本控制**: 每个重大变更后更新 CHANGELOG.md。
- **统一格式**: 所有 .md 文件使用 Markdown 标准，包含更新日期/版本。
- **链接检查**: 确保内部链接正确 (如 [DATABASE-README.md] → docs/DATABASE-README.md)。

### 工具推荐
- **MkDocs**: 生成静态文档网站 (mkdocs.yml 配置)。
- **Docusaurus**: 文档框架，支持版本控制、搜索。
- **GitHub Wiki**: 外部 Wiki 页面，易于协作。

### 文档文件夹创建
```bash
# 创建 docs 目录
mkdir docs

# 移动文档
mv DATABASE-*.md DOUYIN_API_GUIDE.md ECPM-SIMPLE-README.md PERMISSION-CONTROL-GUIDE.md README-*.md SERVER-CONFIG.md SIMPLE-DEPLOY-GUIDE.md docs/

# 保留根目录 README.md
mv docs/README.md ./

# 更新本文件位置
mv DOCUMENTATION-OVERVIEW.md docs/
```

## 🎯 总结

**现有文档**: 10 个 .md 文件，覆盖数据库、部署、API、功能模块。
**分类完整**: 核心/数据库/部署/API/功能 5 类。
**缺失文档**: 8 个建议新建 (CONTRIBUTING.md, CHANGELOG.md 等)。
**推荐**: 创建 docs/ 文件夹统一管理，添加缺失文档提升项目专业性。

如需新建缺失文档或调整分类，请提供具体要求。