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
        v-if="userStore.userInfo?.role === 'admin'"
        type="primary"
        @click="() => { console.log('新增用户按钮被点击'); showCreateModal = true; }"
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
            type="text"
            size="small"
            @click="() => { console.log('编辑按钮被点击，用户ID:', record.id); editUser(record); }"
            :disabled="!canEditUser(record)"
          >
            <template #icon>
              <icon-edit />
            </template>
            编辑
          </a-button>
          <a-button
            type="text"
            size="small"
            danger
            @click="() => { console.log('删除按钮被点击，用户ID:', record.id); confirmDeleteUser(record); }"
            :disabled="!canDeleteUser(record)"
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
    <div v-if="showCreateModal && userStore.userInfo?.role === 'admin'" class="modal-overlay" @click="resetCreateForm">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>新增用户</h3>
          <button @click="resetCreateForm" class="modal-close">&times;</button>
        </div>

        <div class="modal-body">
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
              <option value="user">普通用户</option>
              <option value="admin">管理员</option>
            </select>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="resetCreateForm" class="btn btn-secondary" :disabled="createLoading">取消</button>
          <button
            @click="() => { console.log('新增用户模态框确认按钮被点击'); handleCreateUser(); }"
            :disabled="!createForm.username || !createForm.password || !createForm.name || createLoading"
            class="btn btn-primary"
          >
            {{ createLoading ? '创建中...' : '创建用户' }}
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
import { ref, reactive, onMounted } from 'vue';
import { Message } from '@arco-design/web-vue';
import {
  IconPlus,
  IconRefresh,
  IconEdit,
  IconDelete
} from '@arco-design/web-vue/es/icon';
import { getUserList, deleteUser, createUser, type UserListItem } from '@/api/user';
import useUserStore from '@/store/modules/user';

// 响应式数据
const loading = ref(false);
const createLoading = ref(false);
const deleteLoading = ref(false);
const showCreateModal = ref(false);
const showDeleteModal = ref(false);
const userList = ref<UserListItem[]>([]);
const deleteUserInfo = ref<UserListItem | null>(null);

// 用户Store
const userStore = useUserStore();

// 表单数据
const createForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  name: '',
  email: '',
  role: 'user'
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
const canEditUser = (user: UserListItem) => {
  console.log('canEditUser: 当前用户信息', userStore.userInfo);
  console.log('canEditUser: 用户角色', userStore.userInfo?.role);
  return userStore.userInfo?.role === 'admin';
};

const canDeleteUser = (user: UserListItem) => {
  // 管理员可以删除其他用户，但不能删除自己
  console.log('canDeleteUser: 当前用户信息', userStore.userInfo);
  console.log('canDeleteUser: 当前用户ID', userStore.userInfo?.accountId);
  console.log('canDeleteUser: 目标用户ID', user.id);
  console.log('canDeleteUser: 是否为管理员', userStore.userInfo?.role === 'admin');
  console.log('canDeleteUser: 是否不是自己', user.id !== Number(userStore.userInfo?.accountId));
  const result = userStore.userInfo?.role === 'admin' &&
                 user.id !== Number(userStore.userInfo?.accountId);
  console.log('canDeleteUser: 最终结果', result);
  return result;
};

// 获取角色颜色
const getRoleColor = (role: string) => {
  const colors = {
    admin: 'red',
    moderator: 'orange',
    user: 'blue'
  };
  return colors[role] || 'default';
};

// 获取角色文本
const getRoleText = (role: string) => {
  const texts = {
    admin: '管理员',
    moderator: '审核员',
    user: '普通用户'
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
const handleTableChange = (pagination: any) => {
  // 这里可以处理分页、排序等
  console.log('表格变化:', pagination);
};

// 编辑用户
const editUser = (user: UserListItem) => {
  Message.info('编辑功能开发中...');
  // TODO: 实现编辑用户功能
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

// 重置创建表单
const resetCreateForm = () => {
  console.log('resetCreateForm: 重置创建表单');
  createForm.username = '';
  createForm.password = '';
  createForm.confirmPassword = '';
  createForm.name = '';
  createForm.email = '';
  createForm.role = 'user';
  showCreateModal.value = false;
  console.log('resetCreateForm: 表单重置完成');
};

// 处理创建用户
const handleCreateUser = async () => {
  console.log('handleCreateUser: 开始创建用户');

  // 检查管理员权限
  if (userStore.userInfo?.role !== 'admin') {
    Message.error('您没有权限执行此操作');
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

    console.log('handleCreateUser: 调用createUser API');
    await createUser(userData);

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
  if (userStore.userInfo?.role !== 'admin') {
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