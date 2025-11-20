# Arco Design 图标使用指南

本文档记录了项目中常用的 Arco Design 图标及其使用方法。

## 图标命名规则

Arco Design 的图标组件命名遵循 `icon-{name}` 的格式，例如：
- `icon-user` - 用户图标
- `icon-bar-chart` - 柱状图图标

## 常用图标列表

### 用户相关
- `icon-user` - 用户/人员
- `icon-user-group` - 用户组/团队
- `icon-user-add` - 添加用户
- `icon-user-delete` - 删除用户

### 数据图表
- `icon-bar-chart` - 柱状图
- `icon-line-chart` - 折线图
- `icon-pie-chart` - 饼图
- `icon-area-chart` - 面积图
- `icon-scatter-plot` - 散点图

### 导航菜单
- `icon-home` - 首页
- `icon-dashboard` - 仪表板
- `icon-menu` - 菜单
- `icon-apps` - 应用
- `icon-setting` - 设置

### 文件操作
- `icon-file` - 文件
- `icon-file-text` - 文本文件
- `icon-file-image` - 图片文件
- `icon-folder` - 文件夹
- `icon-folder-open` - 打开的文件夹

### 编辑操作
- `icon-edit` - 编辑
- `icon-delete` - 删除
- `icon-plus` - 添加/新建
- `icon-minus` - 减少
- `icon-check` - 确认/勾选
- `icon-close` - 关闭

### 方向导航
- `icon-arrow-up` - 向上箭头
- `icon-arrow-down` - 向下箭头
- `icon-arrow-left` - 向左箭头
- `icon-arrow-right` - 向右箭头
- `icon-chevron-up` - 向上-chevron
- `icon-chevron-down` - 向下-chevron

### 状态指示
- `icon-loading` - 加载中
- `icon-success` - 成功
- `icon-error` - 错误
- `icon-warning` - 警告
- `icon-info` - 信息

### 设备硬件
- `icon-desktop` - 桌面电脑
- `icon-mobile` - 手机
- `icon-tablet` - 平板
- `icon-laptop` - 笔记本

### 通信联系
- `icon-mail` - 邮件
- `icon-phone` - 电话
- `icon-message` - 消息
- `icon-bell` - 通知

### 工具功能
- `icon-search` - 搜索
- `icon-filter` - 筛选
- `icon-sort` - 排序
- `icon-refresh` - 刷新
- `icon-download` - 下载
- `icon-upload` - 上传

## 在Vue组件中使用图标

### 方法1：直接使用图标组件
```vue
<template>
  <div>
    <icon-user />
    <icon-bar-chart />
  </div>
</template>

<script setup lang="ts">
import { IconUser, IconBarChart } from '@arco-design/web-vue/es/icon';
</script>
```

### 方法2：在菜单配置中使用
```typescript
// src/router/routes/modules/some-module.ts
{
  path: '/example',
  name: 'Example',
  meta: {
    locale: 'menu.example',
    icon: 'icon-bar-chart', // 使用图标名称字符串
    order: 1,
  },
}
```

### 方法3：在面包屑导航中使用
```vue
<template>
  <Breadcrumb :items="['menu.example']" />
</template>

<script setup lang="ts">
import Breadcrumb from '@/components/breadcrumb/index.vue';
</script>
```

## 图标大小和颜色

图标默认大小为 16px，可以通过 CSS 调整：

```css
.arco-icon {
  font-size: 20px;
  color: #165dff;
}
```

## 验证图标是否存在

如果使用了一个不存在的图标，控制台会显示警告信息：
```
[Vue warn]: Failed to resolve component: icon-nonexistent
```

## 图标资源

- [Arco Design 图标库](https://arco.design/vue/component/icon)
- [图标搜索和预览](https://arco.design/vue/component/icon#IconList)

## 注意事项

1. 图标名称区分大小写
2. 确保图标组件已正确导入
3. 优先使用语义化的图标名称
4. 避免使用不存在的图标名称

## 当前项目中使用的图标

### 菜单图标
- `icon-user` - 用户管理菜单
- `icon-bar-chart` - 广告数据菜单

### 组件图标
- `icon-apps` - 面包屑导航起始图标
- `icon-plus` - 添加按钮
- `icon-refresh` - 刷新按钮
- `icon-edit` - 编辑按钮
- `icon-delete` - 删除按钮