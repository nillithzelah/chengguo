# 小游戏展示网站

这是一个用于展示Cocos小游戏的前端网站，支持抖音小游戏的集成。

## 📍 服务器部署位置

- **服务器地址**: `47.115.94.203`
- **网站根目录**: `/var/www/douyin-admin-master/games/`
- **访问地址**: `https://m.game985.vip/games/`
- **返回管理后台**: `https://ecpm.game985.vip/`

## 项目结构

```
/
├── 1.html                 # 主页面
├── games/                 # 游戏文件夹
│   ├── game1/
│   │   └── index.html     # 游戏1页面
│   ├── game2/
│   │   └── index.html     # 游戏2页面
│   └── game3/
│       └── index.html     # 游戏3页面
└── README.md             # 说明文档
```

## 🎮 游戏管理系统

### ✨ 新的管理方式（推荐）

现在你可以通过编辑 `games.json` 文件来管理游戏，不需要修改代码！

#### 1. 添加新游戏

在 `games.json` 文件中添加新的游戏条目：

```json
{
  "id": "your-game-id",
  "name": "你的游戏名称",
  "preview": "游戏预览图片路径",
  "url": "games/your-game-folder/index.html",
  "description": "游戏简介（可选）",
  "category": "游戏分类",
  "enabled": true
}
```

#### 2. 游戏属性说明

- **id**: 游戏唯一标识符
- **name**: 显示在网站上的游戏名称
- **preview**: 游戏预览图片的URL或路径
- **url**: 游戏页面的相对路径
- **description**: 游戏简介（可选，会显示在游戏卡片下方）
- **category**: 游戏分类（用于搜索和分类）
- **enabled**: 是否启用该游戏（true/false）

#### 3. 预览图片

你可以使用：
- **网络图片**: `"https://example.com/preview.jpg"`
- **本地图片**: `"images/game-preview.jpg"`
- **占位符**: `"https://via.placeholder.com/300x150?text=游戏名称"`

### 📁 传统方式（仍然支持）

如果你更喜欢直接修改代码，可以继续使用传统方式。

## 如何集成Cocos游戏

### 1. 打包游戏为Web格式

在Cocos Creator中：

1. 打开你的项目
2. 选择 **项目 → 构建发布**
3. 构建平台选择 **Web Desktop**（推荐）
4. 构建完成后，会生成一个 `build` 文件夹

### 2. 复制游戏文件

1. 将打包后的整个文件夹复制到 `games/` 目录下
2. 例如：`games/your-game-name/`
3. 确保包含以下文件：
   - `index.html` (游戏入口文件)
   - `main.js` 或其他JS文件
   - `assets/` 文件夹 (资源文件)
   - 其他必要的文件

### 3. 更新游戏配置

**新方式（推荐）**：
直接在 `games.json` 中添加游戏信息

**传统方式**：
在 `1.html` 文件中修改 `games` 数组

### 4. 测试游戏

1. 启动本地服务器：`npx http-server -p 8000`
2. 访问 `http://127.0.0.1:8000`
3. 点击你的游戏进行测试

## 注意事项

- 确保游戏文件路径正确
- 检查资源文件路径是否需要调整
- 测试游戏在浏览器中的运行情况
- 考虑移动设备的兼容性

## 🚀 快速开始

### 1. 放置游戏图片
```bash
# 将你的游戏预览图片放到 images/ 文件夹中
images/
├── top-image.jpg        # 顶部横幅图片（正方形，400x400px）
├── game1-preview.jpg    # 游戏1预览图（300x200px）
├── game2-preview.jpg    # 游戏2预览图（300x200px）
└── game3-preview.jpg    # 游戏3预览图（300x200px）
```

### 2. 运行网站
```bash
npx http-server -p 8000
```
然后访问：`http://127.0.0.1:8000`

### 3. 服务器部署
如果你的服务器已经有网站，请查看 **[部署指南](DEPLOYMENT.md)** 获取详细说明。

### 4. 直接打开文件
直接在浏览器中打开 `index.html` 文件（可能会有CORS限制）

## 🖼️ 图片设置

### 1. 游戏列表上方图片（顶部横幅）

1. **准备图片**：
   - 将你的图片文件重命名为 `top-image.jpg`
   - 推荐尺寸：正方形，400x400px 或 300x300px
   - 支持格式：JPG, PNG, WebP
   - 文件大小建议小于200KB

2. **上传图片**：
   - 将 `top-image.jpg` 上传到 `images/` 文件夹
   - 替换现有的占位符文件

3. **自动显示**：
   - 图片会显示在游戏列表的上方
   - 宽度和游戏卡片差不多，是正方形设计
   - 如果图片不存在，会优雅地隐藏该区域

### 2. 游戏预览图片

1. **准备图片**：
   - 为每个游戏准备一张预览图片
   - 推荐尺寸：300x200px 或 400x250px
   - 支持格式：JPG, PNG, WebP
   - 文件大小建议小于100KB

2. **命名规则**：
   ```
   images/
   ├── game1-preview.jpg    # 游戏1的预览图
   ├── game2-preview.jpg    # 游戏2的预览图
   ├── game3-preview.jpg    # 游戏3的预览图
   └── top-image.jpg        # 顶部横幅图片
   ```

3. **更新配置**：
   编辑 `games.json` 文件，将预览图片路径更新为本地图片：
   ```json
   {
     "preview": "images/game1-preview.jpg"
   }
   ```

### 图片优化建议

- **游戏预览图**：300x200px，JPG格式，<100KB
- **顶部横幅图**：正方形，400x400px，JPG格式，<200KB
- **压缩工具**：使用在线工具压缩图片大小
- **响应式**：图片会自动适应不同屏幕尺寸

## ️ 游戏管理工具

### 使用添加游戏脚本

运行游戏添加助手：

```bash
node add-game.js
```

脚本会询问你：
- 游戏ID（文件夹名）
- 游戏名称
- 预览图片路径
- 游戏简介
- 游戏分类

然后自动更新 `games.json` 文件。

### 手动编辑 games.json

你也可以直接编辑 `games.json` 文件来添加游戏：

```json
{
  "games": [
    {
      "id": "my-awesome-game",
      "name": "我的精彩游戏",
      "preview": "https://example.com/preview.jpg",
      "url": "games/my-awesome-game/index.html",
      "description": "这是一个非常有趣的游戏",
      "category": "益智",
      "enabled": true
    }
  ]
}
```

## 功能特性

- 响应式设计，支持移动端
- 游戏搜索功能
- 固定搜索栏和返回顶部按钮
- 现代化的UI设计
- 支持多个游戏展示