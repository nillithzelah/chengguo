<template>
  <div class="container">
    <Breadcrumb :items="['menu.user', 'menu.user.game.user']" />

    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-content">
        <div>
          <h2>用户游戏管理</h2>
          <p>查看和管理用户拥有的游戏权限</p>
        </div>
        <div class="header-actions">
          <!-- 隐藏新增游戏应用按钮，只有管理员可见 -->
          <button
            v-if="userStore.userInfo?.role === 'admin'"
            @click="openAddGameModal"
            :disabled="!selectedUserId || selectedUserId === ''"
            class="btn btn-primary"
          >
            新增游戏应用
          </button>
        </div>
      </div>
    </div>

    <!-- 用户选择器 -->
    <div class="user-selector">
      <div class="selector-item">
        <label>选择用户：</label>
        <select
          v-model="selectedUserId"
          @change="handleUserChange"
          :disabled="userLoading"
          class="user-select"
        >
          <option value="" disabled>请选择用户</option>
          <option
            v-for="user in userList"
            :key="user.id"
            :value="user.id"
          >
            {{ user.name }} ({{ user.username }})
          </option>
        </select>
        <span v-if="userLoading" class="loading-text">加载中...</span>
      </div>
    </div>

    <!-- 用户信息显示 -->
    <div v-if="selectedUser && selectedUserId && selectedUserId !== ''" class="user-info">
      <a-card title="用户信息" class="user-card">
        <div class="user-details">
          <div class="detail-item">
            <span class="label">用户名：</span>
            <span class="value">{{ selectedUser.username }}</span>
          </div>
          <div class="detail-item">
            <span class="label">姓名：</span>
            <span class="value">{{ selectedUser.name }}</span>
          </div>
          <div class="detail-item">
            <span class="label">角色：</span>
            <a-tag :color="getRoleColor(selectedUser.role)" size="small">
              {{ getRoleText(selectedUser.role) }}
            </a-tag>
          </div>
        </div>
      </a-card>
    </div>

    <!-- 游戏列表 -->
    <div v-if="selectedUserId && selectedUserId !== ''" class="games-section">
      <a-card title="拥有的游戏" class="games-card">
        <template #extra>
          <a-button @click="refreshGames" :loading="gameLoading">
            <template #icon>
              <icon-refresh />
            </template>
            刷新
          </a-button>
        </template>

        <a-table
          :columns="gameColumns"
          :data="gameList"
          :loading="gameLoading"
          row-key="id"
          :pagination="false"
        >
          <template #game_name="{ record }">
            <div class="game-info">
              <div class="game-name">{{ record.game.name }}</div>
              <div class="game-appid">AppID: {{ record.game.appid }}</div>
            </div>
          </template>

          <template #assigned_at="{ record }">
            {{ formatDate(record.assignedAt) }}
          </template>

          <template #assigned_by="{ record }">
            <div v-if="record.assignedBy">
              {{ record.assignedBy.name }} ({{ record.assignedBy.username }})
            </div>
            <div v-else class="text-muted">系统分配</div>
          </template>

          <template #ad_info="{ record }">
            <div class="ad-info">
              <div v-if="record.game.advertiser_id" class="ad-item">
                <span class="ad-label">广告主ID:</span>
                <span class="ad-value">{{ record.game.advertiser_id }}</span>
              </div>
              <div v-if="record.game.promotion_id" class="ad-item">
                <span class="ad-label">广告ID:</span>
                <span class="ad-value">{{ record.game.promotion_id }}</span>
              </div>
              <div v-if="!record.game.advertiser_id && !record.game.promotion_id" class="no-ad">
                未设置
              </div>
            </div>
          </template>

          <template #status="{ record }">
            <a-tag
              :color="record.game.validated ? 'green' : 'orange'"
              size="small"
            >
              {{ record.game.validated ? '已验证' : '未验证' }}
            </a-tag>
          </template>

          <template #actions="{ record }">
            <a-popconfirm
              title="确定要移除此游戏权限吗？"
              ok-text="确定移除"
              cancel-text="取消"
              @ok="handleDeleteGame(record)"
            >
              <template #content>
                <div style="color: #ff4d4f; font-weight: 500;">
                  此操作将移除用户对该游戏的访问权限。<br>
                  游戏本身不会被删除，其他用户仍可正常使用。
                </div>
              </template>
              <a-button type="text" size="small" style="color: #ff4d4f;">
                <template #icon>
                  <icon-delete />
                </template>
                移除权限
              </a-button>
            </a-popconfirm>
          </template>
        </a-table>
      </a-card>
    </div>


    <!-- 新增游戏应用模态框 -->
    <div v-if="showAddGameModal && userStore.userInfo?.role === 'admin'" class="modal-overlay" @click="closeGameModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>为用户新增游戏应用</h3>
          <button @click="closeGameModal" class="modal-close">&times;</button>
        </div>

        <div class="modal-body">
          <!-- 用户提示信息 -->
          <div v-if="selectedUser" class="user-notice">
            <div class="notice-icon">👤</div>
            <div class="notice-content">
              <div class="notice-title">为用户新增游戏应用</div>
              <div class="notice-user">{{ selectedUser.name }} ({{ selectedUser.username }})</div>
            </div>
          </div>

          <div class="form-item">
            <label>游戏名称</label>
            <input
              v-model="newGame.name"
              type="text"
              placeholder="输入游戏名称（用于标识）"
              class="form-input"
            />
          </div>

          <div class="form-item">
            <label>App ID</label>
            <input
              v-model="newGame.appid"
              type="text"
              placeholder="输入抖音游戏的App ID"
              class="form-input"
            />
          </div>

          <div class="form-item">
            <label>App Secret</label>
            <input
              v-model="newGame.appSecret"
              type="password"
              placeholder="输入32位App Secret，如：969c80995b1fc13fdbe952d73fb9f8c086706b6b"
              class="form-input"
            />
            <div class="form-hint">
              <small>💡 App Secret是32位字符串，从抖音开放平台获取</small>
            </div>
          </div>

          <div class="form-item">
            <label>游戏描述</label>
            <textarea
              v-model="newGame.description"
              placeholder="输入游戏描述（可选）"
              class="form-input"
              rows="3"
            ></textarea>
          </div>

          <div class="form-item">
            <label>广告主ID</label>
            <input
              v-model="newGame.advertiser_id"
              type="text"
              placeholder="输入广告主ID（可选，用于广告预览）"
              class="form-input"
            />
            <div class="form-hint">
              <small>💡 广告主ID用于生成广告预览二维码，从抖音广告平台获取</small>
            </div>
          </div>

          <div class="form-item">
            <label>广告ID</label>
            <input
              v-model="newGame.promotion_id"
              type="text"
              placeholder="输入广告ID（可选，用于广告预览）"
              class="form-input"
            />
            <div class="form-hint">
              <small>💡 广告ID用于生成广告预览二维码，从抖音广告平台获取</small>
            </div>
          </div>

          <!-- 测试连接区域 -->
          <div class="test-section" v-if="newGame.appid && newGame.appSecret">
            <div class="test-header">
              <h4>🔗 连接测试</h4>
              <div class="test-actions">
                <button
                  @click="fillExampleData"
                  class="btn btn-small"
                >
                  📝 填入示例数据
                </button>
                <button
                  @click="testGameConnection"
                  :disabled="testing"
                  class="btn btn-outline"
                >
                  {{ testing ? '测试中...' : '测试连接' }}
                </button>
              </div>
            </div>

            <!-- 广告ID测试区域 -->
            <div class="ad-test-section" v-if="newGame.advertiser_id && newGame.promotion_id">
              <div class="test-header">
                <h4>📱 广告预览测试</h4>
                <button
                  @click="testAdPreview"
                  :disabled="adTesting"
                  class="btn btn-outline btn-ad-test"
                >
                  {{ adTesting ? '测试中...' : '测试广告ID' }}
                </button>
              </div>

              <!-- 广告测试结果显示 -->
              <div v-if="adTestResult" class="test-result" :class="{ 'success': adTestResult.success, 'error': !adTestResult.success }">
                <div class="test-message">{{ adTestResult.message }}</div>
                <div v-if="adTestResult.success" class="test-details">
                  <small>✅ 广告ID验证成功，可以生成预览二维码</small>
                </div>
                <div v-if="!adTestResult.success && adTestResult.suggestion" class="test-suggestion">
                  <small>💡 {{ adTestResult.suggestion }}</small>
                </div>
              </div>
            </div>

            <!-- 测试结果显示 -->
            <div v-if="testResult" class="test-result" :class="{ 'success': testResult.success, 'error': !testResult.success }">
              <div class="test-message">{{ testResult.message }}</div>
              <div v-if="testResult.success" class="test-details">
                <small>Token: {{ testResult.token }}</small><br>
                <small>有效期: {{ testResult.expiresIn }}秒</small>
              </div>
              <div v-if="!testResult.success && testResult.suggestion" class="test-suggestion">
                <small>💡 {{ testResult.suggestion }}</small>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeGameModal" class="btn btn-secondary" :disabled="saving">取消</button>
          <button
            @click="saveNewGame"
            :disabled="!newGame.name || !newGame.appid || !newGame.appSecret || saving"
            class="btn btn-primary"
          >
            {{ saving ? '验证中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import { Message } from '@arco-design/web-vue';
import { IconRefresh, IconDelete } from '@arco-design/web-vue/es/icon';
import useUserStore from '@/store/modules/user';
import { getUserBasicList, getUserGames, assignGameToUser, createGame, deleteGame, removeUserGame, type UserBasicItem, type UserGameListRes } from '@/api/user';

console.log('🔧 [组件] UserGameManagement组件开始加载');
console.log('🔧 [组件] 当前用户store状态:', useUserStore());
console.log('🔧 [组件] 当前用户信息:', useUserStore().userInfo);
console.log('🔧 [组件] 组件setup函数开始执行');

// 响应式数据
const userLoading = ref(false);
const gameLoading = ref(false);
const selectedUserId = ref<string>(''); // HTML select使用字符串值
const selectedUser = ref<UserBasicItem | null>(null);
const userList = ref<UserBasicItem[]>([]);
const gameList = ref<any[]>([]);


// 新增游戏相关
const showAddGameModal = ref(false);
const saving = ref(false);
const testing = ref(false);
const testResult = ref(null);

// 广告测试相关
const adTesting = ref(false);
const adTestResult = ref(null);

const newGame = reactive({
  name: '',
  appid: '',
  appSecret: '',
  description: '',
  advertiser_id: '',
  promotion_id: ''
});

// 用户Store
const userStore = useUserStore();

// 用户权限检查
const isAdmin = computed(() => userStore.userInfo?.role === 'admin');
const canModify = computed(() => isAdmin.value); // 只有admin可以修改（创建、编辑、删除）
const canAssign = computed(() => {
  const role = userStore.userInfo?.role;
  return ['admin', 'internal_boss', 'external_boss', 'internal_service', 'external_service'].includes(role || '');
}); // 管理员、老板和客服可以分配游戏

// 游戏表格列配置
const gameColumns = computed(() => [
  {
    title: '游戏信息',
    slotName: 'game_name',
    width: 250
  },
  ...(canModify.value ? [{
    title: '广告信息',
    slotName: 'ad_info',
    width: 200
  }] : []),
  {
    title: '分配时间',
    dataIndex: 'assigned_at',
    slotName: 'assigned_at',
    width: 160
  },
  {
    title: '分配人',
    dataIndex: 'assigned_by',
    slotName: 'assigned_by',
    width: 150
  },
  {
    title: '游戏状态',
    dataIndex: 'status',
    slotName: 'status',
    width: 100
  },
  {
    title: '操作',
    dataIndex: 'actions',
    slotName: 'actions',
    width: 120
  }
]);

// 获取角色颜色
const getRoleColor = (role: string) => {
  const colors = {
    admin: 'red',
    internal_boss: 'purple',
    internal_service: 'orange',
    internal_user: 'blue',
    external_boss: 'green',
    external_service: 'cyan',
    external_user: 'geekblue',
    // 兼容旧角色名称，默认归类为内部
    super_viewer: 'purple',
    moderator: 'orange',
    viewer: 'blue',
    user: 'geekblue'
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
    moderator: '内部客服',
    viewer: '内部普通用户',
    user: '外部普通用户'
  };
  return texts[role] || role;
};

// 获取游戏角色颜色
const getGameRoleColor = (role: string) => {
  const colors = {
    owner: 'red',
    editor: 'orange',
    viewer: 'blue'
  };
  return colors[role] || 'default';
};

// 获取游戏角色文本
const getGameRoleText = (role: string) => {
  const texts = {
    owner: '所有者',
    editor: '编辑者',
    viewer: '查看者'
  };
  return texts[role] || role;
};

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return '未分配';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '无效日期';
  return date.toLocaleString('zh-CN');
};

// 加载用户列表
const loadUserList = async () => {
  console.log('📡 [API] 用户游戏管理页面开始加载用户列表...');
  console.log('📡 [API] 当前userLoading状态:', userLoading.value);
  console.log('📡 [API] 当前用户信息:', userStore.userInfo);

  userLoading.value = true;
  console.log('📡 [API] 设置userLoading为true');

  try {
    console.log('📡 [API] 调用getUserList API...');
    const startTime = Date.now();
    const response = await fetch('/api/user/list', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const result = await response.json();
      if (result.code === 20000) {
        let users = result.data.users;
        const endTime = Date.now();
        const duration = endTime - startTime;

        console.log('📡 [API] API响应接收成功，耗时:', duration, 'ms');
        console.log('📡 [API] 响应数据结构:', {
          hasData: !!result.data,
          hasUsers: !!(result.data?.users),
          usersCount: result.data?.users?.length || 0,
          total: result.data?.total || 0
        });

        // 根据当前用户角色过滤用户列表
        const currentUserRole = userStore.userInfo?.role;
        const currentUserId = Number(userStore.userInfo?.accountId);

        if (currentUserRole === 'admin') {
          // admin可以看到所有用户
          userList.value = users;
        } else if (['internal_boss', 'external_boss', 'internal_service', 'external_service'].includes(currentUserRole || '')) {
          // 老板和客服只能看到自己创建的用户，以及这些用户创建的用户（递归）
          const managedUserIds = getManagedUserIds(users, currentUserId);
          userList.value = users.filter(user => managedUserIds.includes(user.id));
        } else {
          // 其他角色看不到用户列表
          userList.value = [];
        }

        // 递归获取当前用户可以管理的用户ID列表
        function getManagedUserIds(allUsers: any[], managerId: number): number[] {
          const managedIds = new Set<number>();
          const queue = [managerId];

          while (queue.length > 0) {
            const currentId = queue.shift()!;
            managedIds.add(currentId);

            // 找到所有由当前用户创建的用户（处理类型不匹配问题）
            const children = allUsers.filter(user => Number(user.created_by) === currentId);
            children.forEach(child => {
              if (!managedIds.has(child.id)) {
                queue.push(child.id);
              }
            });
          }

          return Array.from(managedIds);
        }

        console.log('✅ [API] 用户列表加载成功:', userList.value.length, '个用户');
        console.log('✅ [API] 用户列表详情:', userList.value.map(u => ({ id: u.id, username: u.username, role: u.role })));

        console.log('✅ [API] 响应式数据已更新，userList长度:', userList.value.length);
      } else {
        console.log('❌ [API] 用户列表API返回错误:', result.message);
        Message.error('加载用户列表失败');
      }
    } else {
      console.log('❌ [API] 用户列表API请求失败，状态码:', response.status);
      Message.error('加载用户列表失败');
    }
  } catch (error) {
    console.error('❌ [API] 加载用户列表失败:', error);
    console.error('❌ [API] 错误详情:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    Message.error('加载用户列表失败');
  } finally {
    console.log('📡 [API] 最终设置userLoading为false');
    userLoading.value = false;
  }
};

// 加载用户游戏列表
const loadUserGames = async (userId: number) => {
  gameLoading.value = true;
  console.log('🎮 开始加载用户游戏列表，用户ID:', userId);
  try {
    const response = await getUserGames(userId);
    console.log('🎮 API响应:', response);
    console.log('🎮 用户数据:', response.data.user);
    console.log('🎮 游戏数据:', response.data.games);

    selectedUser.value = response.data.user;
    gameList.value = response.data.games;

    console.log('🎮 数据已更新到响应式变量');
    console.log('🎮 selectedUser:', selectedUser.value);
    console.log('🎮 gameList:', gameList.value);
  } catch (error) {
    console.error('❌ 加载用户游戏列表失败:', error);
    Message.error('加载用户游戏列表失败');
  } finally {
    gameLoading.value = false;
  }
};

// 处理用户选择变化
const handleUserChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  const userIdStr = target.value;
  if (userIdStr) {
    selectedUserId.value = userIdStr;
    const userId = parseInt(userIdStr);
    loadUserGames(userId);
  }
};

// 刷新游戏列表
const refreshGames = () => {
  if (selectedUserId.value) {
    const userId = parseInt(selectedUserId.value);
    loadUserGames(userId);
  }
};



// 处理删除游戏权限
const handleDeleteGame = async (record: any) => {
  try {
    console.log('🗑️ 开始移除用户游戏权限:', record.game.name);

    const userId = parseInt(selectedUserId.value);
    await removeUserGame(userId, record.game.id);
    Message.success(`游戏 "${record.game.name}" 权限移除成功`);

    // 刷新游戏列表
    if (selectedUserId.value) {
      await loadUserGames(userId);
    }
  } catch (error) {
    console.error('移除游戏权限失败:', error);
    Message.error('移除游戏权限失败');
  }
};

// 显示新增游戏模态框
const openAddGameModal = () => {
  // 检查管理员权限
  if (userStore.userInfo?.role !== 'admin') {
    Message.error('您没有权限执行此操作');
    return;
  }

  if (!selectedUserId.value || selectedUserId.value === '') {
    Message.warning('请先选择用户');
    return;
  }

  showAddGameModal.value = true;
  newGame.name = '';
  newGame.appid = '';
  newGame.appSecret = '';
  newGame.description = '';
  newGame.advertiser_id = '';
  newGame.promotion_id = '';
  testResult.value = null;
  testing.value = false;
};

// 填入示例数据
const fillExampleData = () => {
  newGame.appid = 'tt8c62fadf136c334702';
  newGame.appSecret = '969c80995b1fc13fdbe952d73fb9f8c086706b6b';
  newGame.name = '示例游戏应用';
  newGame.description = '这是一个示例游戏应用配置';
  testResult.value = null;
};

// 关闭游戏模态框
const closeGameModal = () => {
  showAddGameModal.value = false;
  newGame.name = '';
  newGame.appid = '';
  newGame.appSecret = '';
  newGame.description = '';
  newGame.advertiser_id = '';
  newGame.promotion_id = '';
  testResult.value = null;
  testing.value = false;
  adTestResult.value = null;
  adTesting.value = false;
};

// 测试游戏连接
const testGameConnection = async () => {
  if (!newGame.appid || !newGame.appSecret) {
    alert('请先填写App ID和App Secret');
    return;
  }

  testing.value = true;
  testResult.value = null;

  try {
    console.log('🔗 开始测试游戏连接...');

    // 通过后端代理调用token API进行测试
    const response = await fetch('/api/douyin/test-connection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        appid: newGame.appid,
        secret: newGame.appSecret
      })
    });

    const result = await response.json();
    console.log('📥 测试连接响应:', result);

    if (response.ok && (result.code === 0 || result.err_no === 0)) {
      console.log('✅ 游戏连接测试成功');

      testResult.value = {
        success: true,
        message: '✅ 连接成功！游戏配置有效',
        token: result.data?.access_token || 'token_received',
        expiresIn: result.data?.expires_in || 7200
      };
    } else {
      console.log('❌ 游戏连接测试失败:', result.message || result.error || result.err_tips);

      // 处理不同的错误格式和提供解决建议
      let errorMessage = '连接失败';
      let suggestion = '';

      if (result.err_tips) {
        errorMessage = result.err_tips;
        if (result.err_tips === 'bad secret') {
          suggestion = '请检查App Secret是否正确。从抖音开放平台获取32位App Secret字符串。';
        }
      } else if (result.message) {
        errorMessage = result.message;
      } else if (result.error) {
        errorMessage = result.error;
      }

      testResult.value = {
        success: false,
        message: `❌ ${errorMessage}`,
        error: errorMessage,
        suggestion: suggestion
      };
    }

  } catch (err) {
    console.error('❌ 测试连接时出错:', err);
    testResult.value = {
      success: false,
      message: `❌ 网络错误: ${err.message}`,
      error: err.message
    };
  } finally {
    testing.value = false;
  }
};

// 测试广告预览
const testAdPreview = async () => {
  if (!newGame.advertiser_id || !newGame.promotion_id) {
    alert('请先填写广告主ID和广告ID');
    return;
  }

  adTesting.value = true;
  adTestResult.value = null;

  try {
    console.log('📱 开始测试广告预览...');

    // 构建查询参数
    const params = new URLSearchParams({
      advertiser_id: newGame.advertiser_id,
      id_type: 'ID_TYPE_PROMOTION',
      promotion_id: newGame.promotion_id
    });

    // 直接调用抖音广告预览二维码API
    const response = await fetch(`https://api.oceanengine.com/open_api/v3.0/tools/ad_preview/qrcode_get/?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Access-Token': '969c80995b1fc13fdbe952d73fb9f8c086706b6b',
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    console.log('📥 广告预览测试响应:', result);

    if (response.ok && result.code === 0) {
      console.log('✅ 广告预览测试成功');

      adTestResult.value = {
        success: true,
        message: '✅ 广告ID验证成功！可以生成预览二维码',
      };
    } else {
      console.log('❌ 广告预览测试失败:', result.message || result.err_tips);

      // 处理不同的错误格式和提供解决建议
      let errorMessage = '广告ID验证失败';
      let suggestion = '';

      if (result.message) {
        errorMessage = result.message;
        if (result.message.includes('无效') || result.message.includes('不存在')) {
          suggestion = '请检查广告主ID和广告ID是否正确。从抖音广告平台获取有效的ID。';
        }
      } else if (result.err_tips) {
        errorMessage = result.err_tips;
      }

      adTestResult.value = {
        success: false,
        message: `❌ ${errorMessage}`,
        error: errorMessage,
        suggestion: suggestion || '请检查广告ID是否有效，或联系技术支持。'
      };
    }

  } catch (err) {
    console.error('❌ 测试广告预览时出错:', err);
    adTestResult.value = {
      success: false,
      message: `❌ 网络错误: ${err.message}`,
      error: err.message
    };
  } finally {
    adTesting.value = false;
  }
};

// 验证游戏配置
const validateGameConfig = async (appid, appSecret) => {
  try {
    console.log('🔐 开始验证游戏配置...');

    // 通过后端代理调用token API进行验证
    const response = await fetch('/api/douyin/test-connection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        appid: appid,
        secret: appSecret
      })
    });

    const result = await response.json();
    console.log('📥 游戏配置验证响应:', result);

    if (response.ok && (result.code === 0 || result.err_no === 0)) {
      console.log('✅ 游戏配置验证成功');
      return {
        success: true,
        token: result.data?.access_token || 'token_validated'
      };
    } else {
      console.log('❌ 游戏配置验证失败:', result.message || result.error || result.err_tips);

      // 处理不同的错误格式
      let errorMessage = '验证失败';
      if (result.err_tips) {
        errorMessage = result.err_tips;
      } else if (result.message) {
        errorMessage = result.message;
      } else if (result.error) {
        errorMessage = result.error;
      }

      return {
        success: false,
        error: errorMessage
      };
    }

  } catch (err) {
    console.error('❌ 验证游戏配置时出错:', err);
    return { success: false, error: err.message || '网络错误，请检查连接' };
  }
};

// 保存新游戏
const saveNewGame = async () => {
  // 检查管理员权限
  if (userStore.userInfo?.role !== 'admin') {
    Message.error('您没有权限执行此操作');
    return;
  }

  if (!newGame.name || !newGame.appid || !newGame.appSecret) {
    alert('请填写完整的游戏信息');
    return;
  }

  saving.value = true;

  try {
    console.log('🔄 开始保存新游戏配置...');

    // 检查游戏ID是否已存在（暂时跳过检查）
    // const existingGame = availableGames.value.find(game => game.appid === newGame.appid);
    // if (existingGame) {
    //   alert('该App ID已存在，请使用不同的App ID');
    //   return;
    // }

    // 验证游戏配置
    console.log('🔐 正在验证游戏配置...');
    const validation = await validateGameConfig(newGame.appid, newGame.appSecret);

    if (!validation.success) {
      alert(`游戏配置验证失败: ${validation.error}\n请检查App ID和App Secret是否正确。`);
      return;
    }

    console.log('✅ 游戏配置验证通过，Token:', validation.token);

    // 第一步：保存游戏到数据库
    console.log('💾 开始保存游戏到数据库...');
    let savedGame;
    try {
      const gameData = {
        name: newGame.name,
        appid: newGame.appid,
        appSecret: newGame.appSecret,
        description: newGame.description,
        advertiser_id: newGame.advertiser_id || undefined,
        promotion_id: newGame.promotion_id || undefined
      };
      console.log('📤 发送游戏保存请求:', gameData);

      const saveResponse = await createGame(gameData);
      savedGame = saveResponse.data;
      console.log('✅ 游戏保存成功:', savedGame);

    } catch (saveError) {
      console.error('❌ 游戏保存失败:', saveError);
      alert(`游戏配置验证成功，但保存到数据库时失败: ${saveError.message}`);
      return;
    }

    // 第二步：为当前选择的用户分配游戏权限
    if (selectedUserId.value && savedGame && savedGame.id) {
      console.log('🔗 开始为用户分配游戏权限...');
      console.log('📋 用户ID:', selectedUserId.value);
      console.log('🎮 游戏ID:', savedGame.id);
      console.log('👑 分配角色: owner');

      try {
        const assignData = {
          userId: parseInt(selectedUserId.value),
          gameId: savedGame.id, // 使用真实的游戏ID
          role: 'viewer' as 'owner' | 'editor' | 'viewer' // 默认分配查看者权限
        };
        console.log('📤 发送分配请求数据:', assignData);

        const assignResponse = await assignGameToUser(assignData);
        console.log('✅ 游戏权限分配成功:', assignResponse.data);

        // 刷新用户游戏列表
        const userId = parseInt(selectedUserId.value);
        await loadUserGames(userId);

      } catch (assignError) {
        console.error('❌ 游戏权限分配失败:', assignError);
        console.error('❌ 分配错误详情:', assignError.response?.data || assignError.message);

        // 即使分配失败，也要告知用户游戏已保存成功
        alert(`游戏配置验证成功并已保存！\n游戏名称: ${newGame.name}\nApp ID: ${newGame.appid}\n\n⚠️ 警告：游戏已保存但权限分配失败，请手动分配权限。`);
        return;
      }
    }

    alert(`游戏配置验证成功并已保存！\n游戏名称: ${newGame.name}\nApp ID: ${newGame.appid}\n已为用户 ${selectedUser.value?.name} 分配查看者权限`);

    // 关闭模态框
    closeGameModal();

  } catch (err) {
    console.error('❌ 保存游戏配置失败:', err);
    alert('保存失败，请稍后重试');
  } finally {
    saving.value = false;
  }
};

// 组件挂载时加载数据
onMounted(() => {
  console.log('🚀 [组件] 用户游戏管理页面组件挂载开始');
  console.log('🚀 [组件] 组件挂载时的用户信息:', userStore.userInfo);
  console.log('🚀 [组件] 组件挂载时的路由信息:', route.name, route.path);
  console.log('🚀 [组件] 组件挂载时的响应式数据:', {
    userLoading: userLoading.value,
    gameLoading: gameLoading.value,
    selectedUserId: selectedUserId.value,
    userListLength: userList.value.length,
    gameListLength: gameList.value.length
  });

  // 直接调用数据加载，不依赖路由监听
  console.log('🚀 [组件] 开始调用checkPermissionsAndLoadData');
  checkPermissionsAndLoadData();
  console.log('🚀 [组件] checkPermissionsAndLoadData调用完成');
});

// 监听路由变化，当路由变化时重新加载数据
const route = useRoute();

watch(
  () => route.name,
  (newName, oldName) => {
    console.log('🔍 [路由监听] 用户游戏管理页面路由变化检测:', {
      newName,
      oldName,
      currentRoute: route.name,
      fullPath: route.fullPath,
      params: route.params,
      query: route.query
    });

    // 只有当路由真正从其他页面跳转到UserGameManagement时才重新加载数据
    // 避免组件初始化时的重复加载
    if (newName === 'UserGameManagement' && oldName && oldName !== 'UserGameManagement') {
      console.log('🔄 [路由监听] 用户游戏管理页面路由变化，重新加载数据');
      console.log('🔄 [路由监听] 路由变化时的用户信息:', userStore.userInfo);
      console.log('🔄 [路由监听] 路由变化时的响应式数据:', {
        userLoading: userLoading.value,
        gameLoading: gameLoading.value,
        selectedUserId: selectedUserId.value,
        userListLength: userList.value.length,
        gameListLength: gameList.value.length
      });

      // 等待一小段时间确保组件完全更新
      setTimeout(() => {
        console.log('🔄 [路由监听] setTimeout执行，开始检查权限');
        if (userStore.userInfo?.role) {
          console.log('🔄 [路由监听] 用户信息存在，开始加载数据');
          checkPermissionsAndLoadData();
        } else {
          console.log('🔄 [路由监听] 用户信息不存在，跳过数据加载');
        }
      }, 100);
    }
  },
  { immediate: false } // 移除immediate，避免组件挂载时立即触发
);

// 检查权限并加载数据
const checkPermissionsAndLoadData = () => {
  console.log('🔍 [权限检查] 用户游戏管理页面检查权限并加载数据开始');
  console.log('👤 [权限检查] 当前用户信息:', userStore.userInfo);
  console.log('🔑 [权限检查] 用户角色:', userStore.userInfo?.role);
  console.log('📋 [权限检查] 当前响应式数据:', {
    userLoading: userLoading.value,
    gameLoading: gameLoading.value,
    selectedUserId: selectedUserId.value,
    userListLength: userList.value.length,
    gameListLength: gameList.value.length
  });

  // 检查用户权限：允许admin、内部老板、外部老板、内部客服、外部客服访问
  // 兼容旧角色名：super_viewer -> internal_boss, moderator -> internal_service
  const allowedRoles = ['admin', 'internal_boss', 'external_boss', 'internal_service', 'external_service', 'super_viewer', 'moderator'];
  console.log('📋 [权限检查] 允许的角色:', allowedRoles);
  console.log('✅ [权限检查] 角色检查结果:', allowedRoles.includes(userStore.userInfo?.role || ''));

  if (!allowedRoles.includes(userStore.userInfo?.role || '')) {
    console.log('❌ [权限检查] 权限不足，显示错误消息');
    console.log('❌ [权限检查] 当前用户角色不在允许列表中');
    Message.error('您没有权限访问此页面');
    return;
  }

  console.log('✅ [权限检查] 权限检查通过，开始加载用户列表');
  console.log('📡 [权限检查] 调用loadUserList函数');
  loadUserList();
  console.log('📡 [权限检查] loadUserList函数调用完成');
};
</script>

<style scoped lang="less">
.container {
  padding: 20px;
}

.page-header {
  margin-bottom: 24px;

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  @media (max-width: 768px) {
    .header-content {
      flex-direction: column;
      gap: 16px;
    }
  }

  h2 {
    margin: 0 0 8px 0;
    font-size: 24px;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: var(--color-text-3);
  }

  .header-actions {
    display: flex;
    gap: 12px;
  }
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

.user-selector {
  margin-bottom: 24px;

  .selector-item {
    display: flex;
    align-items: center;
    gap: 12px;

    label {
      font-weight: 500;
      color: var(--color-text-1);
      white-space: nowrap;
    }

    .user-select {
      width: 300px;
      padding: 8px 12px;
      border: 1px solid #d9d9d9;
      border-radius: 4px;
      font-size: 14px;
      background: white;
      cursor: pointer;

      &:focus {
        outline: none;
        border-color: #165dff;
        box-shadow: 0 0 0 2px rgba(22, 93, 255, 0.1);
      }

      &:disabled {
        background: #f5f5f5;
        cursor: not-allowed;
        opacity: 0.6;
      }

      option {
        padding: 8px;
      }
    }

    .loading-text {
      color: var(--color-text-3);
      font-size: 14px;
    }
  }
}

.user-info {
  margin-bottom: 24px;
}

.user-card {
  .user-details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }

  .detail-item {
    display: flex;
    align-items: center;
    gap: 8px;

    .label {
      font-weight: 500;
      color: var(--color-text-2);
      min-width: 60px;
    }

    .value {
      color: var(--color-text-1);
    }
  }
}

.games-section {
  .games-card {
    .game-info {
      .game-name {
        font-weight: 500;
        color: var(--color-text-1);
        margin-bottom: 4px;
      }

      .game-appid {
        font-size: 12px;
        color: var(--color-text-3);
      }
    }

    .text-muted {
      color: var(--color-text-3);
      font-style: italic;
    }

    .ad-info {
      font-size: 12px;
      line-height: 1.4;
    }

    .ad-item {
      margin-bottom: 2px;
    }

    .ad-label {
      color: var(--color-text-3);
      margin-right: 4px;
    }

    .ad-value {
      color: var(--color-text-1);
      font-family: monospace;
      background: #f5f5f5;
      padding: 1px 4px;
      border-radius: 2px;
      font-size: 11px;
    }

    .no-ad {
      color: var(--color-text-3);
      font-style: italic;
    }
  }

  .no-games {
    text-align: center;
    padding: 40px 0;
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

.btn-secondary {
  background: #f2f3f5;
  color: #1d2129;
}

.btn-secondary:hover {
  background: #e5e6eb;
}

/* 用户提示信息样式 */
.user-notice {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  margin-bottom: 20px;
}

.notice-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.notice-content {
  flex: 1;
}

.notice-title {
  font-weight: 600;
  color: #1d2129;
  margin-bottom: 4px;
}

.notice-user {
  color: #165dff;
  font-size: 14px;
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

.form-input textarea {
  resize: vertical;
  min-height: 60px;
}

.form-hint {
  margin-top: 4px;
  color: #86909c;
  font-size: 12px;
}

.form-hint small {
  display: block;
  line-height: 1.4;
}

/* 测试连接区域样式 */
.test-section {
  margin-top: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.test-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.test-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1d2129;
}

.test-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.btn-outline {
  padding: 6px 12px;
  border: 1px solid #165dff;
  background: white;
  color: #165dff;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-outline:hover:not(:disabled) {
  background: #165dff;
  color: white;
}

.btn-outline:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-ad-test {
  background: linear-gradient(135deg, #ff9a56 0%, #ff6b35 100%);
  color: white;
  border: 1px solid #ff6b35;
}

.btn-ad-test:hover:not(:disabled) {
  background: linear-gradient(135deg, #ff7a36 0%, #ff4d15 100%);
}

.test-result {
  padding: 12px;
  border-radius: 4px;
  font-size: 13px;
  line-height: 1.4;
}

.test-result.success {
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  color: #52c41a;
}

.test-result.error {
  background: #fff2f0;
  border: 1px solid #ffccc7;
  color: #ff4d4f;
}

.test-message {
  font-weight: 500;
  margin-bottom: 4px;
}

.test-details {
  opacity: 0.8;
  font-size: 12px;
}

.test-details small {
  display: block;
  margin-bottom: 2px;
}

.test-suggestion {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.test-suggestion small {
  color: #ff7875;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: 16px;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 16px 20px;
  }

  .modal-footer {
    flex-direction: column;
    gap: 8px;
  }

  .modal-footer .btn {
    width: 100%;
  }

  .test-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .test-actions {
    flex-direction: column;
    width: 100%;
  }

  .test-actions .btn {
    width: 100%;
  }

  .test-section {
    padding: 12px;
  }
}
</style>