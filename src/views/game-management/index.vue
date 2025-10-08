<template>
  <div class="game-management-page">
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1>游戏管理</h1>
          <p>查看和管理所有游戏，支持按用户筛选</p>
        </div>
        <div class="header-actions" v-if="canModify">
          <button @click="showCreateGameModal = true" class="btn btn-primary">
            创建游戏
          </button>
        </div>
      </div>
    </div>

    <!-- 筛选条件 -->
    <div class="filter-section">
      <div class="filter-grid">
        <div class="filter-item">
          <label>按用户筛选</label>
          <select v-model="selectedUserId" @change="filterGamesByUser" class="form-input">
            <option value="">显示所有游戏</option>
            <option
              v-for="user in users"
              :key="user.id"
              :value="user.id"
            >
              {{ user.name || user.username }} ({{ user.username }})
            </option>
          </select>
        </div>
        <div class="filter-item">
          <label>游戏状态</label>
          <select v-model="gameStatusFilter" @change="filterGames" class="form-input">
            <option value="">全部状态</option>
            <option value="active">活跃</option>
            <option value="inactive">停用</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 游戏列表 -->
    <div class="games-section">
      <div class="section-header">
        <h3>游戏列表</h3>
        <div class="section-info">
          共 {{ filteredGames.length }} 个游戏
        </div>
      </div>

      <div class="games-grid">
        <div v-for="game in filteredGames" :key="game.id" class="game-card">
          <div class="game-header">
            <h4>{{ game.name }}</h4>
            <span class="game-status" :class="{ 'active': game.status === 'active' }">
              {{ game.status === 'active' ? '活跃' : '停用' }}
            </span>
          </div>
          <div class="game-info">
            <p><strong>App ID:</strong> {{ game.appid }}</p>
            <p v-if="canModify"><strong>描述:</strong> {{ game.description || '无' }}</p>
            <p v-if="canModify"><strong>广告主ID:</strong> {{ game.advertiser_id || '未设置' }}</p>
            <p v-if="canModify"><strong>广告ID:</strong> {{ game.promotion_id || '未设置' }}</p>
            <p v-if="canModify"><strong>创建时间:</strong> {{ formatDate(game.created_at) }}</p>
          </div>
          <div class="game-actions">
            <!-- 只有admin可以编辑和删除 -->
            <button v-if="canModify" @click="editGame(game)" class="btn btn-outline">
              编辑游戏
            </button>
            <!-- 老板和客服可以分配游戏 -->
            <button v-if="canAssign" @click="openAssignModal(game)" class="btn btn-primary">
              分配用户
            </button>
            <button v-if="canModify" @click="deleteGame(game)" class="btn btn-danger btn-small">
              删除游戏
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建游戏模态框 -->
    <div v-if="showCreateGameModal" class="modal-overlay" @click="closeCreateGameModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>创建新游戏</h3>
          <button @click="closeCreateGameModal" class="modal-close">&times;</button>
        </div>

        <div class="modal-body">
          <div class="form-item">
            <label>游戏名称</label>
            <input
              v-model="newGame.name"
              type="text"
              placeholder="输入游戏名称"
              class="form-input"
            />
          </div>

          <div class="form-item">
            <label>App ID</label>
            <input
              v-model="newGame.appid"
              type="text"
              placeholder="输入抖音应用的App ID"
              class="form-input"
            />
          </div>

          <div class="form-item">
            <label>App Secret</label>
            <input
              v-model="newGame.appSecret"
              type="password"
              placeholder="输入抖音应用的App Secret"
              class="form-input"
            />
          </div>

          <div class="form-item">
            <label>描述</label>
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
              <button
                @click="testGameConnection"
                :disabled="testing"
                class="btn btn-outline"
              >
                {{ testing ? '测试中...' : '测试连接' }}
              </button>
            </div>


            <div v-if="testResult" class="test-result" :class="{ 'success': testResult.success, 'error': !testResult.success }">
              <div class="test-message">{{ testResult.message }}</div>
              <div v-if="testResult.success" class="test-details">
                <small>Token: {{ testResult.token }}</small><br>
                <small>有效期: {{ testResult.expiresIn }}秒</small>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeCreateGameModal" class="btn btn-secondary" :disabled="creating">取消</button>
          <button
            @click="createGame"
            :disabled="!newGame.name || !newGame.appid || !newGame.appSecret || creating"
            class="btn btn-primary"
          >
            {{ creating ? '创建中...' : '创建游戏' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 编辑游戏模态框 -->
    <div v-if="showEditGameModal" class="modal-overlay" @click="closeEditGameModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>编辑游戏</h3>
          <button @click="closeEditGameModal" class="modal-close">&times;</button>
        </div>

        <div class="modal-body">
          <div class="form-item">
            <label>游戏名称</label>
            <input
              v-model="editGameData.name"
              type="text"
              placeholder="输入游戏名称"
              class="form-input"
            />
          </div>

          <div class="form-item">
            <label>App ID</label>
            <input
              v-model="editGameData.appid"
              type="text"
              placeholder="输入抖音应用的App ID"
              class="form-input"
            />
          </div>

          <div class="form-item">
            <label>App Secret</label>
            <input
              v-model="editGameData.appSecret"
              type="password"
              placeholder="输入抖音应用的App Secret"
              class="form-input"
            />
          </div>

          <div class="form-item">
            <label>描述</label>
            <textarea
              v-model="editGameData.description"
              placeholder="输入游戏描述（可选）"
              class="form-input"
              rows="3"
            ></textarea>
          </div>

          <div class="form-item">
            <label>广告主ID</label>
            <input
              v-model="editGameData.advertiser_id"
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
              v-model="editGameData.promotion_id"
              type="text"
              placeholder="输入广告ID（可选，用于广告预览）"
              class="form-input"
            />
            <div class="form-hint">
              <small>💡 广告ID用于生成广告预览二维码，从抖音广告平台获取</small>
            </div>
          </div>

          <!-- 测试连接区域 -->
          <div class="test-section" v-if="editGameData.appid && editGameData.appSecret">
            <div class="test-header">
              <h4>🔗 连接测试</h4>
              <button
                @click="testEditGameConnection"
                :disabled="testing"
                class="btn btn-outline"
              >
                {{ testing ? '测试中...' : '测试连接' }}
              </button>
            </div>


            <div v-if="testResult" class="test-result" :class="{ 'success': testResult.success, 'error': !testResult.success }">
              <div class="test-message">{{ testResult.message }}</div>
              <div v-if="testResult.success" class="test-details">
                <small>Token: {{ testResult.token }}</small><br>
                <small>有效期: {{ testResult.expiresIn }}秒</small>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeEditGameModal" class="btn btn-secondary" :disabled="editing">取消</button>
          <button
            @click="updateGame"
            :disabled="!editGameData.name || !editGameData.appid || !editGameData.appSecret || editing"
            class="btn btn-primary"
          >
            {{ editing ? '保存中...' : '保存修改' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 分配用户模态框 -->
    <div v-if="showAssignUserModal" class="modal-overlay" @click="closeAssignModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>为游戏分配用户</h3>
          <button @click="closeAssignModal" class="modal-close">&times;</button>
        </div>

        <div class="modal-body">
          <div class="game-info-section">
            <h4>{{ selectedGame?.name }}</h4>
            <p>App ID: {{ selectedGame?.appid }}</p>
          </div>

          <div class="form-item">
            <label>选择用户</label>
            <select v-model="assignData.userId" class="form-input">
              <option value="">请选择用户</option>
              <option
                v-for="user in users"
                :key="user.id"
                :value="user.id"
              >
                {{ user.name || user.username }} ({{ user.username }})
              </option>
            </select>
          </div>

          <div class="form-item">
            <label>权限角色</label>
            <select v-model="assignData.role" class="form-input">
              <option value="viewer">查看者</option>
              <option value="editor">编辑者</option>
              <option value="owner">所有者</option>
            </select>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeAssignModal" class="btn btn-secondary" :disabled="assigning">取消</button>
          <button
            @click="assignGameToUser"
            :disabled="!assignData.userId || !assignData.role || assigning"
            class="btn btn-primary"
          >
            {{ assigning ? '分配中...' : '分配游戏' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 查看用户游戏模态框 -->
    <div v-if="showUserGamesModal" class="modal-overlay" @click="closeUserGamesModal">
      <div class="modal-content large-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedUser?.name || selectedUser?.username }} 的游戏列表</h3>
          <button @click="closeUserGamesModal" class="modal-close">&times;</button>
        </div>

        <div class="modal-body">
          <div class="user-games-list">
            <div v-if="userGames.length === 0" class="empty-state">
              <p>该用户暂无游戏权限</p>
            </div>
            <div v-else v-for="userGame in userGames" :key="userGame.id" class="user-game-item">
              <div class="game-info">
                <h4>{{ userGame.game.name }}</h4>
                <p>App ID: {{ userGame.game.appid }}</p>
                <p>权限: <span class="role-badge" :class="userGame.role">{{ getRoleDisplayName(userGame.role) }}</span></p>
                <p>分配时间: {{ formatDate(userGame.assignedAt) }}</p>
              </div>
              <div class="game-actions">
                <button @click="removeUserGame(userGame)" class="btn btn-danger btn-small">
                  移除权限
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeUserGamesModal" class="btn btn-secondary">关闭</button>
        </div>
      </div>
    </div>

    <!-- 查看游戏用户模态框 -->
    <div v-if="showGameUsersModal" class="modal-overlay" @click="closeGameUsersModal">
      <div class="modal-content large-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedGame?.name }} 的用户列表</h3>
          <button @click="closeGameUsersModal" class="modal-close">&times;</button>
        </div>

        <div class="modal-body">
          <div class="game-users-list">
            <div v-if="gameUsers.length === 0" class="empty-state">
              <p>该游戏暂无用户权限</p>
            </div>
            <div v-else v-for="userGame in gameUsers" :key="userGame.id" class="game-user-item">
              <div class="user-info">
                <h4>{{ userGame.user.name || userGame.user.username }}</h4>
                <p>用户名: {{ userGame.user.username }}</p>
                <p>权限: <span class="role-badge" :class="userGame.role">{{ getRoleDisplayName(userGame.role) }}</span></p>
                <p>分配时间: {{ formatDate(userGame.assignedAt) }}</p>
              </div>
              <div class="user-actions">
                <button @click="removeUserGame(userGame)" class="btn btn-danger btn-small">
                  移除权限
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeGameUsersModal" class="btn btn-secondary">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useUserStore } from '@/store';

// 响应式数据
const games = ref([]);
const users = ref([]);
const loading = ref(false);

// 筛选数据
const selectedUserId = ref('');
const gameStatusFilter = ref('');
const filteredGames = ref([]);

// 模态框状态
const showCreateGameModal = ref(false);
const showEditGameModal = ref(false);
const showAssignUserModal = ref(false);
const showUserGamesModal = ref(false);
const showGameUsersModal = ref(false);

// 选中的数据
const selectedGame = ref(null);
const selectedUser = ref(null);

// 用户游戏数据
const userGames = ref([]);
const gameUsers = ref([]);

// 创建游戏数据
const newGame = reactive({
  name: '',
  appid: '',
  appSecret: '',
  description: '',
  advertiser_id: '',
  promotion_id: ''
});

// 编辑游戏数据
const editGameData = reactive({
  id: null,
  name: '',
  appid: '',
  appSecret: '',
  description: '',
  advertiser_id: '',
  promotion_id: ''
});

// 分配数据
const assignData = reactive({
  userId: '',
  role: 'viewer'
});

// 状态
const creating = ref(false);
const editing = ref(false);
const testing = ref(false);
const assigning = ref(false);
const testResult = ref(null);

// 广告测试相关
const adTesting = ref(false);
const adTestResult = ref(null);

// 用户权限检查
const userStore = useUserStore();
const isAdmin = computed(() => userStore.role === 'admin');
const canModify = computed(() => isAdmin.value); // 只有admin可以修改（创建、编辑、删除）
const canAssign = computed(() => {
  const role = userStore.role;
  return ['admin', 'internal_boss', 'external_boss', 'internal_service', 'external_service'].includes(role || '');
}); // 老板和客服可以分配游戏

// 工具函数
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('zh-CN');
};

// 筛选函数
const filterGamesByUser = async () => {
  if (selectedUserId.value) {
    // 获取选中用户拥有的游戏
    try {
      const response = await fetch(`/api/game/user-games/${selectedUserId.value}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 20000) {
          const userGameIds = result.data.games.map(userGame => userGame.game.id);
          filteredGames.value = games.value.filter(game => userGameIds.includes(game.id));
          return;
        }
      }
    } catch (error) {
      console.error('获取用户游戏失败:', error);
    }
  }

  // 如果没有选择用户或获取失败，显示所有游戏
  filterGames();
};

const filterGames = () => {
  let filtered = [...games.value];

  // 按状态筛选
  if (gameStatusFilter.value) {
    filtered = filtered.filter(game => game.status === gameStatusFilter.value);
  }

  filteredGames.value = filtered;
};

const getRoleDisplayName = (role) => {
  const roleMap = {
    'viewer': '查看者',
    'editor': '编辑者',
    'owner': '所有者'
  };
  return roleMap[role] || role;
};

const getUserGameCount = (userId) => {
  // 这里可以从缓存或API获取用户的游戏数量
  return 0; // 暂时返回0，需要实现
};


// API调用函数
const loadGames = async () => {
  console.log('📡 游戏管理页面开始加载游戏列表...');
  try {
    const response = await fetch('/api/game/list', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 游戏列表API响应状态:', response.status);
    if (response.ok) {
      const result = await response.json();
      console.log('📡 游戏列表API响应数据:', result);
      if (result.code === 20000) {
        console.log('✅ 游戏列表加载成功:', result.data.games.length, '个游戏');
        games.value = result.data.games;
        filteredGames.value = [...games.value]; // 更新筛选结果
      } else {
        console.log('❌ 游戏列表API返回错误:', result.message);
      }
    } else {
      console.log('❌ 游戏列表API请求失败，状态码:', response.status);
    }
  } catch (error) {
    console.error('❌ 加载游戏列表失败:', error);
  }
};

const loadUsers = async () => {
  console.log('📡 游戏管理页面开始加载用户列表...');
  try {
    const response = await fetch('/api/user/basic-list', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 用户列表API响应状态:', response.status);
    if (response.ok) {
      const result = await response.json();
      console.log('📡 用户列表API响应数据:', result);
      if (result.code === 20000) {
        console.log('✅ 用户列表加载成功:', result.data.users.length, '个用户');
        users.value = result.data.users;
      } else {
        console.log('❌ 用户列表API返回错误:', result.message);
      }
    } else {
      console.log('❌ 用户列表API请求失败，状态码:', response.status);
    }
  } catch (error) {
    console.error('❌ 加载用户列表失败:', error);
  }
};

const testGameConnection = async () => {
  if (!newGame.appid || !newGame.appSecret) {
    alert('请先填写App ID和App Secret');
    return;
  }

  testing.value = true;
  testResult.value = null;

  try {
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

    if (response.ok && (result.code === 0 || result.err_no === 0)) {
      testResult.value = {
        success: true,
        message: '✅ 连接成功！应用配置有效',
        token: result.data?.access_token || 'token_received',
        expiresIn: result.data?.expires_in || 7200
      };
    } else {
      testResult.value = {
        success: false,
        message: `❌ 连接失败: ${result.err_tips || result.message || '未知错误'}`
      };
    }
  } catch (error) {
    testResult.value = {
      success: false,
      message: `❌ 网络错误: ${error.message}`
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

const createGame = async () => {
  if (!newGame.name || !newGame.appid || !newGame.appSecret) {
    alert('请填写完整的游戏信息');
    return;
  }

  creating.value = true;

  try {
    const response = await fetch('/api/game/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: newGame.name,
        appid: newGame.appid,
        appSecret: newGame.appSecret,
        description: newGame.description,
        advertiser_id: newGame.advertiser_id || undefined,
        promotion_id: newGame.promotion_id || undefined
      })
    });

    const result = await response.json();

    if (response.ok && result.code === 20000) {
      alert('游戏创建成功！');
      closeCreateGameModal();
      await loadGames(); // 重新加载游戏列表
    } else {
      alert(`创建失败: ${result.message || '未知错误'}`);
    }
  } catch (error) {
    alert(`创建失败: ${error.message}`);
  } finally {
    creating.value = false;
  }
};

// 编辑游戏
const editGame = (game) => {
  editGameData.id = game.id;
  editGameData.name = game.name;
  editGameData.appid = game.appid;
  editGameData.appSecret = game.app_secret || '';
  editGameData.description = game.description || '';
  editGameData.advertiser_id = game.advertiser_id || '';
  editGameData.promotion_id = game.promotion_id || '';
  showEditGameModal.value = true;
  // 重置测试结果
  testResult.value = null;
  adTestResult.value = null;
};

// 测试编辑游戏连接
const testEditGameConnection = async () => {
  if (!editGameData.appid || !editGameData.appSecret) {
    alert('请先填写App ID和App Secret');
    return;
  }

  testing.value = true;
  testResult.value = null;

  try {
    const response = await fetch('/api/douyin/test-connection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        appid: editGameData.appid,
        secret: editGameData.appSecret
      })
    });

    const result = await response.json();

    if (response.ok && (result.code === 0 || result.err_no === 0)) {
      testResult.value = {
        success: true,
        message: '✅ 连接成功！应用配置有效',
        token: result.data?.access_token || 'token_received',
        expiresIn: result.data?.expires_in || 7200
      };
    } else {
      testResult.value = {
        success: false,
        message: `❌ 连接失败: ${result.err_tips || result.message || '未知错误'}`
      };
    }
  } catch (error) {
    testResult.value = {
      success: false,
      message: `❌ 网络错误: ${error.message}`
    };
  } finally {
    testing.value = false;
  }
};

// 测试编辑广告预览
const testEditAdPreview = async () => {
  if (!editGameData.advertiser_id || !editGameData.promotion_id) {
    alert('请先填写广告主ID和广告ID');
    return;
  }

  adTesting.value = true;
  adTestResult.value = null;

  try {
    console.log('📱 开始测试编辑游戏的广告预览...');

    // 构建查询参数
    const params = new URLSearchParams({
      advertiser_id: editGameData.advertiser_id,
      id_type: 'ID_TYPE_PROMOTION',
      promotion_id: editGameData.promotion_id
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
    console.log('📥 编辑游戏广告预览测试响应:', result);

    if (response.ok && result.code === 0) {
      console.log('✅ 编辑游戏广告预览测试成功');

      adTestResult.value = {
        success: true,
        message: '✅ 广告ID验证成功！可以生成预览二维码',
      };
    } else {
      console.log('❌ 编辑游戏广告预览测试失败:', result.message || result.err_tips);

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
    console.error('❌ 测试编辑游戏广告预览时出错:', err);
    adTestResult.value = {
      success: false,
      message: `❌ 网络错误: ${err.message}`,
      error: err.message
    };
  } finally {
    adTesting.value = false;
  }
};

// 更新游戏
const updateGame = async () => {
  if (!editGameData.name || !editGameData.appid || !editGameData.appSecret) {
    alert('请填写完整的游戏信息');
    return;
  }

  editing.value = true;

  try {
    const response = await fetch(`/api/game/update/${editGameData.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: editGameData.name,
        appid: editGameData.appid,
        appSecret: editGameData.appSecret,
        description: editGameData.description,
        advertiser_id: editGameData.advertiser_id || undefined,
        promotion_id: editGameData.promotion_id || undefined
      })
    });

    const result = await response.json();

    if (response.ok && result.code === 20000) {
      alert('游戏更新成功！');
      closeEditGameModal();
      await loadGames(); // 重新加载游戏列表
    } else {
      alert(`更新失败: ${result.message || '未知错误'}`);
    }
  } catch (error) {
    alert(`更新失败: ${error.message}`);
  } finally {
    editing.value = false;
  }
};

const openAssignModal = (game) => {
  selectedGame.value = game;
  assignData.userId = '';
  assignData.role = 'viewer';
  showAssignUserModal.value = true;
};

const assignGameToUser = async () => {
  if (!assignData.userId || !assignData.role) {
    alert('请选择用户和权限角色');
    return;
  }

  assigning.value = true;

  try {
    const response = await fetch('/api/game/assign', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: assignData.userId,
        gameId: selectedGame.value.id,
        role: assignData.role
      })
    });

    const result = await response.json();

    if (response.ok && result.code === 20000) {
      alert('游戏分配成功！');
      closeAssignModal();
    } else {
      alert(`分配失败: ${result.message || '未知错误'}`);
    }
  } catch (error) {
    alert(`分配失败: ${error.message}`);
  } finally {
    assigning.value = false;
  }
};

const viewUserGames = async (user) => {
  selectedUser.value = user;

  try {
    const response = await fetch(`/api/game/user-games/${user.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const result = await response.json();
      if (result.code === 20000) {
        userGames.value = result.data.games;
        showUserGamesModal.value = true;
      }
    }
  } catch (error) {
    console.error('加载用户游戏失败:', error);
  }
};

const viewGameUsers = async (game) => {
  selectedGame.value = game;

  try {
    const response = await fetch(`/api/game/${game.id}/users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const result = await response.json();
      if (result.code === 20000) {
        gameUsers.value = result.data.users;
        showGameUsersModal.value = true;
      } else {
        alert(`获取游戏用户失败: ${result.message || '未知错误'}`);
      }
    } else {
      alert('获取游戏用户失败，请稍后重试');
    }
  } catch (error) {
    console.error('加载游戏用户失败:', error);
    alert(`加载游戏用户失败: ${error.message}`);
  }
};

const removeUserGame = async (userGame) => {
  if (!confirm('确定要移除该用户的游戏权限吗？')) {
    return;
  }

  try {
    const response = await fetch(`/api/game/remove/${userGame.user_id}/${userGame.game_id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (response.ok && result.code === 20000) {
      alert('权限移除成功！');
      // 重新加载相关数据
      if (showUserGamesModal.value) {
        await viewUserGames(selectedUser.value);
      }
      if (showGameUsersModal.value) {
        await viewGameUsers(selectedGame.value);
      }
    } else {
      alert(`移除失败: ${result.message || '未知错误'}`);
    }
  } catch (error) {
    alert(`移除失败: ${error.message}`);
  }
};

const deleteGame = async (game) => {
  if (!confirm(`确定要删除游戏"${game.name}"吗？\n\n删除后将同时移除所有用户的相关权限，此操作不可恢复！`)) {
    return;
  }

  try {
    const token = localStorage.getItem('token');
    console.log('🗑️ 前端删除游戏:', { gameId: game.id, gameName: game.name, token: token ? 'token存在' : 'token不存在' });

    const response = await fetch(`/api/game/delete/${game.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('🗑️ 删除游戏响应:', { status: response.status, ok: response.ok });

    const result = await response.json();

    if (response.ok && result.code === 20000) {
      alert(`游戏"${game.name}"删除成功！\n删除了 ${result.data.deletedPermissions} 条用户权限记录。`);
      // 重新加载游戏列表
      await loadGames();
    } else {
      alert(`删除失败: ${result.message || '未知错误'}`);
    }
  } catch (error) {
    alert(`删除失败: ${error.message}`);
  }
};

// 模态框控制函数
const closeCreateGameModal = () => {
  showCreateGameModal.value = false;
  newGame.name = '';
  newGame.appid = '';
  newGame.appSecret = '';
  newGame.description = '';
  newGame.advertiser_id = '';
  newGame.promotion_id = '';
  testResult.value = null;
  adTestResult.value = null;
  adTesting.value = false;
};

const closeEditGameModal = () => {
  showEditGameModal.value = false;
  editGameData.id = null;
  editGameData.name = '';
  editGameData.appid = '';
  editGameData.appSecret = '';
  editGameData.description = '';
  editGameData.advertiser_id = '';
  editGameData.promotion_id = '';
  testResult.value = null;
  adTestResult.value = null;
  adTesting.value = false;
};

const closeAssignModal = () => {
  showAssignUserModal.value = false;
  selectedGame.value = null;
  assignData.userId = '';
  assignData.role = 'viewer';
};

const closeUserGamesModal = () => {
  showUserGamesModal.value = false;
  selectedUser.value = null;
  userGames.value = [];
};

const closeGameUsersModal = () => {
  showGameUsersModal.value = false;
  selectedGame.value = null;
  gameUsers.value = [];
};

// 页面初始化
onMounted(async () => {
  console.log('🚀 游戏管理页面初始化');
  console.log('👤 当前用户信息:', userStore.userInfo);
  console.log('🔑 用户角色:', userStore.userInfo?.role);
  console.log('📋 isAdmin:', isAdmin.value);
  console.log('📋 canModify:', canModify.value);

  // 直接调用数据加载，不依赖路由监听
  await loadGames();
  await loadUsers();

  // 初始化筛选结果
  filteredGames.value = [...games.value];
});

// 监听路由变化，当路由变化时重新加载数据
const route = useRoute();

watch(
  () => route.name,
  (newName, oldName) => {
    console.log('🔍 游戏管理页面路由变化检测:', { newName, oldName, currentRoute: route.name });
    if (newName === 'GameManagement') {
      console.log('🔄 游戏管理页面路由变化，重新加载数据');
      // 等待一小段时间确保组件完全更新
      setTimeout(async () => {
        await loadGames();
        await loadUsers();
        // 重新初始化筛选结果
        filteredGames.value = [...games.value];
      }, 100);
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.game-management-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
}

.page-header h1 {
  font-size: 28px;
  font-weight: 600;
  color: #1d2129;
  margin: 0 0 8px 0;
}

.page-header p {
  color: #86909c;
  margin: 0;
}

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

/* 筛选区域 */
.filter-section {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.filter-item {
  display: flex;
  flex-direction: column;
}

.filter-item label {
  display: block;
  font-weight: 500;
  color: #1d2129;
  margin-bottom: 8px;
}

/* 游戏列表 */
.games-section {
  margin-bottom: 40px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1d2129;
}

.section-info {
  color: #86909c;
  font-size: 14px;
}

.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.game-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #f0f0f0;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.game-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1d2129;
}

.game-status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.game-status.active {
  background: #f6ffed;
  color: #52c41a;
}

.game-info p {
  margin: 8px 0;
  font-size: 14px;
  color: #4e5969;
}

.game-info p strong {
  color: #1d2129;
}

.game-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

/* 用户列表 */
.users-section {
  margin-bottom: 40px;
}

.users-table-container {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th,
.users-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.users-table th {
  background: #fafbfc;
  font-weight: 600;
  color: #1d2129;
}

.users-table td {
  color: #4e5969;
}

.role-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.role-badge.admin {
  background: #fff2f0;
  color: #ff4d4f;
}

.role-badge.user {
  background: #f6ffed;
  color: #52c41a;
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
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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

.btn-outline {
  border: 1px solid #165dff;
  background: white;
  color: #165dff;
}

.btn-outline:hover:not(:disabled) {
  background: #165dff;
  color: white;
}

.btn-ad-test {
  background: linear-gradient(135deg, #ff9a56 0%, #ff6b35 100%);
  color: white;
  border: 1px solid #ff6b35;
}

.btn-ad-test:hover:not(:disabled) {
  background: linear-gradient(135deg, #ff7a36 0%, #ff4d15 100%);
}

.btn-danger {
  background: #ff4d4f;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #cf1322;
}

.btn-small {
  padding: 6px 12px;
  font-size: 12px;
}

/* 表单样式 */
.form-item {
  margin-bottom: 20px;
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

.form-input textarea {
  resize: vertical;
  min-height: 80px;
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
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.large-modal {
  max-width: 800px;
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

/* 测试连接区域 */
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

/* 游戏信息区域 */
.game-info-section {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 6px;
  margin-bottom: 20px;
}

.game-info-section h4 {
  margin: 0 0 8px 0;
  color: #1d2129;
}

.game-info-section p {
  margin: 4px 0;
  color: #4e5969;
  font-size: 14px;
}

/* 用户游戏列表 */
.user-games-list,
.game-users-list {
  max-height: 400px;
  overflow-y: auto;
}

.user-game-item,
.game-user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  margin-bottom: 12px;
  background: #fafbfc;
}

.user-game-item .game-info,
.game-user-item .user-info {
  flex: 1;
}

.user-game-item .game-info h4,
.game-user-item .user-info h4 {
  margin: 0 0 8px 0;
  color: #1d2129;
  font-size: 16px;
}

.user-game-item .game-info p,
.game-user-item .user-info p {
  margin: 4px 0;
  color: #4e5969;
  font-size: 14px;
}

.user-game-item .game-actions,
.game-user-item .user-actions {
  margin-left: 20px;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #86909c;
}

.empty-state p {
  margin: 0;
  font-size: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .game-management-page {
    padding: 16px;
  }

  .games-grid {
    grid-template-columns: 1fr;
  }

  .game-card {
    padding: 16px;
  }

  .users-table {
    font-size: 14px;
  }

  .users-table th,
  .users-table td {
    padding: 8px 12px;
  }

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

  .user-game-item,
  .game-user-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .user-game-item .game-actions,
  .game-user-item .user-actions {
    margin-left: 0;
    align-self: flex-end;
  }
}
</style>