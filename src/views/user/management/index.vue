<template>
  <div class="container">
    <Breadcrumb :items="['menu.user', 'menu.user.management']" />

    <!-- 页面标题 -->
    <div class="page-header">
      <h2>用户管理</h2>
      <p>管理系统中的所有用户账号</p>
    </div>

    <!-- 操作栏 -->
    <div class="action-bar">
      <!-- 隐藏新增用户按钮，只有管理员可见 -->
      <a-button
        v-if="canCreateUser"
        type="primary"
        @click="() => { console.log('新增用户按钮被点击'); openCreateModal(); }"
      >
        <template #icon>
          <icon-plus />
        </template>
        新增用户
      </a-button>
      <a-button @click="() => { console.log('刷新按钮被点击'); refreshUserList(); }">
        <template #icon>
          <icon-refresh />
        </template>
        刷新
      </a-button>
    </div>

    <!-- 用户列表 -->
    <a-table
      :columns="columns"
      :data="userList"
      :loading="loading"
      :pagination="pagination"
      row-key="id"
      @change="handleTableChange"
    >
      <template #role="{ record }">
        <a-tag
          :color="getRoleColor(record.role)"
          size="small"
        >
          {{ getRoleText(record.role) }}
        </a-tag>
      </template>

      <template #status="{ record }">
        <a-tag
          :color="record.is_active ? 'green' : 'red'"
          size="small"
        >
          {{ record.is_active ? '活跃' : '禁用' }}
        </a-tag>
      </template>

      <template #last_login_at="{ record }">
        {{ record.last_login_at ? formatDate(record.last_login_at) : '从未登录' }}
      </template>

      <template #created_at="{ record }">
        {{ formatDate(record.created_at) }}
      </template>

      <template #password="{ record }">
        {{ record.password || '******' }}
      </template>

      <template #action="{ record }">
        <a-space>
          <a-button
            v-if="checkCanEditUser(record)"
            type="text"
            size="small"
            @click="() => { console.log('编辑按钮被点击，用户ID:', record.id); editUser(record); }"
          >
            <template #icon>
              <icon-edit />
            </template>
            编辑
          </a-button>
          <a-button
            v-if="checkCanDeleteUser(record)"
            type="text"
            size="small"
            danger
            @click="() => { console.log('删除按钮被点击，用户ID:', record.id); confirmDeleteUser(record); }"
          >
            <template #icon>
              <icon-delete />
            </template>
            删除
          </a-button>
        </a-space>
      </template>
    </a-table>

    <!-- 新增用户模态框 -->
    <div v-if="showCreateModal && canCreateUser" class="modal-overlay" @click="resetCreateForm">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>新增用户</h3>
          <button @click="resetCreateForm" class="modal-close">&times;</button>
        </div>

        <div class="modal-body">
          <!-- 权限提示 -->
          <div v-if="availableRoles.length === 0" class="permission-warning">
            <p>您没有权限创建新用户。</p>
          </div>

          <!-- 有权限时显示表单 -->
          <div v-else>
            <!-- 角色限制提示 -->
            <div v-if="userStore.userInfo?.role !== 'admin'" class="permission-info">
              <p v-if="userStore.userInfo?.role === 'internal_service'">您只能创建内部普通用户或外部普通用户账号。</p>
              <p v-else-if="userStore.userInfo?.role === 'external_boss'">您只能创建外部用户账号。</p>
              <p v-else-if="userStore.userInfo?.role === 'external_service'">您只能创建外部普通用户账号。</p>
              <p v-else>您只能创建指定类型的用户账号。</p>
            </div>

            <div class="form-item">
              <label>用户名</label>
              <input
                v-model="createForm.username"
                type="text"
                placeholder="输入用户名（用于登录）"
                class="form-input"
              />
            </div>

            <div class="form-item">
              <label>密码</label>
              <input
                v-model="createForm.password"
                type="password"
                placeholder="输入密码"
                class="form-input"
              />
            </div>

            <div class="form-item">
              <label>确认密码</label>
              <input
                v-model="createForm.confirmPassword"
                type="password"
                placeholder="请再次输入密码"
                class="form-input"
              />
            </div>

            <div class="form-item">
              <label>显示名称</label>
              <input
                v-model="createForm.name"
                type="text"
                placeholder="输入用户显示名称"
                class="form-input"
              />
            </div>

            <div class="form-item">
              <label>邮箱</label>
              <input
                v-model="createForm.email"
                type="email"
                placeholder="输入邮箱地址"
                class="form-input"
              />
            </div>

            <div class="form-item">
              <label>用户角色</label>
              <select
                v-model="createForm.role"
                class="form-input"
              >
                <option
                  v-for="role in availableRoles"
                  :key="role.value"
                  :value="role.value"
                >
                  {{ role.label }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="resetCreateForm" class="btn btn-secondary" :disabled="createLoading">取消</button>
          <button
            v-if="availableRoles.length > 0"
            @click="() => { console.log('新增用户模态框确认按钮被点击'); handleCreateUser(); }"
            :disabled="!createForm.username || !createForm.password || !createForm.confirmPassword || !createForm.name || createForm.password !== createForm.confirmPassword || createForm.password.length < 6 || createLoading"
            :title="getCreateButtonTooltip()"
            class="btn btn-primary"
          >
            {{ createLoading ? '创建中...' : '创建用户' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 编辑用户模态框 -->
    <div v-if="showEditModal && editUserInfo" class="modal-overlay" @click="() => { showEditModal = false; editUserInfo = null; }">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>编辑用户</h3>
          <button @click="() => { showEditModal = false; editUserInfo = null; }" class="modal-close">&times;</button>
        </div>

        <div class="modal-body">
          <div class="form-item">
            <label>用户名</label>
            <input
              :value="editUserInfo.username"
              type="text"
              disabled
              class="form-input"
              style="background-color: #f5f5f5; cursor: not-allowed;"
            />
            <small style="color: #999; margin-top: 4px;">用户名不可修改</small>
          </div>

          <div class="form-item">
            <label>显示名称</label>
            <input
              v-model="editForm.name"
              type="text"
              placeholder="输入用户显示名称"
              class="form-input"
            />
          </div>

          <div class="form-item">
            <label>邮箱</label>
            <input
              v-model="editForm.email"
              type="email"
              placeholder="输入邮箱地址"
              class="form-input"
            />
          </div>

          <div class="form-item">
            <label>新密码（可选）</label>
            <input
              v-model="editForm.password"
              type="password"
              placeholder="留空表示不修改密码"
              class="form-input"
            />
            <small style="color: #666; margin-top: 4px;">
              密码长度至少6位，留空表示不修改密码
            </small>
          </div>

          <div class="form-item">
            <label>确认新密码</label>
            <input
              v-model="editForm.confirmPassword"
              type="password"
              placeholder="再次输入新密码"
              class="form-input"
            />
          </div>

          <div class="form-item">
            <label>用户角色</label>
            <select
              v-model="editForm.role"
              class="form-input"
            >
              <option
                v-for="role in getEditableRoles()"
                :key="role.value"
                :value="role.value"
              >
                {{ role.label }}
              </option>
            </select>
          </div>

          <div class="form-item">
            <label>
              <input
                v-model="editForm.is_active"
                type="checkbox"
                style="margin-right: 8px;"
              />
              账号激活状态
            </label>
            <small style="color: #666; margin-top: 4px;">
              {{ editForm.is_active ? '账号已激活，用户可以正常登录' : '账号已禁用，用户无法登录' }}
            </small>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="() => { showEditModal = false; editUserInfo = null; }" class="btn btn-secondary" :disabled="editLoading">取消</button>
          <button
            @click="() => { console.log('编辑用户模态框确认按钮被点击'); handleEditUser(); }"
            :disabled="!editForm.name || editLoading"
            class="btn btn-primary"
          >
            {{ editLoading ? '保存中...' : '保存修改' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 删除确认对话框 -->
    <a-modal
      v-model:open="showDeleteModal"
      title="确认删除"
      @ok="() => { console.log('删除确认模态框确认按钮被点击'); handleDeleteUser(); }"
      @cancel="() => { console.log('删除确认模态框取消按钮被点击'); cancelDelete(); }"
      :confirm-loading="deleteLoading"
      @after-open-change="(visible) => console.log('删除模态框显示状态变化:', visible)"
    >
      <div class="delete-confirm">
        <p>确定要删除用户 <strong>{{ deleteUserInfo?.username }}</strong> 吗？</p>
        <p class="warning-text">此操作不可撤销，将永久删除该用户及其所有相关数据。</p>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { Message } from '@arco-design/web-vue';
import {
  IconPlus,
  IconRefresh,
  IconEdit,
  IconDelete
} from '@arco-design/web-vue/es/icon';
import { getUserList, deleteUser, createUser, updateUser, type UserListItem } from '@/api/user';
import useUserStore from '@/store/modules/user';

// 响应式数据
const loading = ref(false);
const createLoading = ref(false);
const deleteLoading = ref(false);
const editLoading = ref(false);
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const userList = ref<UserListItem[]>([]);
const deleteUserInfo = ref<UserListItem | null>(null);
const editUserInfo = ref<UserListItem | null>(null);


// 用户Store
const userStore = useUserStore();

// 权限检查
const canCreateUser = computed(() => {
  const role = userStore.userInfo?.role;
  return ['admin', 'internal_boss', 'internal_service', 'external_boss', 'external_service', 'super_viewer', 'viewer', 'moderator'].includes(role || '');
});
const canViewUsers = computed(() => ['admin', 'internal_boss', 'internal_service', 'internal_user', 'external_boss', 'external_service', 'external_user', 'super_viewer', 'viewer', 'moderator', 'user'].includes(userStore.userInfo?.role || ''));

// 可创建的用户角色（根据当前用户角色限制）
const availableRoles = computed(() => {
  const currentRole = userStore.userInfo?.role;
  if (currentRole === 'admin') {
    // admin可以创建所有角色
    return [
      { value: 'external_user', label: '外部普通用户' },
      { value: 'external_service', label: '外部客服' },
      { value: 'external_boss', label: '外部老板' },
      { value: 'internal_user', label: '内部普通用户' },
      { value: 'internal_service', label: '内部客服' },
      { value: 'internal_boss', label: '内部老板' },
      { value: 'admin', label: '管理员' }
    ];
  } else if (['internal_boss', 'internal_service', 'super_viewer', 'moderator'].includes(currentRole || '')) {
    // 内部用户可以创建外部用户
    return [
      { value: 'external_user', label: '外部普通用户' },
      { value: 'external_service', label: '外部客服' }
    ];
  } else if (['external_boss', 'external_service', 'viewer', 'user'].includes(currentRole || '')) {
    // 外部用户只能创建普通外部用户
    return [
      { value: 'external_user', label: '外部普通用户' }
    ];
  }
  // 其他角色不能创建用户
  return [];
});

// 可编辑的用户角色（根据当前用户角色限制）
const getEditableRoles = () => {
  const currentRole = userStore.userInfo?.role;
  if (currentRole === 'admin') {
    // admin可以编辑所有角色
    return [
      { value: 'external_user', label: '外部普通用户' },
      { value: 'external_service', label: '外部客服' },
      { value: 'external_boss', label: '外部老板' },
      { value: 'internal_user', label: '内部普通用户' },
      { value: 'internal_service', label: '内部客服' },
      { value: 'internal_boss', label: '内部老板' },
      { value: 'admin', label: '管理员' }
    ];
  } else if (['internal_boss', 'internal_service', 'super_viewer', 'moderator'].includes(currentRole || '')) {
    // 内部用户可以编辑外部用户角色
    return [
      { value: 'external_user', label: '外部普通用户' },
      { value: 'external_service', label: '外部客服' },
      { value: 'external_boss', label: '外部老板' }
    ];
  } else if (['external_boss', 'external_service', 'viewer', 'user'].includes(currentRole || '')) {
    // 外部用户只能编辑为普通外部用户
    return [
      { value: 'external_user', label: '外部普通用户' }
    ];
  }
  // 其他角色不能编辑角色
  return [];
};

// 获取创建按钮的提示信息
const getCreateButtonTooltip = () => {
  if (createLoading.value) {
    return '正在创建用户...';
  }

  const errors = [];
  if (!createForm.username) errors.push('用户名');
  if (!createForm.password) errors.push('密码');
  if (!createForm.confirmPassword) errors.push('密码确认');
  if (!createForm.name) errors.push('姓名');
  if (createForm.password && createForm.password.length < 6) errors.push('密码长度至少6位');
  if (createForm.password && createForm.confirmPassword && createForm.password !== createForm.confirmPassword) errors.push('密码不匹配');

  if (errors.length > 0) {
    return `请填写: ${errors.join(', ')}`;
  }

  return '创建用户';
};

// 表单数据
const createForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  name: '',
  email: '',
  role: 'user'
});

const editForm = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'user',
  is_active: true
});

// 移除表单验证规则，使用自定义验证

// 表格列配置
const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
    width: 80
  },
  {
    title: '用户名',
    dataIndex: 'username',
    width: 120
  },
  {
    title: '姓名',
    dataIndex: 'name',
    width: 120
  },
  {
    title: '邮箱',
    dataIndex: 'email',
    width: 200
  },
  {
    title: '密码',
    dataIndex: 'password',
    width: 150,
    slotName: 'password'
  },
  {
    title: '角色',
    dataIndex: 'role',
    slotName: 'role',
    width: 100
  },
  {
    title: '创建者',
    dataIndex: 'creator_name',
    width: 120
  },
  {
    title: '状态',
    dataIndex: 'is_active',
    slotName: 'status',
    width: 80
  },
  {
    title: '最后登录',
    dataIndex: 'last_login_at',
    slotName: 'last_login_at',
    width: 160
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    slotName: 'created_at',
    width: 160
  },
  {
    title: '操作',
    slotName: 'action',
    width: 150
  }
];

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true
});

// 权限检查
const checkCanEditUser = (user: UserListItem) => {
  console.log('checkCanEditUser: 当前用户信息', userStore.userInfo);
  console.log('checkCanEditUser: 用户角色', userStore.userInfo?.role);
  console.log('checkCanEditUser: 目标用户ID', user.id);
  console.log('checkCanEditUser: 目标用户角色', user.role);
  console.log('checkCanEditUser: 当前用户ID', userStore.userInfo?.accountId);

  const currentUserRole = userStore.userInfo?.role;
  const targetUserRole = user.role;
  const currentUserId = Number(userStore.userInfo?.accountId);
  const targetUserId = user.id;

  // 不能编辑自己
  if (targetUserId === currentUserId) {
    console.log('checkCanEditUser: 不能编辑自己');
    return false;
  }

  // admin可以编辑所有用户
  if (currentUserRole === 'admin') {
    console.log('checkCanEditUser: admin可以编辑所有用户');
    return true;
  }

  // internal_boss可以编辑内部和外部用户
  if (currentUserRole === 'internal_boss') {
    const canEdit = targetUserRole.startsWith('internal_') || targetUserRole.startsWith('external_');
    console.log('checkCanEditUser: internal_boss可以编辑内部和外部用户', {
      targetRole: targetUserRole,
      canEdit
    });
    return canEdit;
  }

  // internal_service可以编辑内部用户和外部普通用户
  if (currentUserRole === 'internal_service') {
    const canEdit = targetUserRole === 'internal_user' || targetUserRole === 'external_user';
    console.log('checkCanEditUser: internal_service可以编辑内部普通用户和外部普通用户', {
      targetRole: targetUserRole,
      canEdit
    });
    return canEdit;
  }

  // external_boss可以编辑外部用户
  if (currentUserRole === 'external_boss') {
    const canEdit = targetUserRole.startsWith('external_');
    console.log('checkCanEditUser: external_boss可以编辑外部用户', {
      targetRole: targetUserRole,
      canEdit
    });
    return canEdit;
  }

  // external_service可以编辑外部普通用户
  if (currentUserRole === 'external_service') {
    const canEdit = targetUserRole === 'external_user';
    console.log('checkCanEditUser: external_service可以编辑外部普通用户', {
      targetRole: targetUserRole,
      canEdit
    });
    return canEdit;
  }

  // 兼容旧角色名称的权限检查 - 旧角色已迁移，但保留向后兼容
  // super_viewer -> internal_boss, moderator -> internal_service, viewer -> internal_user
  const roleStr = currentUserRole as string; // 避免类型检查错误，允许旧角色名
  if (roleStr === 'super_viewer') {
    // super_viewer等同于internal_boss，可以编辑所有内部和外部用户
    const canEdit = targetUserRole.startsWith('internal_') || targetUserRole.startsWith('external_');
    console.log('checkCanEditUser: super_viewer(兼容internal_boss)可以编辑内部和外部用户', {
      targetRole: targetUserRole,
      canEdit
    });
    return canEdit;
  }

  if (roleStr === 'moderator') {
    // moderator等同于internal_service，可以编辑内部普通用户和外部普通用户
    const canEdit = targetUserRole === 'internal_user' || targetUserRole === 'external_user';
    console.log('checkCanEditUser: moderator(兼容internal_service)可以编辑普通用户', {
      targetRole: targetUserRole,
      canEdit
    });
    return canEdit;
  }

  if (roleStr === 'viewer') {
    // viewer等同于internal_user，只能编辑外部普通用户（按原有逻辑）
    const canEdit = targetUserRole === 'external_user';
    console.log('checkCanEditUser: viewer(兼容internal_user)只能编辑外部普通用户', {
      targetRole: targetUserRole,
      canEdit
    });
    return canEdit;
  }

  // 其他角色不能编辑用户
  console.log('checkCanEditUser: 其他角色不能编辑用户');
  return false;
};

const checkCanDeleteUser = (user: UserListItem) => {
  console.log('checkCanDeleteUser: 当前用户信息', userStore.userInfo);
  console.log('checkCanDeleteUser: 当前用户ID', userStore.userInfo?.accountId);
  console.log('checkCanDeleteUser: 目标用户ID', user.id);
  console.log('checkCanDeleteUser: 当前用户角色', userStore.userInfo?.role);

  // 只有admin可以删除用户，且不能删除自己
  const isAdmin = userStore.userInfo?.role === 'admin';
  const isNotSelf = user.id !== Number(userStore.userInfo?.accountId);

  console.log('checkCanDeleteUser: 是否为管理员', isAdmin);
  console.log('checkCanDeleteUser: 是否不是自己', isNotSelf);
  const result = isAdmin && isNotSelf;
  console.log('checkCanDeleteUser: 最终结果', result);
  return result;
};

// 获取角色颜色
const getRoleColor = (role: string) => {
  const colors = {
    admin: 'red',
    internal_boss: 'purple',
    internal_service: 'orange',
    internal_user: 'blue',
    external_boss: 'green',
    external_service: 'cyan',
    external_user: 'lime',
    // 兼容旧角色名称，默认归类为内部
    super_viewer: 'purple',
    viewer: 'blue',
    moderator: 'orange',
    user: 'lime'
  };
  return colors[role] || 'default';
};

// 获取角色文本
const getRoleText = (role: string) => {
  const texts = {
    admin: '管理员',
    internal_boss: '内部老板',
    internal_service: '内部客服',
    internal_user: '内部普通用户',
    external_boss: '外部老板',
    external_service: '外部客服',
    external_user: '外部普通用户',
    // 兼容旧角色名称，默认归类为内部
    super_viewer: '内部老板',
    viewer: '内部普通用户',
    moderator: '内部客服',
    user: '外部普通用户'
  };
  return texts[role] || role;
};

// 格式化日期
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN');
};

// 加载用户列表
const loadUserList = async () => {
  loading.value = true;
  try {
    const response = await getUserList();
    userList.value = response.data.users;
    pagination.total = response.data.total;
  } catch (error) {
    console.error('加载用户列表失败:', error);
    Message.error('加载用户列表失败');
  } finally {
    loading.value = false;
  }
};

// 刷新用户列表
const refreshUserList = () => {
  loadUserList();
};

// 处理表格变化
const handleTableChange = (newPagination: any) => {
  console.log('表格变化:', newPagination);
  // 更新分页参数
  pagination.current = newPagination.current;
  pagination.pageSize = newPagination.pageSize;
  // 前端分页不需要重新加载数据
};

// 编辑用户
const editUser = (user: UserListItem) => {
  editUserInfo.value = user;

  // 填充编辑表单
  editForm.name = user.name || '';
  editForm.email = user.email || '';
  editForm.password = '';
  editForm.confirmPassword = '';
  editForm.role = user.role;
  editForm.is_active = user.is_active;

  showEditModal.value = true;
};

// 确认删除用户
const confirmDeleteUser = async (user: UserListItem) => {
  console.log('confirmDeleteUser: 函数被调用，用户:', user);

  // 使用浏览器原生confirm对话框
  const confirmed = confirm(`确定要删除用户 "${user.username}" 吗？\n\n此操作不可撤销，将永久删除该用户及其所有相关数据。`);

  if (confirmed) {
    console.log('confirmDeleteUser: 用户确认删除');
    await handleDeleteUserDirect(user);
  } else {
    console.log('confirmDeleteUser: 用户取消删除');
  }
};

// 取消删除
const cancelDelete = () => {
  console.log('cancelDelete: 函数被调用');
  deleteUserInfo.value = null;
  showDeleteModal.value = false;
  console.log('cancelDelete: 函数执行完成');
};

// 执行删除用户（直接处理）
const handleDeleteUserDirect = async (user: UserListItem) => {
  console.log('handleDeleteUserDirect: 开始删除用户，ID:', user.id);
  deleteLoading.value = true;

  try {
    console.log('handleDeleteUserDirect: 调用deleteUser API');
    await deleteUser(user.id);
    console.log('handleDeleteUserDirect: API调用成功');
    Message.success('用户删除成功');
    console.log('handleDeleteUserDirect: 刷新用户列表');
    // 刷新用户列表
    loadUserList();
  } catch (error) {
    console.error('handleDeleteUserDirect: 删除用户失败:', error);
    Message.error('删除用户失败');
  } finally {
    console.log('handleDeleteUserDirect: 设置loading为false');
    deleteLoading.value = false;
  }
};

// 执行删除用户（模态框版本，保留以备不时之需）
const handleDeleteUser = async () => {
  console.log('handleDeleteUser: 函数被调用');
  console.log('handleDeleteUser: deleteUserInfo:', deleteUserInfo.value);

  if (!deleteUserInfo.value) {
    console.log('handleDeleteUser: deleteUserInfo为空，直接返回');
    return;
  }

  console.log('handleDeleteUser: 开始删除用户，ID:', deleteUserInfo.value.id);
  deleteLoading.value = true;

  try {
    console.log('handleDeleteUser: 调用deleteUser API');
    await deleteUser(deleteUserInfo.value.id);
    console.log('handleDeleteUser: API调用成功');
    Message.success('用户删除成功');
    console.log('handleDeleteUser: 关闭模态框');
    showDeleteModal.value = false;
    deleteUserInfo.value = null;
    console.log('handleDeleteUser: 刷新用户列表');
    // 刷新用户列表
    loadUserList();
  } catch (error) {
    console.error('handleDeleteUser: 删除用户失败:', error);
    Message.error('删除用户失败');
  } finally {
    console.log('handleDeleteUser: 设置loading为false');
    deleteLoading.value = false;
  }
};

// 移除表单引用，不再需要

// 打开创建用户模态框
const openCreateModal = () => {
  console.log('openCreateModal: 打开创建用户模态框');
  console.log('openCreateModal: 当前用户角色:', userStore.userInfo?.role);
  console.log('openCreateModal: availableRoles:', availableRoles.value);
  console.log('openCreateModal: availableRoles.length:', availableRoles.value.length);

  // 重置表单
  createForm.username = '';
  createForm.password = '';
  createForm.confirmPassword = '';
  createForm.name = '';
  createForm.email = '';
  // 设置默认角色为第一个可用的角色
  createForm.role = availableRoles.value.length > 0 ? availableRoles.value[0].value : 'user';
  console.log('openCreateModal: 设置默认角色为:', createForm.role);
  showCreateModal.value = true;
  console.log('openCreateModal: 模态框已打开');
};

// 重置创建表单
const resetCreateForm = () => {
  console.log('resetCreateForm: 重置创建表单');
  createForm.username = '';
  createForm.password = '';
  createForm.confirmPassword = '';
  createForm.name = '';
  createForm.email = '';
  // 设置默认角色为第一个可用的角色
  createForm.role = availableRoles.value.length > 0 ? availableRoles.value[0].value : 'user';
  showCreateModal.value = false;
  console.log('resetCreateForm: 表单重置完成');
};

// 处理编辑用户
const handleEditUser = async () => {
  console.log('handleEditUser: 开始编辑用户');

  if (!editUserInfo.value) {
    console.log('handleEditUser: editUserInfo为空');
    return;
  }

  const currentRole = userStore.userInfo?.role;

  try {
    // 基础表单验证
    if (!editForm.name.trim()) {
      Message.error('请输入用户姓名');
      return;
    }

    // 邮箱验证（如果填写了邮箱）
    if (editForm.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editForm.email)) {
        Message.error('请输入有效的邮箱地址');
        return;
      }
    }

    // 权限验证：internal_service只能将用户角色改为internal_user或external_user
    if (currentRole === 'internal_service' && !['internal_user', 'external_user'].includes(editForm.role)) {
      Message.error('您只能将用户角色设置为内部普通用户或外部普通用户');
      return;
    }

    // 权限验证：external_boss只能将用户角色改为external_开头
    if (currentRole === 'external_boss' && !editForm.role.startsWith('external_')) {
      Message.error('您只能编辑外部用户的角色');
      return;
    }

    // 权限验证：external_service只能将用户角色改为external_user
    if (currentRole === 'external_service' && editForm.role !== 'external_user') {
      Message.error('您只能将用户角色设置为外部普通用户');
      return;
    }

    // 密码验证（如果提供了密码）
    if (editForm.password.trim()) {
      if (editForm.password.length < 6) {
        Message.error('密码长度至少6位');
        return;
      }

      if (editForm.password !== editForm.confirmPassword) {
        Message.error('两次输入的密码不一致');
        return;
      }
    }

    editLoading.value = true;

    const updateData: any = {
      name: editForm.name.trim(),
      email: editForm.email.trim(),
      role: editForm.role,
      is_active: editForm.is_active
    };

    // 如果提供了密码，则包含在更新数据中
    if (editForm.password.trim()) {
      updateData.password = editForm.password;
    }

    console.log('handleEditUser: 调用updateUser API', editUserInfo.value.id, updateData);
    await updateUser(editUserInfo.value.id, updateData);

    console.log('handleEditUser: 用户编辑成功');

    Message.success(`用户"${editForm.name}"信息更新成功！`);

    showEditModal.value = false;
    editUserInfo.value = null;

    // 重新加载用户列表
    loadUserList();
  } catch (error) {
    console.error('handleEditUser: 编辑用户失败:', error);

    // 处理不同的错误类型
    if (error.response?.data?.message) {
      Message.error(error.response.data.message);
    } else if (error.message) {
      Message.error(error.message);
    } else {
      Message.error('编辑用户失败，请稍后重试');
    }
  } finally {
    console.log('handleEditUser: 设置loading为false');
    editLoading.value = false;
  }
};

// 处理创建用户
const handleCreateUser = async () => {
  console.log('handleCreateUser: 开始创建用户');

  const currentRole = userStore.userInfo?.role;

  // 检查权限：admin、internal_boss、internal_service、external_boss、external_service可以创建用户
  if (!['admin', 'internal_boss', 'internal_service', 'external_boss', 'external_service', 'super_viewer', 'viewer', 'moderator'].includes(currentRole || '')) {
    Message.error('您没有权限执行此操作');
    return;
  }

  // 检查internal_service只能创建internal_user或external_user角色
  if (['internal_service', 'moderator'].includes(currentRole || '') && !['internal_user', 'external_user'].includes(createForm.role)) {
    Message.error('您只能创建内部普通用户或外部普通用户账号');
    return;
  }

  // 检查external_boss只能创建external_开头的角色
  if (['external_boss', 'viewer'].includes(currentRole || '') && !createForm.role.startsWith('external_')) {
    Message.error('您只能创建外部用户账号');
    return;
  }

  // 检查external_service只能创建external_user角色
  if (['external_service', 'user'].includes(currentRole || '') && createForm.role !== 'external_user') {
    Message.error('您只能创建外部普通用户账号');
    return;
  }

  try {
    // 基础表单验证
    if (!createForm.username || !createForm.password || !createForm.name) {
      Message.error('请填写完整的用户信息');
      return;
    }

    // 检查密码确认
    if (createForm.password !== createForm.confirmPassword) {
      Message.error('两次输入的密码不一致');
      return;
    }

    // 检查密码长度
    if (createForm.password.length < 6) {
      Message.error('密码长度至少6位');
      return;
    }

    // 检查用户名长度
    if (createForm.username.length < 3 || createForm.username.length > 50) {
      Message.error('用户名长度应在3-50字符之间');
      return;
    }

    createLoading.value = true;
    const { confirmPassword, ...userData } = createForm;

    // 添加创建者信息
    const currentUser = userStore.userInfo;
    const userDataWithCreator = {
      ...userData,
      created_by: currentUser?.accountId ? Number(currentUser.accountId) : undefined
    };

    console.log('handleCreateUser: 调用createUser API', userDataWithCreator);
    await createUser(userDataWithCreator);

    console.log('handleCreateUser: 用户创建成功');

    Message.success(`用户"${createForm.name}"创建成功！\n用户名: ${createForm.username}\n密码: ${createForm.password}`);

    showCreateModal.value = false;
    resetCreateForm();

    // 重新加载用户列表以获取完整的用户数据（包括正确的ID）
    loadUserList();
  } catch (error) {
    console.error('handleCreateUser: 创建用户失败:', error);

    // 处理不同的错误类型
    if (error.response?.data?.message) {
      Message.error(error.response.data.message);
    } else if (error.message) {
      Message.error(error.message);
    } else {
      Message.error('创建用户失败，请稍后重试');
    }
  } finally {
    console.log('handleCreateUser: 设置loading为false');
    createLoading.value = false;
  }
};

// 组件挂载时加载数据
onMounted(() => {
  // 检查用户权限
  if (!canViewUsers.value) {
    Message.error('您没有权限访问此页面');
    // 这里可以重定向到其他页面
    return;
  }

  loadUserList();
});
</script>

<style scoped lang="less">
.container {
  padding: 20px;
}

.page-header {
  margin-bottom: 24px;

  h2 {
    margin: 0 0 8px 0;
    font-size: 24px;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: var(--color-text-3);
  }
}

.action-bar {
  margin-bottom: 16px;
  display: flex;
  gap: 12px;
}

.delete-confirm {
  .warning-text {
    color: var(--color-warning-6);
    margin: 8px 0 0 0;
    font-size: 14px;
  }
}

.permission-warning {
  background: #fff7e6;
  border: 1px solid #ffd591;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 16px;

  p {
    margin: 0;
    color: #d46b08;
    font-size: 14px;
    text-align: center;
  }
}

.permission-info {
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 16px;

  p {
    margin: 0;
    color: #52c41a;
    font-size: 14px;
    text-align: center;
  }
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1d2129;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #86909c;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  color: #1d2129;
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 表单样式 */
.form-item {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
}

.form-item label {
  display: block;
  font-weight: 500;
  color: #1d2129;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
}

.form-input:focus {
  outline: none;
  border-color: #165dff;
  box-shadow: 0 0 0 2px rgba(22, 93, 255, 0.1);
}

.form-input select {
  cursor: pointer;
}

/* 按钮样式 */
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #165dff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0e42d2;
}

.btn-secondary {
  background: #f2f3f5;
  color: #1d2129;
}

.btn-secondary:hover {
  background: #e5e6eb;
}
</style>