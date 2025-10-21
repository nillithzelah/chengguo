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
          <!--
          <button
            v-if="userStore.userInfo?.role === 'admin'"
            @click="openAddGameModal"
            :disabled="!selectedUserId || selectedUserId === ''"
            class="btn btn-primary"
          >
            新增游戏应用
          </button>
          -->
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
            v-for="user in sortedUserList.filter(u => u.id !== Number(userStore.userInfo?.accountId))"
            :key="user.id"
            :value="user.id"
          >
            {{ user.name || user.username }} ({{ user.username }})
          </option>
        </select>
        <span v-if="userLoading" class="loading-text">加载中...</span>
      </div>
    </div>

    <!-- 主体筛选器 -->
    <div v-if="selectedUserId && selectedUserId !== '' && advertiserOptions.length > 0" class="advertiser-selector">
      <div class="selector-item">
        <label>筛选主体：</label>
        <select
          v-model="selectedAdvertiserId"
          class="advertiser-select"
        >
          <option value="">全部主体</option>
          <option
            v-for="advertiser in advertiserOptions"
            :key="advertiser.id"
            :value="advertiser.id"
          >
            {{ advertiser.name }}
          </option>
        </select>
      </div>
    </div>

    <!-- 数据统计 -->
    <div v-if="selectedUser && selectedUserId && selectedUserId !== ''" class="stats-section">
      <div class="stats-info">
        <div class="total-count">
          用户 "{{ selectedUser.name || selectedUser.username }}" 拥有 {{ gameList.length }} 个游戏权限
          <span v-if="selectedAdvertiserId" class="filter-info">（筛选后显示 {{ filteredGameList.length }} 个）</span>
        </div>
      </div>
    </div>
    <div v-else class="stats-section">
      <div class="stats-info">
        <div class="total-count">请选择用户查看游戏权限信息</div>
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
          :data="filteredGameList"
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
import Breadcrumb from '@/components/breadcrumb/index.vue';

console.log('🔧 [组件] UserGameManagement组件开始加载');
console.log('🔧 [组件] 当前用户store状态:', useUserStore());
console.log('🔧 [组件] 当前用户信息:', useUserStore().userInfo);
console.log('🔧 [组件] 组件setup函数开始执行');

// 响应式数据
const userLoading = ref(false);
const gameLoading = ref(false);
const selectedUserId = ref<string>(''); // HTML select使用字符串值
const selectedUser = ref<UserGameListRes['user'] | null>(null);
const userList = ref<UserBasicItem[]>([]);
const gameList = ref<any[]>([]);
const entityList = ref<any[]>([]); // 主体列表
const advertiserOptions = ref<{id: string, name: string}[]>([]); // 主体选项列表
const selectedAdvertiserId = ref<string>(''); // 选中的主体ID
const gameNameToEntityMap = ref<Map<string, string>>(new Map()); // 游戏名称到主体名称的映射


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

// 按权限高低排序用户列表
const sortedUserList = computed(() => {
  // 定义角色权限等级（从高到低，从内到外）
  const rolePriority = {
    'admin': 1,
    'internal_boss': 2,
    'external_boss': 3,
    'internal_service': 4,
    'external_service': 5,
    'internal_user_1': 6,
    'internal_user_2': 7,
    'internal_user_3': 8,
    'external_user_1': 9,
    'external_user_2': 10,
    'external_user_3': 11,
    // 兼容旧角色名称
    'super_viewer': 2, // internal_boss
    'moderator': 4, // internal_service
    'viewer': 6, // internal_user_1
    'user': 9 // external_user_1
  };

  return [...userList.value].sort((a, b) => {
    const priorityA = rolePriority[a.role] || 999;
    const priorityB = rolePriority[b.role] || 999;
    return priorityA - priorityB;
  });
});

// 过滤后的游戏列表
const filteredGameList = computed(() => {
  if (!selectedAdvertiserId.value) {
    return gameList.value;
  }

  // 根据选中的主体名称筛选游戏
  return gameList.value.filter(game => {
    const gameName = game.game?.name;
    if (!gameName) return false;

    // 获取当前游戏对应的主体名称
    let gameEntityName = gameNameToEntityMap.value.get(gameName);

    if (!gameEntityName) {
      // 尝试模糊匹配
      const cleanGameName = gameName.replace(/\d+$/, ''); // 去除末尾数字
      gameEntityName = gameNameToEntityMap.value.get(cleanGameName);
    }

    // 如果还是找不到，使用游戏名称本身
    if (!gameEntityName) {
      gameEntityName = gameName;
    }

    return gameEntityName === selectedAdvertiserId.value;
  });
});

// 游戏表格列配置
const gameColumns = computed(() => [
  {
    title: '游戏信息',
    slotName: 'game_name'
  },
  ...(canModify.value ? [{
    title: '广告信息',
    slotName: 'ad_info'
  }] : []),
  {
    title: '分配时间',
    dataIndex: 'assigned_at',
    slotName: 'assigned_at'
  },
  {
    title: '分配人',
    dataIndex: 'assigned_by',
    slotName: 'assigned_by'
  },
  {
    title: '操作',
    dataIndex: 'actions',
    slotName: 'actions'
  }
]);

// 获取角色颜色
const getRoleColor = (role: string) => {
  const colors = {
    admin: 'red',
    internal_boss: 'purple',
    internal_service: 'orange',
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
    moderator: '内部客服',
    viewer: '内部普通用户1级',
    user: '外部普通用户1级',
    internal_user: '内部普通用户1级',
    external_user: '外部普通用户1级'
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

        // 递归获取当前用户可以管理的用户ID列表（基于上级关系）
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
          }

          return Array.from(managedIds);
        }
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

// 加载主体列表
const loadEntityList = async () => {
  try {
    console.log('🏢 [主体列表] 开始加载主体列表...');
    const response = await fetch('/api/entity/list', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const result = await response.json();
      if (result.code === 20000) {
        entityList.value = result.data.entities || [];
        console.log('🏢 [主体列表] 成功加载主体列表，数量:', entityList.value.length);
        console.log('🏢 [主体列表] 主体数据:', entityList.value.map(e => ({ id: e.id, name: e.name })));
      } else {
        console.error('🏢 [主体列表] API返回错误:', result.message);
        entityList.value = [];
      }
    } else {
      console.error('🏢 [主体列表] 请求失败，状态码:', response.status);
      entityList.value = [];
    }
  } catch (error) {
    console.error('❌ 加载主体列表失败:', error);
    entityList.value = [];
  }
};

// 加载用户游戏列表
const loadUserGames = async (userId: number) => {
  gameLoading.value = true;
  console.log('🎮 开始加载用户游戏列表，用户ID:', userId);
  try {
    const response = await getUserGames(userId);

    selectedUser.value = response.data.user;
    gameList.value = response.data.games;

    // 更新主体选项（基于已有的主体数据）
    updateAdvertiserOptions();

    console.log('🏢 [筛选主体] 主体名称列表:', advertiserOptions.value);
    console.log('🎮 [筛选主体] 游戏数据条数:', response.data.games.length);

  } catch (error) {
    console.error('❌ 加载用户游戏列表失败:', error);
    Message.error('加载用户游戏列表失败');
  } finally {
    gameLoading.value = false;
  }
};

// 更新主体选项列表
const updateAdvertiserOptions = async () => {
  // 清空现有的主体选项和映射
  advertiserOptions.value = [];
  gameNameToEntityMap.value.clear();

  // 如果没有选中的用户，清空选项
  if (!selectedUserId.value) {
    console.log('🏢 [主体选项] 没有选中的用户，清空主体选项');
    return;
  }

  try {
    // 获取所有主体数据
    console.log('🏢 [主体选项] 开始获取主体数据...');
    const entityResponse = await fetch('/api/entity/list', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (entityResponse.ok) {
      const entityResult = await entityResponse.json();
      if (entityResult.code === 20000) {
        const entities = entityResult.data.entities || [];
        console.log('🏢 [主体选项] 获取到主体数据:', entities.length, '个主体');

        // 创建游戏名称到主体名称的映射
        const localGameNameToEntityMap = new Map<string, string>();
        entities.forEach((entity: any) => {
          if (entity.game_name && entity.name) {
            localGameNameToEntityMap.set(entity.game_name, entity.name);
          }
        });

        // 保存映射到全局变量
        gameNameToEntityMap.value = localGameNameToEntityMap;

        console.log('🏢 [主体选项] 游戏名称到主体名称映射:', Array.from(localGameNameToEntityMap.entries()));
        console.log('🏢 [主体选项] 主体表中的游戏名称:', entities.map((e: any) => e.game_name));
        console.log('🏢 [主体选项] 游戏表中的游戏名称:', gameList.value.map((g: any) => g.game?.name));

        // 从当前用户的游戏数据中提取主体名称
        const entityNameMap = new Map<string, {id: string, name: string}>();

        gameList.value.forEach((game: any) => {
          const gameName = game.game?.name;
          if (gameName) {
            // 尝试精确匹配
            let entityName = localGameNameToEntityMap.get(gameName);

            if (entityName) {
              console.log('🏢 [主体选项] 找到游戏对应的主体:', gameName, '->', entityName);
            } else {
              // 尝试模糊匹配（去除数字后缀等）
              const cleanGameName = gameName.replace(/\d+$/, ''); // 去除末尾数字
              entityName = localGameNameToEntityMap.get(cleanGameName);

              if (entityName) {
                console.log('🏢 [主体选项] 通过模糊匹配找到主体:', gameName, '->', cleanGameName, '->', entityName);
              } else {
                // 如果还是找不到，使用游戏名称作为备选
                console.log('🏢 [主体选项] 未找到游戏对应的主体，使用游戏名称作为备选:', gameName);
                entityName = gameName;
              }
            }

            if (!entityNameMap.has(entityName)) {
              entityNameMap.set(entityName, {
                id: entityName,
                name: entityName
              });
            }
          }
        });

        // 按字母顺序排序并设置主体选项
        advertiserOptions.value = Array.from(entityNameMap.values()).sort((a, b) => a.name.localeCompare(b.name));

        console.log('🏢 [主体选项] 最终生成的主体选项（公司名称）:', advertiserOptions.value);
      } else {
        console.error('🏢 [主体选项] 获取主体数据失败:', entityResult.message);
      }
    } else {
      console.error('🏢 [主体选项] 获取主体数据请求失败，状态码:', entityResponse.status);
    }
  } catch (error) {
    console.error('🏢 [主体选项] 获取主体数据时出错:', error);
  }

  console.log('🏢 [主体选项] 当前用户游戏数量:', gameList.value.length);
  console.log('🏢 [主体选项] 游戏数据详情:', gameList.value.map((g: any) => ({
    游戏名称: g.game?.name,
    entity_name: g.game?.entity_name,
    advertiser_id: g.game?.advertiser_id,
    promotion_id: g.game?.promotion_id
  })));
};

// 处理用户选择变化
const handleUserChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  const userIdStr = target.value;
  if (userIdStr) {
    selectedUserId.value = userIdStr;
    selectedAdvertiserId.value = ''; // 清空选中的主体筛选
    const userId = parseInt(userIdStr);
    loadUserGames(userId);
  } else {
    // 如果取消选择用户，清空相关数据
    selectedUserId.value = '';
    selectedUser.value = null;
    gameList.value = [];
    advertiserOptions.value = [];
    gameNameToEntityMap.value.clear();
    selectedAdvertiserId.value = '';
  }
};

// 刷新游戏列表
const refreshGames = () => {
  if (selectedUserId.value) {
    const userId = parseInt(selectedUserId.value);
    loadUserGames(userId);
  } else {
    // 如果没有选择用户，清空游戏列表和主体选项
    gameList.value = [];
    advertiserOptions.value = [];
    gameNameToEntityMap.value.clear();
  }
};



// 处理删除游戏权限
const handleDeleteGame = async (record: any) => {
  try {
    console.log('🗑️ 开始移除用户游戏权限:', record.game.name);

    const userId = parseInt(selectedUserId.value);
    await removeUserGame(userId, record.game.id);
    Message.success(`游戏 "${record.game.name}" 权限移除成功`);

    // 刷新游戏列表和主体选项
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

  console.log('✅ [权限检查] 权限检查通过，开始加载用户列表和主体列表');
  console.log('📡 [权限检查] 调用loadUserList函数');
  loadUserList();
  console.log('📡 [权限检查] 调用loadEntityList函数');
  loadEntityList();
  console.log('📡 [权限检查] 数据加载函数调用完成');
};
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
      content: "🎮";
      font-size: 36px;
    }
  }

  p {
    margin: 0;
    color: #86909c;
    font-size: 16px;
    font-weight: 400;
  }

  .header-actions {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }
}

/* Arco Design 按钮样式美化 */
:deep(.arco-btn) {
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
  }
}

/* 主要按钮样式 */
:deep(.arco-btn-primary) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  }
}

/* 次要按钮样式 */
:deep(.arco-btn-secondary) {
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
  border: 1px solid #d9d9d9;
  color: #4e5969;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #e8e8e8 0%, #d0d0d0 100%);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  }
}

/* 文本按钮样式 */
:deep(.arco-btn-text) {
  border-radius: 8px;
  font-weight: 500;
  color: #667eea;

  &:hover:not(:disabled) {
    background: rgba(102, 126, 234, 0.1);
    color: #5a6fd8;
    transform: translateY(-1px);
  }
}

/* 危险按钮样式 */
:deep(.arco-btn-danger) {
  background: linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%);
  border: none;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #cf1322 0%, #a8071a 100%);
    box-shadow: 0 6px 20px rgba(255, 77, 79, 0.3);
  }
}

/* 按钮尺寸 */
:deep(.arco-btn-size-small) {
  padding: 6px 12px;
  font-size: 12px;
  border-radius: 8px;
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
  content: "🎮";
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
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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

.user-selector {
  margin-bottom: 32px;
  background: linear-gradient(135deg, #fff 0%, #f8f9ff 100%);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(102, 126, 234, 0.1);
  animation: slideInFromLeft 0.8s ease-out 0.2s both;

  .selector-item {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;

    label {
      font-weight: 600;
      color: #1d2129;
      white-space: nowrap;
      font-size: 16px;
      display: flex;
      align-items: center;
      gap: 8px;

      &::before {
        content: "👤";
        font-size: 18px;
      }
    }

    .user-select {
      width: 320px;
      padding: 12px 16px;
      border: 2px solid #e5e6eb;
      border-radius: 12px;
      font-size: 14px;
      background: white;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover:not(:disabled) {
        border-color: #667eea;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
      }

      &:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }

      &:disabled {
        background: #f5f5f5;
        cursor: not-allowed;
        opacity: 0.6;
        transform: none;
      }

      option {
        padding: 8px;
      }
    }

    .loading-text {
      color: #86909c;
      font-size: 14px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;

      &::before {
        content: "⏳";
        font-size: 16px;
      }
    }
  }
}

.advertiser-selector {
  margin-bottom: 32px;
  background: linear-gradient(135deg, #fff 0%, #f8f9ff 100%);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(102, 126, 234, 0.1);
  animation: slideInFromLeft 0.8s ease-out 0.3s both;

.selector-item {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;

  label {
    font-weight: 600;
    color: #1d2129;
    white-space: nowrap;
    font-size: 16px;
    display: flex;
    align-items: center;
    gap: 8px;

    &::before {
      content: "🏢";
      font-size: 18px;
    }
  }

  .advertiser-select {
    width: 320px;
    padding: 12px 16px;
    border: 2px solid #e5e6eb;
    border-radius: 12px;
    font-size: 14px;
    background: white;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      border-color: #667eea;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
    }

    &:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    option {
      padding: 8px;
    }
  }
}
}

.user-info {
  margin-bottom: 32px;
  animation: slideInFromRight 0.8s ease-out 0.3s both;
}

.user-card {
  background: linear-gradient(135deg, #fff 0%, #f8f9ff 100%);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(102, 126, 234, 0.1);
  overflow: hidden;

  .arco-card-header {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
    border-bottom: 1px solid rgba(102, 126, 234, 0.1);
  }

  .arco-card-header-title {
    color: #1d2129;
    font-weight: 700;
    font-size: 18px;
    display: flex;
    align-items: center;
    gap: 8px;

    &::before {
      content: "👤";
      font-size: 20px;
    }
  }

  .arco-card-body {
    padding: 24px;
  }

  .user-details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
  }

  .detail-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: rgba(102, 126, 234, 0.02);
    border-radius: 12px;
    border: 1px solid rgba(102, 126, 234, 0.05);
    transition: all 0.3s ease;

    &:hover {
      background: rgba(102, 126, 234, 0.05);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
    }

    .label {
      font-weight: 600;
      color: #86909c;
      min-width: 70px;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 6px;

      &::before {
        content: "📋";
        font-size: 14px;
        opacity: 0.7;
      }
    }

    .value {
      color: #1d2129;
      font-weight: 500;
      font-size: 15px;
    }
  }
}

.games-section {
  margin-top: 32px;
  animation: slideInFromBottom 0.8s ease-out 0.4s both;

  .games-card {
    background: linear-gradient(135deg, #fff 0%, #f8f9ff 100%);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(102, 126, 234, 0.1);
    overflow: hidden;

    .game-info {
      .game-name {
        font-weight: 600;
        color: #1d2129;
        margin-bottom: 4px;
        font-size: 15px;
        display: flex;
        align-items: center;
        gap: 8px;

        &::before {
          content: "🎮";
          font-size: 16px;
        }
      }

      .game-appid {
        font-size: 12px;
        color: #86909c;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        background: rgba(102, 126, 234, 0.05);
        padding: 2px 6px;
        border-radius: 4px;
        display: inline-block;
      }
    }

    .text-muted {
      color: #86909c;
      font-style: italic;
      font-size: 13px;
    }

    .ad-info {
      font-size: 12px;
      line-height: 1.5;
    }

    .ad-item {
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .ad-label {
      color: #86909c;
      font-weight: 500;
      min-width: 60px;
    }

    .ad-value {
      color: #1d2129;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 11px;
      border: 1px solid rgba(102, 126, 234, 0.2);
    }

    .no-ad {
      color: #86909c;
      font-style: italic;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 6px;

      &::before {
        content: "⚠️";
        font-size: 14px;
      }
    }
  }

  .no-games {
    text-align: center;
    padding: 60px 20px;
    color: #86909c;
    font-size: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;

    &::before {
      content: "📭";
      font-size: 48px;
      opacity: 0.5;
    }
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
  max-width: 540px;
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
  padding: 24px 32px;
}

.modal-footer {
  padding: 20px 32px;
  border-top: 1px solid rgba(102, 126, 234, 0.1);
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  background: rgba(102, 126, 234, 0.02);
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

  &::placeholder {
    color: #c9cdd4;
  }
}

.form-input textarea {
  resize: vertical;
  min-height: 80px;
  line-height: 1.5;
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

/* 表格样式 */
:deep(.arco-table-th) {
  background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%) !important;
  font-weight: 600;
  color: #1d2129;
  border-bottom: 2px solid #e8e8e8;
}

:deep(.arco-table-td) {
  border-bottom: 1px solid #f0f0f0;
  color: #4e5969;
  padding: 12px 16px;
}

:deep(.arco-table-tr:hover .arco-table-td) {
  background: linear-gradient(135deg, #f7f8fa 0%, #f0f2ff 100%);
  color: #1d2129;
}

@keyframes slideInFromBottom {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInFromRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
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