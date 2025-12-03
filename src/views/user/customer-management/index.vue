<template>
  <div class="container">
    <Breadcrumb :items="['menu.user', 'menu.user.customer']" />

    <!-- 页面标题 -->
    <div class="page-header">
      <h2>客户管理</h2>
      <p>管理系统中的客户信息</p>
    </div>

    <!-- 数据统计 -->
    <div class="stats-section">
      <div class="stats-info">
        <div class="total-count">系统中共有 {{ customerList.length }} 个客户</div>
      </div>
    </div>

    <!-- 操作栏 -->
    <div class="action-bar">
      <!-- 只有管理员和销售可以创建客户，文员只能查看 -->
      <a-button
        v-if="canCreateCustomer"
        type="primary"
        @click="openCreateModal"
      >
        <template #icon>
          <icon-plus />
        </template>
        新增客户
      </a-button>
      <a-button @click="refreshCustomerList">
        <template #icon>
          <icon-refresh />
        </template>
        刷新
      </a-button>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-section">
      <div class="filter-row">
        <div class="filter-item">
          <label>搜索客户：</label>
          <a-input
            v-model="searchKeyword"
            @input="handleSearchChange"
            placeholder="输入客户姓名或公司"
            class="search-input"
            allow-clear
          >
            <template #prefix>
              <icon-search />
            </template>
          </a-input>
        </div>
        <div class="filter-item">
          <label>签单人：</label>
          <select
            v-model="salesFilter"
            @change="handleSalesFilterChange"
            class="filter-select"
          >
            <option value="">全部</option>
            <option value="unassigned">未分配</option>
            <option value="袁">袁</option>
            <option value="赵">赵</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 客户列表 -->
    <a-table
      :columns="columns"
      :data="customerList"
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
            <h3>暂无客户数据</h3>
            <p>
              {{ searchKeyword || salesFilter ? '没有找到符合条件的客户' : '系统中还没有客户数据' }}
            </p>
            <div v-if="searchKeyword || salesFilter" class="empty-actions">
              <a-button type="primary" @click="refreshCustomerList">
                刷新数据
              </a-button>
            </div>
            <div v-else-if="canCreateCustomer" class="empty-actions">
              <a-button type="primary" @click="openCreateModal">
                创建第一个客户
              </a-button>
            </div>
          </div>
        </div>
      </template>

      <template #type="{ record }">
        <a-tag
          :color="record.type === 'company' ? 'blue' : 'green'"
          size="small"
        >
          {{ record.type === 'company' ? '企业客户' : '个人客户' }}
        </a-tag>
      </template>

      <template #signer_name="{ record }">
        {{ record.signer_name || record.sales_name || '未分配' }}
      </template>

      <template #status="{ record }">
        <a-tag
          :color="getStatusColor(record.status)"
          size="small"
        >
          {{ getStatusText(record.status) }}
        </a-tag>
      </template>

      <template #created_at="{ record }">
        {{ formatDate(record.created_at) }}
      </template>

      <template #action="{ record }">
        <a-space>
          <a-button
            v-if="canEditCustomer(record)"
            type="text"
            size="small"
            @click="() => editCustomer(record)"
          >
            <template #icon>
              <icon-edit />
            </template>
            编辑
          </a-button>
          <a-button
            v-if="canDeleteCustomer(record)"
            type="text"
            size="small"
            danger
            @click="() => { console.log('🖱️ 删除按钮被点击，记录:', record); confirmDeleteCustomer(record); }"
          >
            <template #icon>
              <icon-delete />
            </template>
            删除
          </a-button>
        </a-space>
      </template>
    </a-table>

    <!-- 新增客户模态框 -->
    <div v-if="showCreateModal && canCreateCustomer" class="modal-overlay">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>新增客户</h3>
          <button @click="resetCreateForm" class="modal-close">&times;</button>
        </div>

        <div class="modal-body">
          <div class="form-item">
            <label>客户姓名</label>
            <input
              v-model="createForm.name"
              type="text"
              placeholder="输入客户姓名"
              class="form-input"
              :class="{ 'error': createForm.name && !createFormValidation.name.isValid }"
            />
            <small v-if="createForm.name && !createFormValidation.name.isValid" style="color: #ff4d4f; margin-top: 4px;">
              {{ createFormValidation.name.message }}
            </small>
          </div>

          <div class="form-item">
            <label>联系电话</label>
            <input
              v-model="createForm.phone"
              type="text"
              placeholder="输入联系电话"
              class="form-input"
              :class="{ 'error': createForm.phone && !createFormValidation.phone.isValid }"
            />
            <small v-if="createForm.phone && !createFormValidation.phone.isValid" style="color: #ff4d4f; margin-top: 4px;">
              {{ createFormValidation.phone.message }}
            </small>
          </div>

          <div class="form-item">
            <label>游戏数量</label>
            <input
              v-model="createForm.game_count"
              type="number"
              placeholder="输入游戏数量"
              class="form-input"
              min="0"
            />
          </div>

          <div class="form-item">
            <label>游戏类型</label>
            <input
              v-model="createForm.game_type"
              type="text"
              placeholder="输入游戏类型"
              class="form-input"
            />
          </div>

          <div class="form-item">
            <label>签单人</label>
            <select
              v-model="createForm.signer_name"
              class="form-input"
            >
              <option value="">请选择签单人</option>
              <option value="袁">袁</option>
              <option value="赵">赵</option>
            </select>
          </div>

          <div class="form-item">
            <label>收款主体</label>
            <input
              v-model="createForm.payment_entity"
              type="text"
              placeholder="输入收款主体"
              class="form-input"
            />
          </div>

          <div class="form-item">
            <label>金额</label>
            <input
              v-model="createForm.amount"
              type="number"
              placeholder="输入金额"
              class="form-input"
              step="0.01"
              min="0"
            />
          </div>

          <div class="form-item">
            <label>地址</label>
            <input
              v-model="createForm.address"
              type="text"
              placeholder="输入客户地址"
              class="form-input"
            />
          </div>

          <div class="form-item">
            <label>备注</label>
            <textarea
              v-model="createForm.notes"
              placeholder="输入客户备注信息"
              class="form-input"
              rows="3"
            ></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="resetCreateForm" class="btn btn-secondary" :disabled="createLoading">取消</button>
          <button
            @click="handleCreateCustomer"
            :disabled="!createForm.name || !createForm.phone || createLoading"
            class="btn btn-primary"
          >
            {{ createLoading ? '创建中...' : '创建客户' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 编辑客户模态框 -->
    <div v-if="showEditModal && editCustomerInfo" class="modal-overlay">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>编辑客户</h3>
          <button @click="resetEditForm" class="modal-close">&times;</button>
        </div>

        <div class="modal-body">
          <div class="form-item">
            <label>客户姓名</label>
            <input
              v-model="editForm.name"
              type="text"
              placeholder="输入客户姓名"
              class="form-input"
              :class="{ 'error': editForm.name && !editFormValidation.name.isValid }"
            />
            <small v-if="editForm.name && !editFormValidation.name.isValid" style="color: #ff4d4f; margin-top: 4px;">
              {{ editFormValidation.name.message }}
            </small>
          </div>

          <div class="form-item">
            <label>联系电话</label>
            <input
              v-model="editForm.phone"
              type="text"
              placeholder="输入联系电话"
              class="form-input"
              :class="{ 'error': editForm.phone && !editFormValidation.phone.isValid }"
            />
            <small v-if="editForm.phone && !editFormValidation.phone.isValid" style="color: #ff4d4f; margin-top: 4px;">
              {{ editFormValidation.phone.message }}
            </small>
          </div>

          <div class="form-item">
            <label>游戏数量</label>
            <input
              v-model="editForm.game_count"
              type="number"
              placeholder="输入游戏数量"
              class="form-input"
              min="0"
            />
          </div>

          <div class="form-item">
            <label>游戏类型</label>
            <input
              v-model="editForm.game_type"
              type="text"
              placeholder="输入游戏类型"
              class="form-input"
            />
          </div>

          <div class="form-item">
            <label>签单人</label>
            <select
              v-model="editForm.signer_name"
              class="form-input"
            >
              <option value="">请选择签单人</option>
              <option value="袁">袁</option>
              <option value="赵">赵</option>
            </select>
          </div>

          <div class="form-item">
            <label>收款主体</label>
            <input
              v-model="editForm.payment_entity"
              type="text"
              placeholder="输入收款主体"
              class="form-input"
            />
          </div>

          <div class="form-item">
            <label>金额</label>
            <input
              v-model="editForm.amount"
              type="number"
              placeholder="输入金额"
              class="form-input"
              step="0.01"
              min="0"
            />
          </div>

          <div class="form-item">
            <label>地址</label>
            <input
              v-model="editForm.address"
              type="text"
              placeholder="输入客户地址"
              class="form-input"
            />
          </div>

          <div class="form-item">
            <label>备注</label>
            <textarea
              v-model="editForm.notes"
              placeholder="输入客户备注信息"
              class="form-input"
              rows="3"
            ></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="resetEditForm" class="btn btn-secondary" :disabled="editLoading">取消</button>
          <button
            @click="handleEditCustomer"
            :disabled="!editForm.name || !editForm.phone || editLoading"
            class="btn btn-primary"
          >
            {{ editLoading ? '保存中...' : '保存修改' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 删除确认对话框 -->
    <div v-if="showDeleteModal" class="modal-overlay">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>确认删除</h3>
          <button @click="() => { console.log('❌ 关闭按钮被点击'); cancelDelete(); }" class="modal-close">&times;</button>
        </div>

        <div class="modal-body">
          <div class="delete-confirm">
            <p>确定要删除客户 <strong>{{ deleteCustomerInfo?.name }}</strong> 吗？</p>
            <p class="warning-text">此操作不可撤销，将永久删除该客户及其所有相关数据。</p>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="() => { console.log('❌ 取消删除按钮被点击'); cancelDelete(); }" class="btn btn-secondary" :disabled="deleteLoading">取消</button>
          <button
            @click="() => { console.log('✅ 确认删除按钮被点击'); handleDeleteCustomer(); }"
            :disabled="deleteLoading"
            class="btn btn-danger"
          >
            {{ deleteLoading ? '删除中...' : '确认删除' }}
          </button>
        </div>
      </div>
    </div>
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
  IconSearch
} from '@arco-design/web-vue/es/icon';
import useUserStore from '@/store/modules/user';
import Breadcrumb from '@/components/breadcrumb/index.vue';

// 响应式数据
const loading = ref(false);
const createLoading = ref(false);
const deleteLoading = ref(false);
const editLoading = ref(false);
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const customerList = ref<any[]>([]);
const deleteCustomerInfo = ref<any | null>(null);
const editCustomerInfo = ref<any | null>(null);

// 筛选相关
const salesFilter = ref('');
const searchKeyword = ref('');
const originalCustomerList = ref<any[]>([]); // 保存原始客户列表

// 签单人选项（硬编码）
const signerOptions = ['袁', '赵'];

// 用户Store
const userStore = useUserStore();

// 权限检查
const canCreateCustomer = computed(() => {
  const role = userStore.userInfo?.role;
  return ['admin', 'sales'].includes(role || ''); // 只有管理员和销售可以创建客户，文员只能查看
});

const canViewCustomers = computed(() => ['admin', 'clerk', 'sales'].includes(userStore.userInfo?.role || ''));

// 表单验证计算属性
const createFormValidation = computed(() => ({
  name: {
    isValid: createForm.name.trim().length > 0,
    message: createForm.name && !createForm.name.trim() ? '请输入客户姓名' : ''
  },
  phone: {
    isValid: /^1[3-9]\d{9}$/.test(createForm.phone),
    message: createForm.phone && !(/^1[3-9]\d{9}$/.test(createForm.phone)) ? '请输入正确的手机号码' : ''
  }
}));

const editFormValidation = computed(() => ({
  name: {
    isValid: editForm.name.trim().length > 0,
    message: editForm.name && !editForm.name.trim() ? '请输入客户姓名' : ''
  },
  phone: {
    isValid: /^1[3-9]\d{9}$/.test(editForm.phone),
    message: editForm.phone && !(/^1[3-9]\d{9}$/.test(editForm.phone)) ? '请输入正确的手机号码' : ''
  }
}));

// 表单数据
const createForm = reactive({
  name: '',
  address: '',
  phone: '',
  game_count: '',
  game_type: '',
  signer_name: '',
  payment_entity: '',
  amount: '',
  notes: ''
});

const editForm = reactive({
  name: '',
  address: '',
  phone: '',
  game_count: '',
  game_type: '',
  signer_name: '',
  payment_entity: '',
  amount: '',
  notes: ''
});

// 表格列配置
const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
    width: 60,
    minWidth: 40
  },
  {
    title: '客户姓名',
    dataIndex: 'name',
    width: 120,
    minWidth: 100,
    ellipsis: true
  },
  {
    title: '联系电话',
    dataIndex: 'phone',
    width: 130,
    minWidth: 110
  },
  {
    title: '游戏数量',
    dataIndex: 'game_count',
    width: 100,
    minWidth: 80
  },
  {
    title: '游戏类型',
    dataIndex: 'game_type',
    width: 120,
    minWidth: 100,
    ellipsis: true
  },
  {
    title: '签单人',
    dataIndex: 'signer_name',
    width: 100,
    minWidth: 80,
    ellipsis: true
  },
  {
    title: '收款主体',
    dataIndex: 'payment_entity',
    width: 120,
    minWidth: 100,
    ellipsis: true
  },
  {
    title: '金额',
    dataIndex: 'amount',
    width: 100,
    minWidth: 80,
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
    title: '地址',
    dataIndex: 'address',
    width: 150,
    minWidth: 120,
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
const canEditCustomer = (customer: any) => {
  const currentUserRole = userStore.userInfo?.role;

  // 管理员可以编辑所有客户
  if (currentUserRole === 'admin') {
    return true;
  }

  // 文员只能查看，不能编辑
  if (currentUserRole === 'clerk') {
    return false;
  }

  // 销售可以编辑客户（签单人字段已改为直接存储姓名）
  if (currentUserRole === 'sales') {
    return true;
  }

  return false;
};

const canDeleteCustomer = (customer: any) => {
  const currentUserRole = userStore.userInfo?.role;

  console.log('DEBUG: canDeleteCustomer called', {
    customer,
    currentUserRole,
    customerSignerName: customer.signer_name
  });

  // 管理员可以删除所有客户
  if (currentUserRole === 'admin') {
    console.log('DEBUG: Admin can delete customer');
    return true;
  }

  // 销售可以删除客户
  if (currentUserRole === 'sales') {
    console.log('DEBUG: Sales can delete customer');
    return true;
  }

  // 文员只能查看，不能删除
  if (currentUserRole === 'clerk') {
    console.log('DEBUG: Clerk cannot delete customer');
    return false;
  }

  console.log('DEBUG: No matching role, cannot delete');
  return false;
};

// 获取状态颜色
const getStatusColor = (status: string) => {
  const colors = {
    active: 'green',
    inactive: 'red',
    potential: 'orange'
  };
  return colors[status] || 'default';
};

// 获取状态文本
const getStatusText = (status: string) => {
  const texts = {
    active: '活跃',
    inactive: '非活跃',
    potential: '潜在客户'
  };
  return texts[status] || status;
};

// 格式化日期
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN');
};

// 加载客户列表
const loadCustomerList = async () => {
  loading.value = true;
  try {
    // 调用真实API
    const response = await fetch('/api/customer/list', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      customerList.value = data.data.customers || [];
      console.log('DEBUG: Loaded customer list:', customerList.value);
    } else {
      const errorData = await response.json();
      console.error('加载客户列表失败:', errorData);
      Message.error(errorData.message || '加载客户列表失败');
      customerList.value = [];
    }

    pagination.total = customerList.value.length;
    originalCustomerList.value = [...customerList.value];
    applyFilters();
  } catch (error) {
    console.error('加载客户列表失败:', error);
    Message.error('加载客户列表失败，请检查网络连接');
    customerList.value = [];
    originalCustomerList.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
};


// 刷新客户列表
const refreshCustomerList = () => {
  loadCustomerList();
};

// 处理搜索变化
const handleSearchChange = () => {
  applyFilters();
};

// 处理销售筛选变化
const handleSalesFilterChange = () => {
  applyFilters();
};

// 应用所有筛选
const applyFilters = () => {
  let filteredCustomers = [...originalCustomerList.value];

  // 应用搜索筛选
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase().trim();
    filteredCustomers = filteredCustomers.filter(customer =>
      customer.name.toLowerCase().includes(keyword)
    );
  }

  // 应用签单人筛选
  if (salesFilter.value) {
    if (salesFilter.value === 'unassigned') {
      // 未分配：signer_name为空或null
      filteredCustomers = filteredCustomers.filter(customer => !customer.signer_name || customer.signer_name.trim() === '');
    } else {
      // 指定签单人
      filteredCustomers = filteredCustomers.filter(customer => customer.signer_name === salesFilter.value);
    }
  }

  customerList.value = filteredCustomers;
  pagination.total = customerList.value.length;
  pagination.current = 1;
};

// 处理表格变化
const handleTableChange = (newPagination: any) => {
  pagination.current = newPagination.current;
  pagination.pageSize = newPagination.pageSize;
};

// 编辑客户
const editCustomer = (customer: any) => {
  console.log('DEBUG: editCustomer called with customer:', customer);
  console.log('DEBUG: customer.signer_name:', customer.signer_name, 'customer.sales_name:', customer.sales_name);

  editCustomerInfo.value = customer;

  // 填充编辑表单
  editForm.name = customer.name;
  editForm.address = customer.address || '';
  editForm.phone = customer.phone;
  editForm.game_count = customer.game_count || '';
  editForm.game_type = customer.game_type || '';
  editForm.signer_name = customer.signer_name || customer.sales_name || '';
  editForm.payment_entity = customer.payment_entity || '';
  editForm.amount = customer.amount || '';
  editForm.notes = customer.notes || '';

  console.log('DEBUG: editForm.signer_name set to:', editForm.signer_name);

  showEditModal.value = true;
};

// 确认删除客户
const confirmDeleteCustomer = (customer: any) => {
  console.log('DEBUG: confirmDeleteCustomer called', {
    customer,
    customerId: customer.id,
    customerName: customer.name
  });
  deleteCustomerInfo.value = customer;
  showDeleteModal.value = true;
  console.log('DEBUG: Delete modal should now be visible');
};

// 取消删除
const cancelDelete = () => {
  deleteCustomerInfo.value = null;
  showDeleteModal.value = false;
};

// 执行删除客户
const handleDeleteCustomer = async () => {
  console.log('DEBUG: handleDeleteCustomer called', {
    deleteCustomerInfo: deleteCustomerInfo.value,
    customerId: deleteCustomerInfo.value?.id
  });

  if (!deleteCustomerInfo.value) {
    console.log('DEBUG: No customer info to delete');
    return;
  }

  deleteLoading.value = true;
  console.log('DEBUG: Set deleteLoading to true');

  try {
    const token = localStorage.getItem('token');
    console.log('DEBUG: Token from localStorage:', token ? 'exists' : 'null');

    // 调用真实API
    const apiUrl = `/api/customer/delete/${deleteCustomerInfo.value.id}`;
    console.log('DEBUG: Making API call to:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('DEBUG: API response status:', response.status);
    console.log('DEBUG: API response ok:', response.ok);

    if (response.ok) {
      const data = await response.json();
      console.log('DEBUG: API response data:', data);
      Message.success('客户删除成功');
      showDeleteModal.value = false;
      deleteCustomerInfo.value = null;
      loadCustomerList();
    } else {
      const errorData = await response.json();
      console.log('DEBUG: API error response:', errorData);
      Message.error(errorData.message || '删除客户失败');
    }
  } catch (error) {
    console.error('删除客户失败:', error);
    Message.error('删除客户失败，请重试');
  } finally {
    deleteLoading.value = false;
    console.log('DEBUG: Set deleteLoading to false');
  }
};

// 打开创建客户模态框
const openCreateModal = () => {
  resetCreateForm();
  showCreateModal.value = true;
};

// 重置创建表单
const resetCreateForm = () => {
  createForm.name = '';
  createForm.address = '';
  createForm.phone = '';
  createForm.game_count = '';
  createForm.game_type = '';
  createForm.signer_name = '';
  createForm.payment_entity = '';
  createForm.amount = '';
  createForm.notes = '';
  showCreateModal.value = false;
};

// 重置编辑表单
const resetEditForm = () => {
  editForm.name = '';
  editForm.address = '';
  editForm.phone = '';
  editForm.game_count = '';
  editForm.game_type = '';
  editForm.signer_name = '';
  editForm.payment_entity = '';
  editForm.amount = '';
  editForm.notes = '';
  showEditModal.value = false;
  editCustomerInfo.value = null;
};

// 处理创建客户
const handleCreateCustomer = async () => {
  try {
    // 表单验证
    if (!createForm.name.trim()) {
      Message.error('请输入客户姓名或公司名称');
      return;
    }

    if (!createForm.phone) {
      Message.error('请输入联系电话');
      return;
    }

    if (!/^1[3-9]\d{9}$/.test(createForm.phone)) {
      Message.error('请输入正确的手机号码');
      return;
    }

    createLoading.value = true;

    // 构建请求数据
    const requestData = {
      name: createForm.name.trim(),
      address: createForm.address.trim(),
      phone: createForm.phone.trim(),
      game_count: createForm.game_count ? parseInt(createForm.game_count) : null,
      game_type: createForm.game_type.trim(),
      signer_name: createForm.signer_name || null,
      payment_entity: createForm.payment_entity.trim(),
      amount: createForm.amount ? parseFloat(createForm.amount) : null,
      notes: createForm.notes.trim()
    };

    console.log('DEBUG: createForm.signer_name:', createForm.signer_name, 'type:', typeof createForm.signer_name);
    console.log('DEBUG: requestData.signer_name:', requestData.signer_name, 'type:', typeof requestData.signer_name);
    console.log('DEBUG: full requestData:', requestData);

    // 调用真实API
    const response = await fetch('/api/customer/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });

    if (response.ok) {
      const data = await response.json();
      Message.success('客户创建成功');
      showCreateModal.value = false;
      resetCreateForm();
      loadCustomerList();
    } else {
      const errorData = await response.json();
      Message.error(errorData.message || '创建客户失败');
    }
  } catch (error) {
    console.error('创建客户失败:', error);
    Message.error('创建客户失败，请重试');
  } finally {
    createLoading.value = false;
  }
};

// 处理编辑客户
const handleEditCustomer = async () => {
  console.log('DEBUG: handleEditCustomer called');
  console.log('DEBUG: editForm.signer_name before processing:', editForm.signer_name, 'type:', typeof editForm.signer_name);

  if (!editCustomerInfo.value) {
    return;
  }

  try {
    // 表单验证
    if (!editForm.name.trim()) {
      Message.error('请输入客户姓名或公司名称');
      return;
    }

    if (!editForm.phone) {
      Message.error('请输入联系电话');
      return;
    }

    if (!/^1[3-9]\d{9}$/.test(editForm.phone)) {
      Message.error('请输入正确的手机号码');
      return;
    }

    editLoading.value = true;

    // 构建请求数据
    const requestData = {
      name: editForm.name.trim(),
      address: editForm.address.trim(),
      phone: editForm.phone.trim(),
      game_count: editForm.game_count ? parseInt(editForm.game_count) : null,
      game_type: editForm.game_type.trim(),
      signer_name: editForm.signer_name || null,
      payment_entity: editForm.payment_entity.trim(),
      amount: editForm.amount ? parseFloat(editForm.amount) : null,
      notes: editForm.notes.trim()
    };

    console.log('DEBUG: requestData.signer_name:', requestData.signer_name, 'type:', typeof requestData.signer_name);
    console.log('DEBUG: full requestData:', requestData);

    // 调用真实API
    const response = await fetch(`/api/customer/update/${editCustomerInfo.value.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });

    console.log('DEBUG: API response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('DEBUG: API response data:', data);
      Message.success('客户信息更新成功');
      showEditModal.value = false;
      editCustomerInfo.value = null;
      loadCustomerList();
    } else {
      const errorData = await response.json();
      console.log('DEBUG: API error response:', errorData);
      Message.error(errorData.message || '更新客户信息失败');
    }
  } catch (error) {
    console.error('编辑客户失败:', error);
    Message.error('编辑客户失败，请重试');
  } finally {
    editLoading.value = false;
  }
};

// 组件挂载时加载数据
onMounted(() => {
  // 检查用户权限
  if (!canViewCustomers.value) {
    Message.error('您没有权限访问此页面');
    return;
  }

  loadCustomerList();
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
      content: "🤝";
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
  height: 40px;
  padding: 8px 16px;
  border: 2px solid #e5e6eb;
  border-radius: 12px;
  font-size: 14px;
  transition: all 0.3s ease;
  background: white;
  cursor: pointer;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    transform: translateY(-1px);
  }
}

.search-input {
  width: 100%;
  height: 40px;
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

.form-input textarea {
  resize: vertical;
  min-height: 80px;
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

.delete-confirm {
  .warning-text {
    color: var(--color-warning-6);
    margin: 8px 0 0 0;
    font-size: 14px;
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