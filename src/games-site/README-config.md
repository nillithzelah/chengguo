# 网站配置说明

这个游戏展示页面支持通过配置文件为多个网站定制不同的外观和行为，而无需复制整个项目。

## 配置结构

`config.json` 文件包含以下部分：

### sites
定义每个网站的配置：
- `title`: 页面标题
- `logo`: logo配置
  - `type`: "image" 或 "text"
  - `src`: 图片路径（image类型）
  - `text`: 文本内容（text类型）
  - `alt`: 图片alt文本
- `backButton`: 返回按钮配置
  - `text`: 按钮文本
  - `url`: 返回链接
- `showWubugLogo`: 是否显示武霸哥风格的logo区域

### siteDetection
定义如何检测当前网站：
- `rules`: 检测规则数组
  - `condition`: JavaScript条件表达式
  - `site`: 匹配时使用的配置名

## 使用方法

### 1. 添加新网站配置
在 `config.json` 的 `sites` 对象中添加新的网站配置：

```json
"mysite": {
  "title": "我的网站",
  "logo": {
    "type": "image",
    "src": "images/top/mysite-logo.jpg",
    "alt": "我的网站Logo"
  },
  "backButton": {
    "text": "返回我的网站",
    "url": "https://mysite.com/"
  },
  "showWubugLogo": false
}
```

### 2. 添加检测规则
在 `siteDetection.rules` 中添加检测条件：

```json
{
  "condition": "hostname.includes('mysite') || urlParams.get('site') === 'mysite'",
  "site": "mysite"
}
```

### 3. 上传Logo图片
将logo图片放在 `images/top/` 目录下，路径与配置中的 `src` 匹配。

## 示例

### 通过URL参数访问
```
https://yourdomain.com/?site=site2
```

### 通过域名访问
如果你的域名包含特定关键词，系统会自动检测。

## 注意事项

- 配置文件需要与 `index.html` 在同一目录
- 图片路径相对于页面根目录
- 条件表达式使用JavaScript eval，生产环境建议使用更安全的方法
- 默认配置名为 "default"

## 扩展配置

你可以根据需要扩展配置，添加更多自定义选项，如：
- 主题颜色
- 自定义样式
- 不同的游戏列表
- 等等