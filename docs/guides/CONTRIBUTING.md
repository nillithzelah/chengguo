# 贡献指南

## 📋 欢迎参与

感谢您对橙果宜牛项目的兴趣！我们欢迎社区贡献，包括代码改进、文档完善、问题报告等。

## 🤝 贡献流程

### 1. Fork 项目
- 在 GitHub 上 Fork 本仓库到您的账号: https://github.com/nillithzelah/chengguo
- 克隆仓库：`git clone https://github.com/nillithzelah/chengguo.git`

### 2. 创建特性分支
```bash
git checkout -b feature/amazing-feature
```

### 3. 环境设置
```bash
cd chengguo
npm install
```

### 4. 开发您的特性
- 确保代码符合项目规范
- 添加必要的测试
- 更新相关文档

### 5. 提交更改
```bash
git add .
git commit -m "feat: add amazing feature

- 描述您的更改
- 列出具体变更
- 说明影响范围"
```

### 6. 推送并创建 Pull Request
```bash
git push origin feature/amazing-feature
```
- 在 GitHub 上创建 Pull Request 到 https://github.com/nillithzelah/chengguo
- 选择正确的模板
- 详细说明您的更改

## 📝 代码规范

### JavaScript/TypeScript
- 使用 ES6+ 语法
- 遵循 Airbnb 风格指南
- 变量命名：camelCase
- 常量命名：UPPER_SNAKE_CASE

### Vue 组件
- 组件名：PascalCase
- 单个单词组件名避免使用
- props 接口命名：camelCase
- emit 事件命名：kebab-case

### 提交信息
使用 Conventional Commits 规范：
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码样式
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 杂项

示例：
```
feat: add user authentication

- 实现 JWT 登录系统
- 添加密码加密
- 更新用户模型
```

## 🧪 测试要求

### 单元测试
- 使用 Vitest 或 Jest
- 覆盖率 > 80%
- 测试组件逻辑和 API 调用

### E2E 测试
- 使用 Cypress 或 Playwright
- 测试关键用户流程
- 确保权限控制正常

## 📚 文档要求

### 更新文档
- 新功能需更新 docs/README.md
- API 变更需更新 docs/API/API-REFERENCE.md
- 配置变更需更新 docs/DEPLOYMENT/SERVER-CONFIG.md

### 文档格式
- Markdown 标准
- 包含代码示例
- 清晰的步骤说明
- 版本和日期标注

## 🔍 代码审查标准

### 必查项目
1. **功能性**：代码是否按预期工作
2. **安全性**：无漏洞，输入验证完整
3. **性能**：避免 N+1 查询，优化循环
4. **可维护性**：代码结构清晰，注释完整
5. **一致性**：遵循项目编码规范
6. **测试**：有单元测试覆盖关键逻辑

### 常见问题
- 空值检查是否完整
- 错误处理是否合理
- 权限控制是否到位
- 资源泄漏是否避免

## 🤝 合并标准

Pull Request 会被合并时需满足：
- 代码通过 ESLint 检查
- 单元测试通过
- 文档更新完整
- 无冲突的变更
- 社区评审通过 (2+ 赞成)

## 📞 联系方式

有疑问请联系：
- **维护者**: nillithzelah (GitHub @nillithzelah)
- **Issue**: 在 https://github.com/nillithzelah/chengguo/issues 提交问题
- **讨论**: 通过 Pull Request 评论讨论

## 📄 许可证

本项目采用 MIT 许可证，详见 LICENSE 文件。

---

**感谢您的贡献！让我们一起打造优秀的抖音广告管理系统！**