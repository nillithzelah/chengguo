# 用户级别权限系统指南

## 角色层级结构

```
管理 (admin) - 最高权限
├── 内部老板 (internal_boss) - 管理内部业务
│   ├── 内部客服 (internal_service) - 内部客户服务
│   │   └── 内用户 (internal_user) - 内部用户
│   └── 内用户 (internal_user) - 内部用户
└── 外部老板 (external_boss) - 管理外部业务
    ├── 外部客服 (external_service) - 外部客户服务
    │   └── 外用户 (external_user) - 外部用户
    └── 外用户 (external_user) - 外部用户
```

## 权限控制逻辑

### 用户管理权限

- **管理 (admin)**: 可以管理所有用户（创建、编辑、删除）
- **内部老板 (internal_boss)**: 可以管理内部客服和内用户
- **外部老板 (external_boss)**: 可以管理外部客服和外用户
- **内部客服 (internal_service)**: 可以管理内用户
- **外部客服 (external_service)**: 可以管理外用户
- **用户 (internal_user, external_user)**: 无管理权限

### 游戏分配权限

- **管理 → 老板**: 管理可以分配游戏给内部老板和外部老板
- **老板 → 客服**: 老板可以分配游戏给自己的客服
- **客服 → 用户**: 客服可以分配游戏给自己的用户

### 页面访问权限

- **管理**: 所有页面
- **老板**: 用户管理、游戏管理相关页面
- **客服**: 用户管理（限自己下级）、游戏分配页面
- **用户**: 基本功能页面

## 角色定义

| 角色代码 | 显示名称 | 权限级别 | 可创建角色 | 可编辑角色 |
|---------|---------|---------|-----------|-----------|
| admin | 管理 | 最高 | 所有角色 | 所有角色 |
| internal_boss | 内部老板 | 高 | 内部客服、内用户 | 内部客服、内用户 |
| external_boss | 外部老板 | 高 | 外部客服、外用户 | 外部客服、外用户 |
| internal_service | 内部客服 | 中 | 内用户 | 内用户 |
| external_service | 外部客服 | 中 | 外用户 | 外用户 |
| internal_user | 内用户 | 低 | 无 | 无 |
| external_user | 外用户 | 低 | 无 | 无 |

## 技术实现

### 前端角色类型定义

```typescript
export type RoleType = '' | '*' | 'admin' | 'internal_boss' | 'internal_service' | 'internal_user' | 'external_boss' | 'external_service' | 'external_user';
```

### 权限检查函数

- `canCreateUser`: 检查当前用户是否可以创建新用户
- `canViewUsers`: 检查当前用户是否可以查看用户列表
- `checkCanEditUser`: 检查是否可以编辑特定用户
- `checkCanDeleteUser`: 检查是否可以删除用户（仅admin）

### 角色颜色映射

- admin: 红色
- internal_boss/external_boss: 紫色
- internal_service/external_service: 橙色
- internal_user/external_user: 蓝色

## 注意事项

1. 用户不能编辑自己的账号信息
2. 只有admin可以删除用户
3. 权限检查在前端和后端都要进行
4. 角色层级关系必须严格遵守，避免权限泄露