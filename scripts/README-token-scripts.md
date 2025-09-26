# Token管理脚本使用说明

本目录包含用于管理抖音广告投放Token的脚本工具。

## 📋 脚本列表

### 1. `update-ad-access-token.js` - 更新广告投放Access Token
### 2. `update-ad-refresh-token.js` - 更新广告投放Refresh Token

## 🚀 使用方法

### 首次部署：重置数据库表（重要）

如果服务器上已有旧的tokens表结构，需要先重置：

```bash
# 重置tokens表（删除旧表，创建新表，初始化默认数据）
node scripts/reset-tokens-table.js
```

## 🔍 查询Token信息

### 查看完整Token值
```bash
# 显示数据库中所有活跃Token的完整信息
node scripts/query-db.js
```

**输出包含:**
- 完整Token值（不脱敏）
- 过期时间
- 应用信息
- 创建/更新时间

### 推荐：SQLite兼容脚本（服务器环境）

#### 更新Access Token
```bash
# 语法
node scripts/update-token-sqlite.js access_token "新的access_token"

# 示例
node scripts/update-token-sqlite.js access_token "0801121847476a4341356250537a72504157376b6f5a637163773d3d"
```

#### 更新Refresh Token
```bash
# 语法
node scripts/update-token-sqlite.js refresh_token "新的refresh_token"

# 示例
node scripts/update-token-sqlite.js refresh_token "857b246c6868b17e556892edf5826f8342408de5"
```

### 备用：直接数据库操作脚本

#### 更新Access Token
```bash
# 语法
node scripts/update-token-direct.js access_token "新的access_token"

# 示例
node scripts/update-token-direct.js access_token "0801121847476a4341356250537a72504157376b6f5a637163773d3d"
```

#### 更新Refresh Token
```bash
# 语法
node scripts/update-token-direct.js refresh_token "新的refresh_token"

# 示例
node scripts/update-token-direct.js refresh_token "857b246c6868b17e556892edf5826f8342408de5"
```

### 备用：模型操作脚本（需要完整环境）

#### 更新Access Token
```bash
# 语法
node scripts/update-ad-access-token.js "新的access_token"

# 示例
node scripts/update-ad-access-token.js "0801121847476a4341356250537a72504157376b6f5a637163773d3d"
```

#### 更新Refresh Token
```bash
# 语法
node scripts/update-ad-refresh-token.js "新的refresh_token"

# 示例
node scripts/update-ad-refresh-token.js "857b246c6868b17e556892edf5826f8342408de5"
```

## 📝 功能说明

### Access Token脚本功能：
- ✅ 验证数据库连接
- ✅ 更新广告投放Access Token到数据库
- ✅ 自动验证更新结果
- ✅ 提供详细的操作日志
- ✅ 无需重启服务器，系统会自动重新加载

### Refresh Token脚本功能：
- ✅ 验证数据库连接
- ✅ 更新广告投放Refresh Token到数据库
- ✅ 自动验证更新结果
- ✅ 提供详细的操作日志
- ✅ 无需重启服务器，系统会自动重新加载

## 🔍 获取Token的方法

### 从抖音开放平台获取：
1. 登录 [抖音开放平台](https://open.douyin.com/)
2. 进入应用管理
3. 在"应用配置" -> "Token管理" 中获取

### 从API响应获取：
- Access Token: 调用Token获取接口后的响应
- Refresh Token: 在Token刷新响应中获取

## ⚠️ 注意事项

1. **Token格式**: 确保Token是有效的字符串格式
2. **权限验证**: 脚本会验证数据库连接和Token有效性
3. **自动重载**: 更新后无需重启服务器，系统会自动使用新Token
4. **日志记录**: 所有操作都会记录详细日志
5. **错误处理**: 如果更新失败，脚本会提供详细错误信息

## 📊 验证更新结果

更新成功后，可以通过以下方式验证：

### 1. 查看服务器日志
```bash
tail -f logs/server.log | grep "Token"
```

### 2. 调用Token状态API
```bash
curl http://localhost:3000/api/douyin/token-status
```

### 3. 测试广告API
```bash
curl "http://localhost:3000/api/douyin/ad-preview-qrcode?advertiser_id=1843402492405963&id_type=ID_TYPE_PROMOTION&promotion_id=7551723504199909439"
```

## 🔧 故障排除

### 数据库连接失败
- 检查数据库服务是否运行
- 验证`.env`文件中的数据库配置
- 确认网络连接正常

### Token验证失败
- 确认Token格式正确
- 检查Token是否已过期
- 验证Token权限是否足够

### 脚本执行失败
- 确保Node.js环境正常
- 检查脚本文件权限
- 确认所有依赖已安装

### `Token.updateToken is not a function` 错误
- **原因**: Sequelize模型方法未正确加载
- **解决**: 使用 `update-token-direct.js` 脚本直接操作数据库
- **命令**:
  ```bash
  node scripts/update-token-direct.js access_token "your_token_here"
  node scripts/update-token-direct.js refresh_token "your_token_here"
  ```

### `no such column: token_value` 错误
- **原因**: 数据库表结构不匹配
- **解决**: 使用SQLite兼容脚本，自动检测表结构
- **命令**:
  ```bash
  node scripts/update-token-sqlite.js access_token "your_token_here"
  node scripts/update-token-sqlite.js refresh_token "your_token_here"
  ```

### `no such column: updated_at` 错误
- **原因**: 服务器数据库缺少某些列
- **解决**: 使用SQLite兼容脚本，自动适配表结构
- **命令**: 同上，SQLite兼容脚本会自动处理缺失列

### 服务器已有旧token表
- **原因**: 服务器上存在旧版本的tokens表结构
- **解决**: 先重置tokens表，再使用更新脚本
- **命令**:
  ```bash
  # 1. 重置表结构
  node scripts/reset-tokens-table.js

  # 2. 更新token值
  node scripts/update-token-sqlite.js access_token "your_token_here"
  ```

## 📞 技术支持

如果遇到问题，请：
1. 查看脚本输出的错误信息
2. 检查服务器日志
3. 验证数据库状态
4. 联系技术支持团队