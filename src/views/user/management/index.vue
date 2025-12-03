<template>
  <div class="container">
    <Breadcrumb :items="['menu.user', 'menu.user.management']" />

    <!-- 页面标题 -->
    <div class="page-header">
      <h2>用户管理</h2>
      <p>管理系统中的所有用户账号</p>
    </div>

    <!-- 数据统计 -->
    <div class="stats-section">
      <div class="stats-info">
        <div class="total-count">系统中共有 {{ userList.length }} 个用户</div>
      </div>
    </div>

    <!-- 操作栏 -->
    <div class="action-bar">
      <!-- 隐藏新增用户按钮，只有管理员可见 -->
      <a-button
        v-if="canCreateUser"
        type="primary"
        @click="openCreateModal"
      >
        <template #icon>
          <icon-plus />
        </template>
        新增用户
      </a-button>
      <a-button @click="refreshUserList">
        <template #icon>
          <icon-refresh />
        </template>
        刷新
      </a-button>
    </div>

    <!-- 数据统计 -->
    <div class="stats-section">
      <div class="stats-info">
        <div class="total-count">共有 {{ userList.length }} 条用户记录</div>
      </div>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-section">
      <div class="filter-row">
        <div class="filter-item">
          <label>搜索用户：</label>
          <a-input
            v-model="searchKeyword"
            @input="handleSearchChange"
            placeholder="输入用户名或姓名"
            class="search-input"
            allow-clear
          >
            <template #prefix>
              <icon-search />
            </template>
          </a-input>
        </div>
        <div class="filter-item">
          <label>角色筛选：</label>
          <select
            v-model="roleFilter"
            @change="handleRoleFilterChange"
            class="filter-select"
          >
            <option value="">全部角色</option>
            <option
              v-for="role in allFilterableRoles"
              :key="role.value"
              :value="role.value"
            >
              {{ role.label }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- 用户列表 -->
    <a-table
      :columns="columns"
      :data="userList"
      :loading="loading"
      :pagination="pagination"
      row-key="id"
      :scroll="{ x: 1200 }"
      @change="handleTableChange"
    >
      <template #empty>
        <div class="empty-state">
          <div class="empty-icon">👥</div>
          <div class="empty-text">
            <h3>暂无用户数据</h3>
            <p>
              {{ searchKeyword || roleFilter ? '没有找到符合条件的用户' : '系统中还没有用户数据' }}
            </p>
            <div v-if="searchKeyword || roleFilter" class="empty-actions">
              <a-button type="primary" @click="refreshUserList">
                刷新数据
              </a-button>
            </div>
            <div v-else-if="canCreateUser" class="empty-actions">
              <a-button type="primary" @click="openCreateModal">
                创建第一个用户
              </a-button>
            </div>
          </div>
        </div>
      </template>

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

      <template #parent_name="{ record }">
        {{ record.parent_name || '无' }}
      </template>


      <template #action="{ record }">
        <a-space>
          <a-button
            v-if="checkCanEditUser(record)"
            type="text"
            size="small"
            @click="() => editUser(record)"
          >
            <template #icon>
              <icon-edit />
            </template>
            编辑
          </a-button>
          <!-- 晋升按钮暂时隐藏，保留代码以便以后恢复 -->
          <!--
          <a-button
            v-if="checkCanPromoteUser(record)"
            type="text"
            size="small"
            style="color: #52c41a;"
            @click="() => confirmPromoteUser(record)"
          >
            <template #icon>
              <icon-up />
            </template>
            晋升
          </a-button>
          -->
          <a-button
            v-if="checkCanDeleteUser(record)"
            type="text"
            size="small"
            danger
            @click="() => confirmDeleteUser(record)"
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
    <div v-if="showCreateModal && canCreateUser" class="modal-overlay">
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

            <div class="form-item">
              <label>用户名</label>
              <input
                v-model="createForm.username"
                type="text"
                placeholder="输入用户名（用于登录）"
                class="form-input"
                :class="{ 'error': createForm.username && !createFormValidation.username.isValid }"
              />
              <small style="color: #666; margin-top: 4px;">用户名长度3-50字符，只能包含字母、数字和下划线</small>
              <small v-if="createForm.username && !createFormValidation.username.isValid" style="color: #ff4d4f; margin-top: 4px;">
                {{ createFormValidation.username.message }}
              </small>
            </div>

            <div class="form-item">
              <label>密码</label>
              <input
                v-model="createForm.password"
                type="password"
                placeholder="输入密码"
                class="form-input"
                :class="{ 'error': createForm.password && !createFormValidation.password.isValid }"
              />
              <small style="color: #666; margin-top: 4px;">密码长度至少6位，建议包含字母和数字的组合</small>
              <small v-if="createForm.password && !createFormValidation.password.isValid" style="color: #ff4d4f; margin-top: 4px;">
                {{ createFormValidation.password.message }}
              </small>
            </div>

            <div class="form-item">
              <label>确认密码</label>
              <input
                v-model="createForm.confirmPassword"
                type="password"
                placeholder="请再次输入密码"
                class="form-input"
                :class="{ 'error': createForm.confirmPassword && !createFormValidation.confirmPassword.isValid }"
              />
              <small style="color: #666; margin-top: 4px;">请再次输入密码，确保两次输入一致</small>
              <small v-if="createForm.confirmPassword && !createFormValidation.confirmPassword.isValid" style="color: #ff4d4f; margin-top: 4px;">
                {{ createFormValidation.confirmPassword.message }}
              </small>
            </div>

            <div class="form-item">
              <label>显示名称</label>
              <input
                v-model="createForm.name"
                type="text"
                placeholder="输入用户显示名称"
                class="form-input"
                :class="{ 'error': createForm.name && !createFormValidation.name.isValid }"
              />
              <small style="color: #666; margin-top: 4px;">用户在系统中显示的名称</small>
              <small v-if="createForm.name && !createFormValidation.name.isValid" style="color: #ff4d4f; margin-top: 4px;">
                {{ createFormValidation.name.message }}
              </small>
            </div>


            <div class="form-item">
              <label>用户角色</label>
              <select
                v-model="createForm.role"
                class="form-input"
                @change="handleRoleChange"
              >
                <option
                  v-for="role in availableRoles"
                  :key="role.value"
                  :value="role.value"
                >
                  {{ role.label }}
                </option>
              </select>
              <small style="color: #666; margin-top: 4px;">选择用户角色，角色决定了用户的权限范围</small>
            </div>

            <!-- 上级用户选择 -->
            <div v-if="showParentSelector" class="form-item">
              <label>{{ parentSelectorLabel }}</label>
              <select
                v-model="createForm.parent_id"
                class="form-input"
                :disabled="loadingParentOptions"
              >
                <option value="">请选择上级用户</option>
                <option
                  v-for="parent in parentOptions"
                  :key="parent.id"
                  :value="parent.id"
                >
                  {{ parent.display_name }}
                </option>
              </select>
              <small style="color: #666; margin-top: 4px;">{{ parentSelectorHint }}</small>
              <small v-if="createForm.parent_id && !isValidParentSelection" style="color: #ff4d4f; margin-top: 4px;">
                请选择正确的上级用户
              </small>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="resetCreateForm" class="btn btn-secondary" :disabled="createLoading">取消</button>
          <button
            v-if="availableRoles.length > 0"
            @click="handleCreateUser"
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
    <div v-if="showEditModal && editUserInfo" class="modal-overlay">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>编辑用户</h3>
          <button @click="resetEditForm" class="modal-close">&times;</button>
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
              :class="{ 'error': editForm.name && !editFormValidation.name.isValid }"
            />
            <small style="color: #666; margin-top: 4px;">用户在系统中显示的名称</small>
            <small v-if="editForm.name && !editFormValidation.name.isValid" style="color: #ff4d4f; margin-top: 4px;">
              {{ editFormValidation.name.message }}
            </small>
          </div>


          <div class="form-item">
            <label>新密码（可选）</label>
            <input
              v-model="editForm.password"
              type="password"
              placeholder="留空表示不修改密码"
              class="form-input"
              :class="{ 'error': editForm.password && !editFormValidation.password.isValid }"
            />
            <small style="color: #666; margin-top: 4px;">
              密码长度至少6位，建议包含字母和数字的组合，留空表示不修改密码
            </small>
            <small v-if="editForm.password && !editFormValidation.password.isValid" style="color: #ff4d4f; margin-top: 4px;">
              {{ editFormValidation.password.message }}
            </small>
          </div>

          <div class="form-item">
            <label>确认新密码</label>
            <input
              v-model="editForm.confirmPassword"
              type="password"
              placeholder="再次输入新密码"
              class="form-input"
              :class="{ 'error': editForm.confirmPassword && !editFormValidation.confirmPassword.isValid }"
            />
            <small style="color: #666; margin-top: 4px;">
              请再次输入新密码，确保两次输入一致
            </small>
            <small v-if="editForm.confirmPassword && !editFormValidation.confirmPassword.isValid" style="color: #ff4d4f; margin-top: 4px;">
              {{ editFormValidation.confirmPassword.message }}
            </small>
          </div>

          <div class="form-item">
            <label>用户角色</label>
            <select
              v-model="editForm.role"
              class="form-input"
              @change="handleEditRoleChange"
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

          <!-- 编辑上级用户选择 -->
          <div v-if="showEditParentSelector" class="form-item">
            <label>{{ editParentSelectorLabel }}</label>
            <select
              v-model="editForm.parent_id"
              class="form-input"
              :disabled="loadingEditParentOptions"
            >
              <option value="">请选择上级用户</option>
              <option
                v-for="parent in editParentOptions"
                :key="parent.id"
                :value="parent.id"
              >
                {{ parent.display_name }}
              </option>
            </select>
            <small style="color: #666; margin-top: 4px;">{{ editParentSelectorHint }}</small>
            <small v-if="editForm.parent_id && !isValidEditParentSelection" style="color: #ff4d4f; margin-top: 4px;">
              请选择正确的上级用户
            </small>
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
          <button @click="resetEditForm" class="btn btn-secondary" :disabled="editLoading">取消</button>
          <button
            @click="handleEditUser"
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
      @ok="handleDeleteUser"
      @cancel="cancelDelete"
      :confirm-loading="deleteLoading"
    >
      <div class="delete-confirm">
        <p>确定要删除用户 <strong>{{ deleteUserInfo?.username }}</strong> 吗？</p>
        <p class="warning-text">此操作不可撤销，将永久删除该用户及其所有相关数据。</p>
      </div>
    </a-modal>

    <!-- 晋升确认对话框暂时隐藏，保留代码以便以后恢复 -->
    <!--
    <a-modal
      v-model:open="showPromoteModal"
      title="确认晋升"
      @ok="handlePromoteUser"
      @cancel="cancelPromote"
      :confirm-loading="promoteLoading"
    >
      <div class="promote-confirm">
        <p>确定要晋升用户 <strong>{{ promoteUserInfo?.username }}</strong> 吗？</p>
        <div class="promote-options">
          <label class="checkbox-label">
            <input
              v-model="promoteWithSubordinates"
              type="checkbox"
              class="checkbox-input"
            />
            <span class="checkbox-text">同时晋升所有下级用户</span>
          </label>
          <small class="promote-hint">
            如果勾选，该用户的所有下级用户（包括间接下级）都会自动晋升一级
          </small>
        </div>
        <div v-if="promoteWithSubordinates" class="promote-warning">
          <p class="warning-text">⚠️ 注意：这将同时晋升该用户的所有下级用户，请确认操作！</p>
        </div>
      </div>
    </a-modal>
    -->
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { Message } from '@arco-design/web-vue';
import {
  IconPlus,
  IconRefresh,
  IconEdit,
  IconDelete,
  IconSearch,
  IconUp
} from '@arco-design/web-vue/es/icon';
import { getUserList, deleteUser, createUser, updateUser, promoteUsers, type UserListItem } from '@/api/user';
import useUserStore from '@/store/modules/user';
import Breadcrumb from '@/components/breadcrumb/index.vue';

// 响应式数据
const loading = ref(false);
const createLoading = ref(false);
const deleteLoading = ref(false);
const editLoading = ref(false);
const promoteLoading = ref(false);
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const showPromoteModal = ref(false);
const userList = ref<UserListItem[]>([]);
const deleteUserInfo = ref<UserListItem | null>(null);
const editUserInfo = ref<UserListItem | null>(null);
const promoteUserInfo = ref<UserListItem | null>(null);
const promoteWithSubordinates = ref(true);

// 筛选相关
const roleFilter = ref('');
const searchKeyword = ref('');
const originalUserList = ref<UserListItem[]>([]); // 保存原始用户列表

// 上级用户选择相关
const showParentSelector = ref(false);
const parentOptions = ref([]);
const loadingParentOptions = ref(false);
const parentSelectorLabel = ref('上级用户');
const parentSelectorHint = ref('请选择上级用户');
const isValidParentSelection = ref(true);

// 编辑上级用户选择相关
const showEditParentSelector = ref(false);
const editParentOptions = ref([]);
const loadingEditParentOptions = ref(false);
const editParentSelectorLabel = ref('上级用户');
const editParentSelectorHint = ref('请选择上级用户');
const isValidEditParentSelection = ref(true);


// 用户Store
const userStore = useUserStore();

// 权限检查
const canCreateUser = computed(() => {
  const role = userStore.userInfo?.role;
  return ['admin', 'internal_boss', 'internal_service', 'external_boss', 'external_service', 'super_viewer', 'viewer', 'moderator', 'programmer','clerk'].includes(role || '');
});
const canViewUsers = computed(() => ['admin', 'internal_boss', 'internal_service', 'internal_user', 'external_boss', 'external_service', 'external_user', 'super_viewer', 'viewer', 'moderator', 'user', 'programmer','clerk'].includes(userStore.userInfo?.role || ''));

// 可创建的用户角色（根据当前用户角色限制）
const availableRoles = computed(() => {
  const currentRole = userStore.userInfo?.role;
  if (currentRole === 'admin') {
    // admin可以创建所有角色
    return [
      { value: 'external_user_1', label: '外部普通用户1级' },
      { value: 'external_user_2', label: '外部普通用户2级' },
      { value: 'external_user_3', label: '外部普通用户3级' },
      { value: 'external_service', label: '外部客服' },
      { value: 'external_boss', label: '外部老板' },
      { value: 'internal_user_1', label: '内部普通用户1级' },
      { value: 'internal_user_2', label: '内部普通用户2级' },
      { value: 'internal_user_3', label: '内部普通用户3级' },
      { value: 'internal_service', label: '内部客服' },
      { value: 'internal_boss', label: '内部老板' },
      { value: 'admin', label: '管理员' },
      { value: 'programmer', label: '程序员' },
      { value: 'clerk', label: '文员' },
      { value: 'sales', label: '销售' }
    ];
  } else if (currentRole === 'clerk') {
    // 文员可以创建除管理员外的所有角色
    return [
      { value: 'external_user_1', label: '外部普通用户1级' },
      { value: 'external_user_2', label: '外部普通用户2级' },
      { value: 'external_user_3', label: '外部普通用户3级' },
      { value: 'external_service', label: '外部客服' },
      { value: 'external_boss', label: '外部老板' },
      { value: 'internal_user_1', label: '内部普通用户1级' },
      { value: 'internal_user_2', label: '内部普通用户2级' },
      { value: 'internal_user_3', label: '内部普通用户3级' },
      { value: 'internal_service', label: '内部客服' },
      { value: 'internal_boss', label: '内部老板' },
      { value: 'programmer', label: '程序员' },
      { value: 'clerk', label: '文员' },
      { value: 'sales', label: '销售' }
    ];
  } else if (['internal_boss', 'super_viewer'].includes(currentRole || '')) {
    // 内部老板可以创建内部客服和内用户
    return [
      { value: 'internal_service', label: '内部客服' },
      { value: 'internal_user_1', label: '内部普通用户1级' },
      { value: 'internal_user_2', label: '内部普通用户2级' },
      { value: 'internal_user_3', label: '内部普通用户3级' },
      { value: 'programmer', label: '程序员' }
    ];
  } else if (['internal_service', 'moderator'].includes(currentRole || '')) {
    // 内部老板可以创建内部客服和内用户
    return [
      { value: 'internal_service', label: '内部客服' },
      { value: 'internal_user_1', label: '内部普通用户1级' },
      { value: 'internal_user_2', label: '内部普通用户2级' },
      { value: 'internal_user_3', label: '内部普通用户3级' }
    ];
  } else if (['internal_service', 'moderator'].includes(currentRole || '')) {
    // 内部客服只能创建内部普通用户
    return [
      { value: 'internal_user_1', label: '内部普通用户1级' },
      { value: 'internal_user_2', label: '内部普通用户2级' },
      { value: 'internal_user_3', label: '内部普通用户3级' }
    ];
  } else if (['external_boss', 'viewer'].includes(currentRole || '')) {
    // 外部老板只能创建外部普通用户
    return [
      { value: 'external_user_1', label: '外部普通用户1级' },
      { value: 'external_user_2', label: '外部普通用户2级' },
      { value: 'external_user_3', label: '外部普通用户3级' }
    ];
  } else if (['external_service', 'user'].includes(currentRole || '')) {
    // 外部客服和用户只能创建普通外部用户
    return [
      { value: 'external_user_1', label: '外部普通用户1级' },
      { value: 'external_user_2', label: '外部普通用户2级' },
      { value: 'external_user_3', label: '外部普通用户3级' }
    ];
  }
  // 其他角色不能创建用户
  return [];
});

// 可编辑的用户角色（根据当前用户角色限制，与创建权限一致）
const getEditableRoles = () => {
  const currentRole = userStore.userInfo?.role;
  if (currentRole === 'admin') {
    // admin可以编辑所有角色
    return [
      { value: 'external_user_1', label: '外部普通用户1级' },
      { value: 'external_user_2', label: '外部普通用户2级' },
      { value: 'external_user_3', label: '外部普通用户3级' },
      { value: 'external_service', label: '外部客服' },
      { value: 'external_boss', label: '外部老板' },
      { value: 'internal_user_1', label: '内部普通用户1级' },
      { value: 'internal_user_2', label: '内部普通用户2级' },
      { value: 'internal_user_3', label: '内部普通用户3级' },
      { value: 'internal_service', label: '内部客服' },
      { value: 'internal_boss', label: '内部老板' },
      { value: 'programmer', label: '程序员' },
      { value: 'clerk', label: '文员' },
      { value: 'sales', label: '销售' }
    ];
  } else if (currentRole === 'clerk') {
    // 文员可以编辑除管理员外的所有角色
    return [
      { value: 'external_user_1', label: '外部普通用户1级' },
      { value: 'external_user_2', label: '外部普通用户2级' },
      { value: 'external_user_3', label: '外部普通用户3级' },
      { value: 'external_service', label: '外部客服' },
      { value: 'external_boss', label: '外部老板' },
      { value: 'internal_user_1', label: '内部普通用户1级' },
      { value: 'internal_user_2', label: '内部普通用户2级' },
      { value: 'internal_user_3', label: '内部普通用户3级' },
      { value: 'internal_service', label: '内部客服' },
      { value: 'internal_boss', label: '内部老板' },
      { value: 'programmer', label: '程序员' },
      { value: 'clerk', label: '文员' },
      { value: 'sales', label: '销售' }
    ];
  } else if (['internal_boss', 'super_viewer'].includes(currentRole || '')) {
    // 内部老板可以编辑内部客服和内部用户
    return [
      { value: 'internal_service', label: '内部客服' },
      { value: 'internal_user_1', label: '内部普通用户1级' },
      { value: 'internal_user_2', label: '内部普通用户2级' },
      { value: 'internal_user_3', label: '内部普通用户3级' },
      { value: 'programmer', label: '程序员' }
    ];
  } else if (['internal_service', 'moderator'].includes(currentRole || '')) {
    // 内部客服只能编辑内部普通用户
    return [
      { value: 'internal_user_1', label: '内部普通用户1级' },
      { value: 'internal_user_2', label: '内部普通用户2级' },
      { value: 'internal_user_3', label: '内部普通用户3级' }
    ];
  } else if (['external_boss', 'viewer'].includes(currentRole || '')) {
    // 外部老板可以编辑外部用户
    return [
      { value: 'external_user_1', label: '外部普通用户1级' },
      { value: 'external_user_2', label: '外部普通用户2级' },
      { value: 'external_user_3', label: '外部普通用户3级' },
      { value: 'external_service', label: '外部客服' }
    ];
  } else if (['external_service', 'user'].includes(currentRole || '')) {
    // 外部客服和用户只能编辑普通外部用户
    return [
      { value: 'external_user_1', label: '外部普通用户1级' },
      { value: 'external_user_2', label: '外部普通用户2级' },
      { value: 'external_user_3', label: '外部普通用户3级' }
    ];
  }
  // 其他角色不能编辑角色
  return [];
};

// 可筛选的角色选项（与可创建的角色权限一致，加上旧角色的兼容性）
const filterableRoles = computed(() => {
  // 直接使用可创建的角色作为可筛选的角色
  return availableRoles.value;
});

// 获取所有可筛选的角色（基于实际用户列表）
const allFilterableRoles = computed(() => {
  // 定义角色权限等级（从高到低，从内到外）
  const rolePriority = {
    'admin': 1,
    'internal_boss': 2,
    'external_boss': 3,
    'internal_service': 4,
    'external_service': 5,
    'programmer': 6,
    'internal_user_1': 7,
    'internal_user_2': 8,
    'internal_user_3': 9,
    'external_user_1': 10,
    'external_user_2': 11,
    'external_user_3': 12
  };

  // 从实际用户列表中提取存在的角色
  const existingRoles = new Set(originalUserList.value.map(user => user.role));

  // 基于可创建的角色和现有用户角色生成筛选选项
  const currentRole = userStore.userInfo?.role;
  let filterableRoles = new Set();

  // 添加可创建的角色
  availableRoles.value.forEach(role => filterableRoles.add(role.value));

  // 添加现有用户中的角色（确保能筛选到所有可见的用户）
  existingRoles.forEach(role => filterableRoles.add(role));

  // 去重处理：移除重复的角色值
  const uniqueRoles = Array.from(filterableRoles);

  // 转换为角色对象数组，并按标签去重
  const roleObjects = uniqueRoles.map((roleValue: string) => {
    const roleLabels: Record<string, string> = {
      'admin': '管理员',
      'internal_boss': '内部老板',
      'external_boss': '外部老板',
      'internal_service': '内部客服',
      'external_service': '外部客服',
      'programmer': '程序员',
      'clerk': '文员',
      'sales': '销售',
      'internal_user_1': '内部普通用户1级',
      'internal_user_2': '内部普通用户2级',
      'internal_user_3': '内部普通用户3级',
      'external_user_1': '外部普通用户1级',
      'external_user_2': '外部普通用户2级',
      'external_user_3': '外部普通用户3级',
      // 移除旧的英文角色标签，避免重复显示
      'internal_user': '内部普通用户1级',
      'external_user': '外部普通用户1级',
      'super_viewer': '内部老板',
      'viewer': '内部普通用户1级',
      'moderator': '内部客服',
      'user': '外部普通用户1级'
    };
    return {
      value: roleValue,
      label: roleLabels[roleValue] || roleValue
    };
  });

  // 按标签去重，确保每个标签只出现一次
  const uniqueByLabel = new Map();
  roleObjects.forEach(role => {
    if (!uniqueByLabel.has(role.label)) {
      uniqueByLabel.set(role.label, role);
    }
  });

  const finalRoleObjects = Array.from(uniqueByLabel.values());

  // 排序角色列表
  return finalRoleObjects.sort((a, b) => {
    const priorityA = rolePriority[a.value] || 999;
    const priorityB = rolePriority[b.value] || 999;
    return priorityA - priorityB;
  });
});

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

// 表单验证计算属性
const createFormValidation = computed(() => ({
  username: {
    isValid: createForm.username.length >= 3 && createForm.username.length <= 50 && /^[a-zA-Z0-9_]+$/.test(createForm.username),
    message: createForm.username && !(/^[a-zA-Z0-9_]+$/.test(createForm.username)) ? '用户名只能包含字母、数字和下划线' :
             createForm.username && (createForm.username.length < 3 || createForm.username.length > 50) ? '用户名长度应在3-50字符之间' : ''
  },
  password: {
    isValid: !createForm.password || createForm.password.length >= 6,
    message: createForm.password && createForm.password.length < 6 ? '密码长度至少6位' : ''
  },
  confirmPassword: {
    isValid: !createForm.confirmPassword || createForm.password === createForm.confirmPassword,
    message: createForm.confirmPassword && createForm.password !== createForm.confirmPassword ? '两次输入的密码不一致' : ''
  },
  name: {
    isValid: createForm.name.trim().length > 0,
    message: createForm.name && !createForm.name.trim() ? '请输入用户姓名' : ''
  }
}));

const editFormValidation = computed(() => ({
  password: {
    isValid: !editForm.password || editForm.password.length >= 6,
    message: editForm.password && editForm.password.length < 6 ? '密码长度至少6位' : ''
  },
  confirmPassword: {
    isValid: !editForm.confirmPassword || editForm.password === editForm.confirmPassword,
    message: editForm.confirmPassword && editForm.password !== editForm.confirmPassword ? '两次输入的密码不一致' : ''
  },
  name: {
    isValid: editForm.name.trim().length > 0,
    message: editForm.name && !editForm.name.trim() ? '请输入用户姓名' : ''
  }
}));

// 表单数据
const createForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  name: '',
  role: 'external_user_1',
  parent_id: ''
});

const editForm = reactive({
  name: '',
  password: '',
  confirmPassword: '',
  role: 'user',
  is_active: true,
  parent_id: ''
});

// 移除表单验证规则，使用自定义验证

// 表格列配置
const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
    width: 60,
    minWidth: 40
  },
  {
    title: '用户名',
    dataIndex: 'username',
    width: 120,
    minWidth: 100,
    ellipsis: true
  },
  {
    title: '姓名',
    dataIndex: 'name',
    width: 120,
    minWidth: 100,
    ellipsis: true
  },
  {
    title: '角色',
    dataIndex: 'role',
    slotName: 'role',
    width: 120,
    minWidth: 100
  },
  {
    title: '创建者',
    dataIndex: 'creator_name',
    width: 120,
    minWidth: 100,
    ellipsis: true
  },
  {
    title: '上级用户',
    dataIndex: 'parent_name',
    slotName: 'parent_name',
    width: 150,
    minWidth: 120,
    ellipsis: true
  },
  {
    title: '最后登录',
    dataIndex: 'last_login_at',
    slotName: 'last_login_at',
    width: 160,
    minWidth: 140,
    ellipsis: true
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    slotName: 'created_at',
    width: 160,
    minWidth: 140,
    ellipsis: true
  },
  {
    title: '操作',
    slotName: 'action',
    width: 150,
    minWidth: 130,
    fixed: 'right'
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
  const currentUserRole = userStore.userInfo?.role;
  const targetUserRole = user.role;
  const currentUserId = Number(userStore.userInfo?.accountId);
  const targetUserId = user.id;

  // 不能编辑自己
  if (targetUserId === currentUserId) {
    return false;
  }

  // 不能编辑管理员
  if (targetUserRole === 'admin') {
    return false;
  }

  // admin可以编辑所有用户
  if (currentUserRole === 'admin') {
    return true;
  }

  // clerk可以编辑所有用户（除了管理员）
  if (currentUserRole === 'clerk') {
    return targetUserRole !== 'admin';
  }

  // internal_boss可以编辑内部和外部用户
  if (currentUserRole === 'internal_boss') {
    return targetUserRole.startsWith('internal_') || targetUserRole.startsWith('external_');
  }

  // internal_service可以编辑内部用户和外部普通用户
  if (currentUserRole === 'internal_service') {
    return targetUserRole === 'internal_user' || targetUserRole === 'external_user';
  }

  // external_boss可以编辑外部用户
  if (currentUserRole === 'external_boss') {
    return targetUserRole.startsWith('external_');
  }

  // external_service可以编辑外部普通用户
  if (currentUserRole === 'external_service') {
    return targetUserRole === 'external_user';
  }

  // 兼容旧角色名称的权限检查 - 旧角色已迁移，但保留向后兼容
  // super_viewer -> internal_boss, moderator -> internal_service, viewer -> internal_user
  const roleStr = currentUserRole as string; // 避免类型检查错误，允许旧角色名
  if (roleStr === 'super_viewer') {
    // super_viewer等同于internal_boss，可以编辑所有内部和外部用户
    return targetUserRole.startsWith('internal_') || targetUserRole.startsWith('external_');
  }

  if (roleStr === 'moderator') {
    // moderator等同于internal_service，可以编辑内部普通用户和外部普通用户
    return targetUserRole === 'internal_user' || targetUserRole === 'external_user';
  }

  if (roleStr === 'viewer') {
    // viewer等同于internal_user，只能编辑外部普通用户（按原有逻辑）
    return targetUserRole === 'external_user';
  }

  // 其他角色不能编辑用户
  return false;
};

const checkCanDeleteUser = (user: UserListItem) => {
  // admin和clerk可以删除用户，且不能删除自己和管理员
  const canDelete = ['admin', 'clerk'].includes(userStore.userInfo?.role || '');
  const isNotSelf = user.id !== Number(userStore.userInfo?.accountId);
  const isNotAdmin = user.role !== 'admin';

  return canDelete && isNotSelf && isNotAdmin;
};

// 检查用户是否可以晋升
const checkCanPromoteUser = (user: UserListItem) => {
  // 只有admin和internal_boss可以晋升用户
  const currentUserRole = userStore.userInfo?.role;
  const canPromote = ['admin', 'internal_boss'].includes(currentUserRole || '');

  if (!canPromote) {
    return false;
  }

  // 用户自己不能晋升自己
  const isNotSelf = user.id !== Number(userStore.userInfo?.accountId);

  // 检查用户是否可以晋升（不是最高等级）
  const promotableRoles = [
    'internal_user_3', 'internal_user_2', 'internal_user_1',
    'external_user_3', 'external_user_2', 'external_user_1'
  ];

  const canUserBePromoted = promotableRoles.includes(user.role);

  return isNotSelf && canUserBePromoted;
};

// 获取角色颜色
const getRoleColor = (role: string) => {
  const colors = {
    admin: 'red',
    internal_boss: 'purple',
    internal_service: 'orange',
    programmer: 'geekblue',
    clerk: 'gold',
    sales: 'volcano',
    internal_user_1: 'blue',
    internal_user_2: 'magenta',
    internal_user_3: 'arcoblue',
    external_boss: 'green',
    external_service: 'cyan',
    external_user_1: 'lime',
    external_user_2: 'green',
    external_user_3: 'lightgreen',
    // 兼容旧角色名称，默认归类为内部
    super_viewer: 'purple',
    viewer: 'blue',
    moderator: 'orange',
    user: 'lime',
    internal_user: 'blue',
    external_user: 'lime'
  };
  return colors[role] || 'default';
};

// 获取角色文本
const getRoleText = (role: string) => {
  const texts = {
    admin: '管理员',
    internal_boss: '内部老板',
    internal_service: '内部客服',
    programmer: '程序员',
    clerk: '文员',
    sales: '销售',
    internal_user_1: '内部普通用户1级',
    internal_user_2: '内部普通用户2级',
    internal_user_3: '内部普通用户3级',
    external_boss: '外部老板',
    external_service: '外部客服',
    external_user_1: '外部普通用户1级',
    external_user_2: '外部普通用户2级',
    external_user_3: '外部普通用户3级',
    // 兼容旧角色名称，默认归类为内部
    super_viewer: '内部老板',
    viewer: '内部普通用户1级',
    moderator: '内部客服',
    user: '外部普通用户1级',
    internal_user: '内部普通用户1级',
    external_user: '外部普通用户1级'
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
    let users = response.data.users;

    // 根据当前用户角色过滤用户列表
    const currentUserRole = userStore.userInfo?.role;
    const currentUserId = Number(userStore.userInfo?.accountId);

    let filteredUsers: any[] = [];
    if (currentUserRole === 'admin' || currentUserRole === 'clerk') {
      // admin和clerk可以看到所有用户
      filteredUsers = users;
    } else if (['internal_boss', 'external_boss', 'internal_service', 'external_service'].includes(currentUserRole || '')) {
      // 老板和客服只能看到自己创建的用户，以及这些用户创建的用户（递归）
      const managedUserIds = getManagedUserIds(users, currentUserId);
      filteredUsers = users.filter(user => managedUserIds.includes(user.id));
    } else {
      // 其他角色看不到用户列表
      filteredUsers = [];
    }

    // 按ID升序排序
    userList.value = filteredUsers.sort((a, b) => a.id - b.id);

    // 递归获取当前用户可以管理的用户ID列表（基于上级关系和创建关系）
    function getManagedUserIds(allUsers: any[], managerId: number): number[] {
      const managedIds = new Set<number>();
      const queue = [managerId];

      while (queue.length > 0) {
        const currentId = queue.shift()!;
        managedIds.add(currentId);

        // 找到所有以下级用户（parent_id等于当前用户ID）
        const subordinates = allUsers.filter(user => Number(user.parent_id) === currentId);
        subordinates.forEach(subordinate => {
          if (!managedIds.has(subordinate.id)) {
            queue.push(subordinate.id);
          }
        });

        // 对于客服角色，还要找到自己创建的用户（created_by等于当前用户ID）
        const currentUserRole = userStore.userInfo?.role;
        if (['internal_service', 'external_service'].includes(currentUserRole || '')) {
          const createdUsers = allUsers.filter(user => Number(user.created_by) === currentId);
          createdUsers.forEach(createdUser => {
            if (!managedIds.has(createdUser.id)) {
              queue.push(createdUser.id);
            }
          });
        }
      }

      return Array.from(managedIds);
    }

    pagination.total = userList.value.length;

    // 保存原始用户列表用于筛选
    originalUserList.value = [...userList.value];

    // 重新应用筛选
    applyFilters();
  } catch (error: any) {
    console.error('加载用户列表失败:', error);

    // 更详细的错误处理
    if (error.code === 'NETWORK_ERROR') {
      Message.error('网络连接失败，请检查网络连接后重试');
    } else if (error.response?.status === 403) {
      Message.error('您没有权限访问用户列表');
    } else if (error.response?.status === 401) {
      Message.error('登录已过期，请重新登录');
      // 可以在这里添加跳转到登录页面的逻辑
    } else if (error.response?.data?.message) {
      Message.error(error.response.data.message);
    } else {
      Message.error('加载用户列表失败，请稍后重试');
    }

    // 清空用户列表
    userList.value = [];
    originalUserList.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
};

// 刷新用户列表
const refreshUserList = () => {
  loadUserList();
};

// 处理搜索变化
const handleSearchChange = () => {
  applyFilters();
};

// 处理角色筛选变化
const handleRoleFilterChange = () => {
  applyFilters();
};


// 应用所有筛选
const applyFilters = () => {
  let filteredUsers = [...originalUserList.value];

  // 应用搜索筛选
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase().trim();
    filteredUsers = filteredUsers.filter(user =>
      user.username.toLowerCase().includes(keyword) ||
      user.name.toLowerCase().includes(keyword)
    );
  }

  // 应用角色筛选
  if (roleFilter.value) {
    filteredUsers = filteredUsers.filter(user => {
      // 检查直接匹配
      if (user.role === roleFilter.value) {
        return true;
      }

      // 检查角色等价性（包括旧角色名称的兼容性映射）
      const roleEquivalences = {
        // 新格式角色与其对应的所有等价角色（包括旧格式）
        'internal_user_1': ['internal_user_1', 'user', 'viewer', 'internal_user'],
        'internal_service': ['internal_service', 'moderator'],
        'internal_boss': ['internal_boss', 'super_viewer'],
        'external_user_1': ['external_user_1', 'external_user'],
        'external_service': ['external_service'],
        'external_boss': ['external_boss'],
        'admin': ['admin'],
        'programmer': ['programmer'],
        'internal_user_2': ['internal_user_2'],
        'internal_user_3': ['internal_user_3'],
        'external_user_2': ['external_user_2'],
        'external_user_3': ['external_user_3'],
        // 旧格式角色与其对应的所有等价角色
        'user': ['internal_user_1', 'user', 'viewer', 'internal_user'],
        'moderator': ['internal_service', 'moderator'],
        'viewer': ['internal_user_1', 'user', 'viewer', 'internal_user'],
        'super_viewer': ['internal_boss', 'super_viewer'],
        'internal_user': ['internal_user_1', 'user', 'viewer', 'internal_user'],
        'external_user': ['external_user_1', 'external_user']
      };

      const equivalentRoles = roleEquivalences[roleFilter.value] || [roleFilter.value];
      return equivalentRoles.includes(user.role);
    });
  }

  userList.value = filteredUsers;
  // 更新分页
  pagination.total = userList.value.length;
  pagination.current = 1; // 重置到第一页
};

// 处理表格变化
const handleTableChange = (newPagination: any) => {
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
  editForm.password = '';
  editForm.confirmPassword = '';
  editForm.role = user.role;
  editForm.is_active = user.is_active;
  editForm.parent_id = user.parent_id ? user.parent_id.toString() : '';

  // 根据当前角色初始化上级用户选择器
  handleEditRoleChange();

  showEditModal.value = true;
};

// 确认删除用户
const confirmDeleteUser = async (user: UserListItem) => {
  // 使用浏览器原生confirm对话框
  const confirmed = confirm(`确定要删除用户 "${user.username}" 吗？\n\n此操作不可撤销，将永久删除该用户及其所有相关数据。`);

  if (confirmed) {
    await handleDeleteUserDirect(user);
  }
};

// 取消删除
const cancelDelete = () => {
  deleteUserInfo.value = null;
  showDeleteModal.value = false;
};

// 确认晋升用户
const confirmPromoteUser = (user: UserListItem) => {
  console.log('🔼 [晋升] 点击晋升按钮，用户:', user.username, '角色:', user.role);
  promoteUserInfo.value = user;
  showPromoteModal.value = true;
  console.log('🔼 [晋升] 晋升对话框状态设为:', showPromoteModal.value);
};

// 取消晋升
const cancelPromote = () => {
  console.log('🔼 [晋升] 取消晋升对话框');
  promoteUserInfo.value = null;
  showPromoteModal.value = false;
};

// 执行用户晋升
const handlePromoteUser = async () => {
  if (!promoteUserInfo.value) {
    console.error('❌ [晋升] 没有选择要晋升的用户');
    return;
  }

  console.log('🔼 [晋升] 开始执行晋升，用户:', promoteUserInfo.value.username);
  promoteLoading.value = true;

  try {
    const response = await promoteUsers({
      userId: promoteUserInfo.value.id,
      promoteSubordinates: promoteWithSubordinates.value
    });

    console.log('✅ [晋升] 晋升成功:', response.data);
    Message.success(`用户晋升成功！共晋升 ${response.data.totalPromoted} 个用户`);
    showPromoteModal.value = false;
    promoteUserInfo.value = null;
    // 重新加载用户列表
    loadUserList();
  } catch (error: any) {
    console.error('❌ [晋升] 晋升失败:', error);
    Message.error('晋升用户失败，请稍后重试');
  } finally {
    promoteLoading.value = false;
  }
};

// 执行删除用户（直接处理）
const handleDeleteUserDirect = async (user: UserListItem) => {
  deleteLoading.value = true;

  try {
    await deleteUser(user.id);
    Message.success('用户删除成功');
    // 刷新用户列表
    loadUserList();
  } catch (error) {
    console.error('删除用户失败:', error);
    Message.error('删除用户失败');
  } finally {
    deleteLoading.value = false;
  }
};

// 执行删除用户（模态框版本，保留以备不时之需）
const handleDeleteUser = async () => {
  if (!deleteUserInfo.value) {
    return;
  }

  deleteLoading.value = true;

  try {
    await deleteUser(deleteUserInfo.value.id);
    Message.success('用户删除成功');
    showDeleteModal.value = false;
    deleteUserInfo.value = null;
    // 刷新用户列表
    loadUserList();
  } catch (error) {
    console.error('删除用户失败:', error);
    Message.error('删除用户失败');
  } finally {
    deleteLoading.value = false;
  }
};

// 移除表单引用，不再需要

// 打开创建用户模态框
const openCreateModal = () => {
  // 重置表单
  createForm.username = '';
  createForm.password = '';
  createForm.confirmPassword = '';
  createForm.name = '';
  createForm.parent_id = '';
  // 设置默认角色为第一个可用的角色
  createForm.role = availableRoles.value.length > 0 ? availableRoles.value[0].value : 'external_user_1';
  showParentSelector.value = false;
  parentOptions.value = [];

  // 根据默认角色初始化上级用户选择器
  handleRoleChange();

  showCreateModal.value = true;
};

// 重置创建表单
const resetCreateForm = () => {
  createForm.username = '';
  createForm.password = '';
  createForm.confirmPassword = '';
  createForm.name = '';
  createForm.parent_id = '';
  // 设置默认角色为第一个可用的角色
  createForm.role = availableRoles.value.length > 0 ? availableRoles.value[0].value : 'external_user_1';
  showParentSelector.value = false;
  parentOptions.value = [];
  showCreateModal.value = false;
};

// 重置编辑表单
const resetEditForm = () => {
  editForm.name = '';
  editForm.password = '';
  editForm.confirmPassword = '';
  editForm.role = 'user';
  editForm.is_active = true;
  editForm.parent_id = '';
  showEditParentSelector.value = false;
  editParentOptions.value = [];
  showEditModal.value = false;
  editUserInfo.value = null;
};

// 处理编辑用户
const handleEditUser = async () => {
  if (!editUserInfo.value) {
    return;
  }

  const currentRole = userStore.userInfo?.role;

  try {
    // 基础表单验证
    if (!editForm.name.trim()) {
      Message.error('请输入用户姓名');
      return;
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
      role: editForm.role,
      is_active: editForm.is_active
    };

    // 如果提供了上级用户ID，则包含在更新数据中
    if (editForm.parent_id && editForm.parent_id.toString().trim()) {
      updateData.parent_id = Number(editForm.parent_id);
    } else {
      // 如果没有选择上级用户，设置为null以清除上级关系
      updateData.parent_id = null;
    }

    // 如果角色发生变化，需要验证上级用户选择
    if (editForm.role !== editUserInfo.value.role) {
      // 检查是否需要上级用户
      const needsParent = ['internal_user_1', 'internal_user_2', 'internal_user_3', 'external_user_1', 'external_user_2', 'external_user_3', 'internal_service', 'external_service'].includes(editForm.role);

      if (needsParent && !editForm.parent_id) {
        Message.error('此角色需要选择上级用户');
        return;
      }
    }

    // 如果提供了密码，则包含在更新数据中
    if (editForm.password.trim()) {
      updateData.password = editForm.password;
    }

    await updateUser(editUserInfo.value.id, updateData);

    Message.success(`用户"${editForm.name}"信息更新成功！`);

    showEditModal.value = false;
    editUserInfo.value = null;

    // 重新加载用户列表
    loadUserList();
  } catch (error: any) {
    console.error('编辑用户失败:', error);

    // 更详细的错误处理
    if (error.code === 'NETWORK_ERROR') {
      Message.error('网络连接失败，请检查网络连接后重试');
    } else if (error.response?.status === 400) {
      // 客户端错误，显示具体的验证错误
      if (error.response.data?.errors) {
        const errorMessages = Object.values(error.response.data.errors).flat();
        Message.error(errorMessages.join('；'));
      } else if (error.response.data?.message) {
        Message.error(error.response.data.message);
      } else {
        Message.error('输入信息有误，请检查后重试');
      }
    } else if (error.response?.status === 403) {
      Message.error('您没有权限编辑此用户');
    } else if (error.response?.status === 404) {
      Message.error('用户不存在，可能已被删除');
      // 刷新列表
      loadUserList();
    } else if (error.response?.status === 409) {
      Message.error('邮箱已被其他用户使用');
    } else if (error.response?.status === 401) {
      Message.error('登录已过期，请重新登录');
    } else if (error.response?.data?.message) {
      Message.error(error.response.data.message);
    } else {
      Message.error('编辑用户失败，请稍后重试');
    }
  } finally {
    editLoading.value = false;
  }
};

// 处理角色变化
const handleRoleChange = async () => {
  const role = createForm.role;

  // 检查是否需要显示上级用户选择器
  if (role === 'internal_user_1' || role === 'internal_user_2' || role === 'internal_user_3' ||
      role === 'external_user_1' || role === 'external_user_2' || role === 'external_user_3' ||
      role === 'internal_service' || role === 'external_service') {
    showParentSelector.value = true;

    // 设置选择器标签和提示
    if (role === 'internal_user_1' || role === 'external_user_1') {
      parentSelectorLabel.value = '上级客服';
      parentSelectorHint.value = '1级用户必须选择客服作为上级';
    } else if (role === 'internal_user_2' || role === 'external_user_2') {
      parentSelectorLabel.value = '上级1级用户';
      parentSelectorHint.value = '2级用户必须选择1级用户作为上级';
    } else if (role === 'internal_user_3' || role === 'external_user_3') {
      parentSelectorLabel.value = '上级2级用户';
      parentSelectorHint.value = '3级用户必须选择2级用户作为上级';
    } else if (role === 'internal_service' || role === 'external_service') {
      parentSelectorLabel.value = '上级老板';
      parentSelectorHint.value = '客服必须选择老板作为上级';
    }

    // 加载上级用户选项
    await loadParentOptions(role);
  } else {
    showParentSelector.value = false;
    createForm.parent_id = '';
    parentOptions.value = [];
  }
};

// 处理编辑角色变化
const handleEditRoleChange = async () => {
  const role = editForm.role;

  // 检查是否需要显示上级用户选择器
  if (role === 'internal_user_1' || role === 'internal_user_2' || role === 'internal_user_3' ||
      role === 'external_user_1' || role === 'external_user_2' || role === 'external_user_3' ||
      role === 'internal_service' || role === 'external_service') {
    showEditParentSelector.value = true;

    // 设置选择器标签和提示
    if (role === 'internal_user_1' || role === 'external_user_1') {
      editParentSelectorLabel.value = '上级客服';
      editParentSelectorHint.value = '1级用户必须选择客服作为上级';
    } else if (role === 'internal_user_2' || role === 'external_user_2') {
      editParentSelectorLabel.value = '上级1级用户';
      editParentSelectorHint.value = '2级用户必须选择1级用户作为上级';
    } else if (role === 'internal_user_3' || role === 'external_user_3') {
      editParentSelectorLabel.value = '上级2级用户';
      editParentSelectorHint.value = '3级用户必须选择2级用户作为上级';
    } else if (role === 'internal_service' || role === 'external_service') {
      editParentSelectorLabel.value = '上级老板';
      editParentSelectorHint.value = '客服必须选择老板作为上级';
    }

    // 加载上级用户选项
    await loadEditParentOptions(role);
  } else {
    showEditParentSelector.value = false;
    editForm.parent_id = '';
    editParentOptions.value = [];
  }
};

// 加载上级用户选项
const loadParentOptions = async (targetRole: string) => {
  loadingParentOptions.value = true;
  try {
    const response = await fetch('/api/user/parent-options?target_role=' + targetRole, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    if (data.code === 20000) {
      parentOptions.value = data.data.parents;
      // 如果只有一个选项，自动选择
      if (parentOptions.value.length === 1) {
        createForm.parent_id = parentOptions.value[0].id.toString();
      }
    } else {
      Message.error(data.message || '加载上级用户选项失败');
      parentOptions.value = [];
    }
  } catch (error) {
    console.error('加载上级用户选项失败:', error);
    Message.error('加载上级用户选项失败');
    parentOptions.value = [];
  } finally {
    loadingParentOptions.value = false;
  }
};

// 加载编辑上级用户选项
const loadEditParentOptions = async (targetRole: string) => {
  loadingEditParentOptions.value = true;
  try {
    const response = await fetch('/api/user/parent-options?target_role=' + targetRole, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    if (data.code === 20000) {
      editParentOptions.value = data.data.parents;
      // 如果只有一个选项，自动选择
      if (editParentOptions.value.length === 1) {
        editForm.parent_id = editParentOptions.value[0].id.toString();
      }
    } else {
      Message.error(data.message || '加载上级用户选项失败');
      editParentOptions.value = [];
    }
  } catch (error) {
    console.error('加载上级用户选项失败:', error);
    Message.error('加载上级用户选项失败');
    editParentOptions.value = [];
  } finally {
    loadingEditParentOptions.value = false;
  }
};

// 处理创建用户
const handleCreateUser = async () => {
  const currentRole = userStore.userInfo?.role;

  // 检查权限：admin、internal_boss、internal_service、external_boss、external_service、clerk可以创建用户
  if (!['admin', 'internal_boss', 'internal_service', 'external_boss', 'external_service', 'super_viewer', 'viewer', 'moderator', 'clerk'].includes(currentRole || '')) {
    Message.error('您没有权限执行此操作');
    return;
  }

  // 检查客服角色创建权限：只有admin、internal_boss、external_boss可以创建客服角色
  if ((createForm.role === 'internal_service' || createForm.role === 'external_service') &&
      !['admin', 'internal_boss', 'external_boss'].includes(currentRole || '')) {
    Message.error('只有管理员和老板可以创建客服角色');
    return;
  }

  // 检查internal_service只能创建internal_user角色
  if (['internal_service', 'moderator'].includes(currentRole || '') && !createForm.role.startsWith('internal_user_')) {
    Message.error('您只能创建内部普通用户账号');
    return;
  }

  // 检查external_boss只能创建external_开头的角色
  if (['external_boss', 'viewer'].includes(currentRole || '') && !createForm.role.startsWith('external_')) {
    Message.error('您只能创建外部用户账号');
    return;
  }

  // 检查external_service只能创建external_user角色
  if (['external_service', 'user'].includes(currentRole || '') && !createForm.role.startsWith('external_user_')) {
    Message.error('您只能创建外部普通用户账号');
    return;
  }


  // 检查上级用户选择
  if (showParentSelector.value && !createForm.parent_id) {
    Message.error('请选择上级用户');
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
      created_by: currentUser?.accountId ? Number(currentUser.accountId) : undefined,
      parent_id: createForm.parent_id ? Number(createForm.parent_id) : undefined
    };

    await createUser(userDataWithCreator);

    Message.success({
      content: `用户"${createForm.name}"创建成功！`,
      duration: 3000
    });

    // 显示用户凭据信息（隐藏密码）
    setTimeout(() => {
      Message.info({
        content: `用户名: ${createForm.username}\n密码: ******`,
        duration: 5000
      });
    }, 500);

    showCreateModal.value = false;
    resetCreateForm();

    // 重新加载用户列表以获取完整的用户数据（包括正确的ID）
    loadUserList();
  } catch (error: any) {
    console.error('创建用户失败:', error);

    // 更详细的错误处理
    if (error.code === 'NETWORK_ERROR') {
      Message.error('网络连接失败，请检查网络连接后重试');
    } else if (error.response?.status === 400) {
      // 客户端错误，显示具体的验证错误
      if (error.response.data?.errors) {
        const errorMessages = Object.values(error.response.data.errors).flat();
        Message.error(errorMessages.join('；'));
      } else if (error.response.data?.message) {
        Message.error(error.response.data.message);
      } else {
        Message.error('输入信息有误，请检查后重试');
      }
    } else if (error.response?.status === 403) {
      Message.error('您没有权限创建此类型的用户');
    } else if (error.response?.status === 409) {
      Message.error('用户名已存在，请选择其他用户名');
    } else if (error.response?.status === 401) {
      Message.error('登录已过期，请重新登录');
    } else if (error.response?.data?.message) {
      Message.error(error.response.data.message);
    } else {
      Message.error('创建用户失败，请稍后重试');
    }
  } finally {
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
  padding: 24px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
  animation: fadeIn 0.6s ease-out;
}

.page-header {
  margin-bottom: 32px;
  background: linear-gradient(135deg, #fff 0%, #f8f9ff 100%);
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(102, 126, 234, 0.1);
  animation: slideInFromTop 0.8s ease-out;

  h2 {
    margin: 0 0 12px 0;
    font-size: 32px;
    font-weight: 700;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    display: flex;
    align-items: center;
    gap: 12px;

    &::before {
      content: "👥";
      font-size: 36px;
    }
  }

  p {
    margin: 0;
    color: #86909c;
    font-size: 16px;
    font-weight: 400;
  }
}

.action-bar {
  margin-bottom: 24px;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: center;
  animation: slideInFromLeft 0.8s ease-out 0.2s both;

  :deep(.arco-btn) {
    border-radius: 12px;
    font-weight: 600;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }
  }
}


.delete-confirm {
  .warning-text {
    color: var(--color-warning-6);
    margin: 8px 0 0 0;
    font-size: 14px;
  }
}

/* 晋升相关样式暂时隐藏，保留代码以便以后恢复 */
/*
.promote-confirm {
  .promote-options {
    margin: 16px 0;
    padding: 12px;
    background: #f6ffed;
    border-radius: 6px;
    border: 1px solid #b7eb8f;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 14px;
    color: #1d2129;
    font-weight: 500;
  }

  .checkbox-input {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }

  .promote-hint {
    display: block;
    margin-top: 8px;
    color: #52c41a;
    font-size: 12px;
    line-height: 1.4;
  }

  .promote-warning {
    margin-top: 12px;
    padding: 8px;
    background: #fff7e6;
    border: 1px solid #ffd591;
    border-radius: 4px;

    .warning-text {
      color: #d46b08;
      margin: 0;
      font-size: 13px;
      font-weight: 500;
    }
  }
}
*/

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
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

.modal-content {
  background: linear-gradient(135deg, #fff 0%, #f8f9ff 100%);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  max-width: 520px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid rgba(102, 126, 234, 0.1);
  animation: slideInScale 0.4s ease-out;
}

.modal-header {
  padding: 24px 32px;
  border-bottom: 1px solid rgba(102, 126, 234, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #1d2129;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.modal-close {
  background: rgba(102, 126, 234, 0.1);
  border: none;
  font-size: 20px;
  color: #667eea;
  cursor: pointer;
  padding: 8px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(102, 126, 234, 0.2);
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    transform-origin: center;
  }
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
  margin-bottom: 20px;
}

.form-item label {
  display: block;
  font-weight: 600;
  color: #1d2129;
  margin-bottom: 8px;
  font-size: 14px;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e5e6eb;
  border-radius: 12px;
  font-size: 14px;
  transition: all 0.3s ease;
  background: white;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    transform: translateY(-1px);
  }

  &.error {
    border-color: #ff4d4f;

    &:focus {
      border-color: #ff4d4f;
      box-shadow: 0 0 0 3px rgba(255, 77, 79, 0.1);
    }
  }

  &::placeholder {
    color: #c9cdd4;
  }
}

.form-input select {
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.75rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
}

.stats-section {
  margin-bottom: 24px;
  background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%);
  border-radius: 12px;
  padding: 16px 24px;
  border: 1px solid rgba(102, 126, 234, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.stats-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.total-count {
  font-size: 16px;
  color: #1d2129;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.total-count::before {
  content: "📊";
  font-size: 18px;
}

/* 按钮样式 */
.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.btn-secondary {
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
  color: #4e5969;
  border: 1px solid #d9d9d9;
}

.btn-secondary:hover:not(:disabled) {
  background: linear-gradient(135deg, #e8e8e8 0%, #d0d0d0 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.filter-section {
  margin-bottom: 24px;
}

.filter-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: end;
}

.filter-item {
  display: flex;
  flex-direction: column;
  min-width: 200px;
}

.filter-item label {
  font-weight: 600;
  color: #1d2129;
  margin-bottom: 8px;
  font-size: 14px;
}

.filter-select {
  width: 100%;
  height: 40px; /* 明确设置高度，与Arco Input组件一致 */
  padding: 8px 16px; /* 调整padding以配合高度 */
  border: 2px solid #e5e6eb;
  border-radius: 12px;
  font-size: 14px;
  transition: all 0.3s ease;
  background: white;
  cursor: pointer;
  box-sizing: border-box; /* 确保padding不影响总高度 */

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    transform: translateY(-1px);
  }
}

.search-input {
  width: 100%;
  height: 40px; /* 确保与下拉框高度一致 */
}


/* 空状态样式 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-text h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1d2129;
}

.empty-text p {
  margin: 0 0 24px 0;
  color: #86909c;
  font-size: 14px;
  line-height: 1.5;
}

.empty-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

/* 表格响应式样式 */
:deep(.arco-table) {
  .arco-table-td {
    padding: 12px 8px;
  }

  .arco-table-th {
    padding: 12px 8px;
    font-weight: 600;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  }
}

/* 小屏幕优化 */
@media (max-width: 768px) {
  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-item {
    min-width: auto;
    margin-bottom: 12px;
  }

  .action-bar {
    flex-direction: column;
    align-items: stretch;
  }

}

@media (max-width: 576px) {
  .container {
    padding: 16px;
  }

  .page-header {
    padding: 20px;
  }

  .page-header h2 {
    font-size: 24px;
  }

  :deep(.arco-table) {
    font-size: 12px;

    .arco-table-td,
    .arco-table-th {
      padding: 8px 4px;
    }
  }
}

/* 动画关键帧 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideInFromTop {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInFromLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInScale {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>