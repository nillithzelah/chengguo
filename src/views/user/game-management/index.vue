<template>
  <div class="container">
    <Breadcrumb :items="['menu.user', 'menu.user.game.admin']" />

    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-content">
        <div>
          <h2>游戏管理</h2>
          <p>查看和管理所有游戏，支持按用户筛选</p>
        </div>
        <div class="header-actions" v-if="canModify">
          <a-button @click="showCreateGameModal = true" type="primary">
            创建游戏
          </a-button>
        </div>
      </div>
    </div>

    <!-- 数据统计 -->
    <div class="stats-section">
      <div class="stats-info">
        <div class="total-count">
          {{ selectedUserId ? `用户 "${getSelectedUserName()}" ${displayMode === 'owned' ? '拥有' : '未拥有'} ${filteredGames.length} 个游戏` : `系统中共有 ${games.length} 个游戏，当前显示 ${filteredGames.length} 条记录` }}
        </div>
      </div>
    </div>

    <!-- 用户选择器 -->
    <div class="user-selector">
      <div class="selector-item">
        <label>选择用户：</label>
        <select
          v-model="selectedUserId"
          @change="filterGamesByUser"
          :disabled="userLoading"
          class="user-select"
        >
          <option value="">显示所有游戏</option>
          <option
            v-for="user in sortedUsers.filter(u => u.id !== Number(userStore.userInfo?.accountId))"
            :key="user.id"
            :value="user.id"
          >
            {{ user.name || user.username }} ({{ user.username }})
          </option>
        </select>
        <span v-if="userLoading" class="loading-text">加载中...</span>
      </div>
      <div v-if="selectedUserId" class="selector-item">
        <label>显示模式：</label>
        <select
          v-model="displayMode"
          @change="filterGamesByUser"
          class="user-select"
        >
          <option value="owned">显示拥有的游戏</option>
          <option value="unowned">显示未拥有的游戏</option>
        </select>
      </div>
      <div v-if="canFilterByEntityType" class="selector-item">
        <label>内部/外部：</label>
        <div class="radio-group">
          <label class="radio-option">
            <input
              type="radio"
              v-model="selectedEntityType"
              value=""
              @change="filterGamesByEntity"
            />
            <span>显示所有</span>
          </label>
          <label class="radio-option">
            <input
              type="radio"
              v-model="selectedEntityType"
              value="internal"
              @change="filterGamesByEntity"
            />
            <span>内部</span>
          </label>
          <label class="radio-option">
            <input
              type="radio"
              v-model="selectedEntityType"
              value="external"
              @change="filterGamesByEntity"
            />
            <span>外部</span>
          </label>
        </div>
      </div>
      <div class="selector-item">
        <label>选择主体：</label>
        <select
          v-model="selectedEntityName"
          @change="filterGamesByEntity"
          :disabled="entityLoading"
          class="user-select"
        >
          <option value="">显示所有主体</option>
          <option
            v-for="entity in filteredEntities"
            :key="entity?.id || entity"
            :value="entity?.name || entity"
          >
            {{ entity?.name || entity }}
          </option>
        </select>
        <span v-if="entityLoading" class="loading-text">加载中...</span>
      </div>
    </div>

    <!-- 游戏列表 -->
    <div v-if="isInitialized" class="games-section">
      <a-card title="游戏列表" class="games-card">
        <template #extra>
           <a-button @click="refreshGames" :loading="loading">
             <template #icon>
               <icon-refresh />
             </template>
             刷新
           </a-button>
           <a-popconfirm
             v-if="canBulkAssign && selectedUserId && displayMode === 'unowned' && filteredGames.length > 0"
             :title="`确定要为用户批量分配${selectedEntityName ? '当前主体下' : '所有'}的游戏权限吗？`"
             ok-text="确定分配"
             cancel-text="取消"
             @ok="bulkAssignGames"
           >
             <template #content>
               <div style="color: #1890ff; font-weight: 500;">
                 此操作将为用户 "{{ getSelectedUserName() }}" 分配{{ selectedEntityName ? `当前主体（${selectedEntityName}）下` : '所有' }}未拥有的游戏权限。<br>
                 共需分配 {{ filteredGames.length }} 个游戏权限。
               </div>
             </template>
             <a-button type="primary" :loading="bulkAssigning">
               <template #icon>
                 <icon-plus />
               </template>
               一键分配{{ selectedEntityName ? '当前主体' : '全部' }}游戏
             </a-button>
           </a-popconfirm>
           <a-popconfirm
             v-if="canBulkRemove && selectedUserId && displayMode === 'owned' && filteredGames.length > 0"
             :title="`确定要为用户批量移除${selectedEntityName ? '当前主体下' : '所有'}的游戏权限吗？`"
             ok-text="确定移除"
             cancel-text="取消"
             @ok="bulkRemoveGames"
           >
             <template #content>
               <div style="color: #ff4d4f; font-weight: 500;">
                 此操作将移除用户 "{{ getSelectedUserName() }}" {{ selectedEntityName ? `当前主体（${selectedEntityName}）下` : '所有' }}已拥有的游戏权限。<br>
                 共需移除 {{ filteredGames.length }} 个游戏权限。
               </div>
             </template>
             <a-button type="primary" danger :loading="bulkRemoving">
               <template #icon>
                 <icon-delete />
               </template>
               一键移除{{ selectedEntityName ? '当前主体' : '全部' }}游戏
             </a-button>
           </a-popconfirm>
         </template>

        <a-table
          :columns="gameColumns"
          :data="filteredGames"
          :loading="loading"
          row-key="id"
          :pagination="pagination"
          @change="handleTableChange"
        >
          <template #game_name="{ record }">
            <div class="game-info">
              <div class="game-name">{{ record.name }}</div>
              <div class="game-appid">AppID: {{ record.appid }}</div>
            </div>
          </template>



          <template #ad_info="{ record }">
            <div class="ad-info">
              <div v-if="record.advertiser_id" class="ad-item">
                <span class="ad-label">广告主ID:</span>
                <span class="ad-value">{{ record.advertiser_id }}</span>
              </div>
              <div v-if="record.promotion_id" class="ad-item">
                <span class="ad-label">广告ID:</span>
                <span class="ad-value">{{ record.promotion_id }}</span>
              </div>
              <div v-if="!record.advertiser_id && !record.promotion_id" class="no-ad">
                未设置
              </div>
            </div>
          </template>

          <template #assigned_users_count="{ record }">
            <div class="assigned-users-list">
              <div v-if="record.assigned_users && getFilteredAssignedUsers(record.assigned_users).length > 0" class="users-container">
                <div
                  v-for="userGame in getFilteredAssignedUsers(record.assigned_users).slice(0, 3)"
                  :key="userGame.id"
                  class="user-tag"
                >
                  {{ userGame.user?.name || userGame.user?.username || '未知用户' }}
                </div>
                <div v-if="getFilteredAssignedUsers(record.assigned_users).length > 3" class="more-users">
                  +{{ getFilteredAssignedUsers(record.assigned_users).length - 3 }}个用户
                </div>
              </div>
              <div v-else class="no-users">
                未分配用户
              </div>
            </div>
          </template>

          <template #created_at="{ record }">
            {{ formatDate(record.created_at) }}
          </template>

          <template #status="{ record }">
            <a-tag
              :color="record.validated ? 'green' : 'orange'"
              size="small"
            >
              {{ record.validated ? '已验证' : '未验证' }}
            </a-tag>
          </template>

          <template #actions="{ record }">
            <a-space>
              <a-button v-if="canEditGame" @click="editGame(record)" type="text" size="small">
                编辑
              </a-button>
              <a-button v-if="canAssign" @click="openAssignModal(record)" type="primary" size="small">
                分配用户
              </a-button>
              <a-popconfirm
                v-if="canModify"
                title="确定要删除此游戏吗？"
                ok-text="确定删除"
                cancel-text="取消"
                @ok="deleteGame(record)"
              >
                <template #content>
                  <div style="color: #ff4d4f; font-weight: 500;">
                    此操作将删除游戏及其所有用户权限。<br>
                    此操作不可恢复！
                  </div>
                </template>
                <a-button type="text" size="small" style="color: #ff4d4f;">
                  删除
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </a-table>
      </a-card>
    </div>

    <!-- 创建游戏模态框 -->
    <div v-if="showCreateGameModal" class="modal-overlay" @click="closeCreateGameModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>创建新游戏</h3>
          <button @click="closeCreateGameModal" class="modal-close">&times;</button>
        </div>

        <div class="modal-body" style="flex: 1; overflow-y: auto;">
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
              placeholder="输入32位App Secret"
              class="form-input"
            />
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

          <div class="form-item" v-if="canViewAdFields">
            <label>广告主ID</label>
            <input
              v-model="newGame.advertiser_id"
              type="text"
              placeholder="输入广告主ID（可选，用于广告预览）"
              class="form-input"
            />
          </div>

          <div class="form-item" v-if="canViewAdFields">
            <label>广告ID</label>
            <input
              v-model="newGame.promotion_id"
              type="text"
              placeholder="输入广告ID（可选，用于广告预览）"
              class="form-input"
            />
          </div>

          <!-- 测试连接区域 -->
          <div class="test-section" v-if="newGame.appid && newGame.appSecret">
            <div class="test-header">
              <h4>🔗 连接测试</h4>
              <div class="test-actions">
                <button
                  @click="fillExampleData"
                  class="btn btn-small"
                  title="填入示例数据（App Secret需要手动填写有效的凭据）"
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

        <div class="modal-footer" style="flex-shrink: 0;">
          <button @click="closeCreateGameModal" class="btn btn-secondary" :disabled="creating">取消</button>
          <button
            @click="createGame"
            :disabled="!newGame.name || !newGame.appid || !newGame.appSecret || creating"
            class="btn btn-primary"
          >
            {{ creating ? '验证中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 编辑游戏模态框 -->
    <div v-if="showEditGameModal" class="modal-overlay">
      <div class="modal-content edit-game-modal" @click.stop>
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
              v-model="editGameData.app_secret"
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

          <div v-if="canEditAdFields" class="form-item">
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

          <div v-if="canEditAdFields" class="form-item">
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
          <div class="test-section" v-if="editGameData.appid && editGameData.app_secret">
            <div v-if="testResult" class="test-result-indicator" :class="{ 'success': testResult.success, 'error': !testResult.success }">
              <a-tooltip :content="getTestResultTooltipContent()" placement="top">
                <div class="test-status">
                  <span class="test-icon">{{ testResult.success ? '✅' : '❌' }}</span>
                  <span class="test-text">{{ testResult.success ? '连接成功' : '连接失败' }}</span>
                </div>
              </a-tooltip>
            </div>
          </div>
        </div>

        <div class="modal-footer">
           <div class="footer-buttons">
             <button
               v-if="editGameData.appid && editGameData.app_secret"
               @click="testEditGameConnection"
               :disabled="testing"
               class="btn btn-outline"
             >
               {{ testing ? '测试中...' : '测试连接' }}
             </button>
             <button @click="closeEditGameModal" class="btn btn-secondary" :disabled="editing">取消</button>
             <button
               @click="updateGame"
               :disabled="!editGameData.name || !editGameData.appid || !editGameData.app_secret || editing"
               class="btn btn-primary"
             >
               {{ editing ? '保存中...' : '保存修改' }}
             </button>
           </div>
         </div>
      </div>
    </div>

    <!-- 分配用户模态框 -->
    <div v-if="showAssignUserModal" class="modal-overlay">
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
              <!-- 已分配的用户（按角色排序） - 只显示，不可选 -->
              <optgroup label="已分配此游戏的用户" v-if="categorizedUsers.assigned.length > 0">
                <option
                  v-for="user in categorizedUsers.assigned"
                  :key="user.id"
                  :value="user.id"
                  disabled
                  style="background-color: #f6ffed; color: #52c41a; font-style: italic;"
                >
                  {{ user.name || user.username }} ({{ user.username }}) - {{ getRoleDisplayName(user.role) }} - 已分配
                </option>
              </optgroup>
              <!-- 未分配的用户（按角色排序） -->
              <optgroup label="未分配此游戏的用户" v-if="categorizedUsers.unassigned.length > 0">
                <option
                  v-for="user in categorizedUsers.unassigned"
                  :key="user.id"
                  :value="user.id"
                >
                  {{ user.name || user.username }} ({{ user.username }}) - {{ getRoleDisplayName(user.role) }}
                </option>
              </optgroup>
              <!-- 如果没有用户可选 -->
              <option v-if="categorizedUsers.assigned.length === 0 && categorizedUsers.unassigned.length === 0" disabled>
                暂无可分配用户
              </option>
            </select>
            <div class="form-hint">
              <small>💡 用户按角色等级排序，已分配用户标绿且不可选择；未分配用户可选择分配；显示格式：姓名(用户名) - 角色</small>
            </div>
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
    <div v-if="showUserGamesModal" class="modal-overlay">
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
    <div v-if="showGameUsersModal" class="modal-overlay">
      <div class="modal-content large-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedGame?.name }} 的用户列表</h3>
          <button @click="closeGameUsersModal" class="modal-close">&times;</button>
        </div>

        <div class="modal-body">
          <!-- 批量操作区域 -->
          <div v-if="gameUsers.length > 0 && canBulkRemove" class="bulk-actions">
            <div class="bulk-actions-content">
              <span class="bulk-info">共 {{ gameUsers.length }} 个用户拥有权限</span>
              <a-button
                type="primary"
                danger
                @click="confirmRemoveAllUserGames"
                :loading="removingAll"
                size="small"
              >
                <template #icon>
                  <icon-delete />
                </template>
                一键移除全部权限
              </a-button>
            </div>
          </div>

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
import { Message } from '@arco-design/web-vue';
import { IconRefresh } from '@arco-design/web-vue/es/icon';
import { useUserStore } from '@/store';
import request from '@/utils/request';
import Breadcrumb from '@/components/breadcrumb/index.vue';

// 响应式数据
const games = ref([]);
const users = ref([]);
const loading = ref(false);
const userLoading = ref(false);

// 筛选数据
const selectedUserId = ref('');
const selectedEntityType = ref('');
const selectedEntityName = ref('');
const gameStatusFilter = ref('');
const displayMode = ref('owned'); // 'owned' 或 'unowned'
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
  app_secret: '',
  description: '',
  advertiser_id: '',
  promotion_id: ''
});

// 分配数据
const assignData = reactive({
  userId: '',
  role: 'viewer'
});

// 获取分类后的用户列表
const categorizedUsers = computed(() => {
  if (!selectedGame.value) return { assigned: [], unassigned: [] };

  try {
    // 获取已分配的用户ID - gameUsers是用户游戏关联记录，每个记录包含user_id
    const assignedUserIds = gameUsers.value.map(gameUser => gameUser.user?.id).filter(id => id !== undefined);

    // 按角色优先级排序用户
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
      'super_viewer': 2,
      'moderator': 4,
      'viewer': 6,
      'user': 9
    };

    // 分类用户
    const assigned = [];
    const unassigned = [];

    sortedUsers.value.forEach(user => {
      // 排除当前用户自己
      if (user.id === Number(userStore.userInfo?.accountId)) return;

      if (assignedUserIds.includes(user.id)) {
        assigned.push(user);
      } else {
        unassigned.push(user);
      }
    });

    // 按角色优先级排序
    const sortByRole = (users) => {
      return users.sort((a, b) => {
        const priorityA = rolePriority[a.role] || 999;
        const priorityB = rolePriority[b.role] || 999;
        return priorityA - priorityB;
      });
    };

    return {
      assigned: sortByRole(assigned),
      unassigned: sortByRole(unassigned)
    };
  } catch (error) {
    console.error('分类用户失败:', error);
    return { assigned: [], unassigned: [] };
  }
});

// 过滤后的主体列表
const filteredEntities = computed(() => {
  // 安全检查：确保entities.value存在且为数组
  if (!entities.value || !Array.isArray(entities.value)) {
    return [];
  }

  // 对于外部老板，不应用内部/外部筛选，因为他们只能看到包含自己游戏的主体
  if (userStore.userInfo?.role === 'external_boss') {
    return entities.value.filter(entity => entity != null);
  }

  if (!selectedEntityType.value) {
    return entities.value.filter(entity => entity != null);
  }

  return entities.value.filter(entity => {
    // 安全检查：确保entity存在且有assigned_user_role字段
    if (!entity || typeof entity !== 'object' || !entity.assigned_user_role) {
      return false;
    }

    // 根据分配用户角色判断内部/外部
    const isInternal = entity.assigned_user_role.startsWith('internal');
    const isExternal = entity.assigned_user_role.startsWith('external');

    if (selectedEntityType.value === 'internal') {
      return isInternal;
    } else if (selectedEntityType.value === 'external') {
      return isExternal;
    }

    return false;
  });
});

// 向后兼容的计算属性
const assignedUsers = computed(() => categorizedUsers.value.assigned);
const unassignedUsers = computed(() => categorizedUsers.value.unassigned);

// 状态
const creating = ref(false);
const editing = ref(false);
const testing = ref(false);
const assigning = ref(false);
const removingAll = ref(false);
const bulkAssigning = ref(false);
const bulkRemoving = ref(false);
const testResult = ref(null);
const isInitialized = ref(false);
const entityLoading = ref(false);

// 广告测试相关
const adTesting = ref(false);
const adTestResult = ref(null);

// 主体数据
const entities = ref([]);

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true
});

// 用户权限检查
const userStore = useUserStore();
const isAdmin = computed(() => userStore.userInfo?.role === 'admin' || userStore.userInfo?.role === 'clerk');
const canModify = computed(() => {
  const role = userStore.userInfo?.role;
  return ['admin', 'clerk', 'external_boss'].includes(role || '');
}); // admin、clerk和external_boss可以修改（创建、编辑、删除）
const canEditGame = computed(() => {
  const role = userStore.userInfo?.role;
  return ['admin', 'clerk', 'external_boss'].includes(role || '');
}); // 管理员、文员和外部老板可以编辑游戏
const canAssign = computed(() => {
  const role = userStore.userInfo?.role;
  return ['admin', 'internal_boss', 'external_boss', 'internal_service', 'external_service','clerk'].includes(role || '');
}); // 管理员、老板和客服可以分配游戏
const canBulkAssign = computed(() => {
  const role = userStore.userInfo?.role;
  return ['admin', 'internal_boss', 'internal_service','clerk'].includes(role || '');
}); // 只有管理员、内部老板和内部客服可以看见一键分配按钮
const canBulkRemove = computed(() => {
  const role = userStore.userInfo?.role;
  return ['admin', 'internal_boss', 'internal_service','clerk'].includes(role || '');
}); // 只有管理员、内部老板和内部客服可以看见一键移除按钮
const canFilterByEntityType = computed(() => {
  const role = userStore.userInfo?.role;
  return ['admin', 'clerk'].includes(role || ''); // 只有管理员和文员可以看到内部/外部筛选
});
const canEditAdFields = computed(() => {
  const role = userStore.userInfo?.role;
  return ['admin', 'clerk'].includes(role || '');
}); // 只有管理员和文员可以编辑广告主ID和广告ID
const canViewAdFields = computed(() => {
  const role = userStore.userInfo?.role;
  return ['admin', 'clerk'].includes(role || '');
}); // 只有管理员和文员可以查看广告主ID和广告ID（外部老板不能查看）

// 按权限高低排序用户列表
const sortedUsers = computed(() => {
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
    'clerk': 12,
    // 兼容旧角色名称
    'super_viewer': 2, // internal_boss
    'moderator': 4, // internal_service
    'viewer': 6, // internal_user_1
    'user': 9 // external_user_1
  };

  return [...users.value].sort((a, b) => {
    const priorityA = rolePriority[a.role] || 999;
    const priorityB = rolePriority[b.role] || 999;
    return priorityA - priorityB;
  });
});

// 获取选中用户的名称
const getSelectedUserName = () => {
  if (!selectedUserId.value) return '';
  const user = users.value.find(u => u.id === Number(selectedUserId.value));
  return user ? (user.name || user.username) : '';
};

// 过滤分配用户列表，排除当前用户自己
const getFilteredAssignedUsers = (assignedUsers) => {
  if (!assignedUsers) return [];
  const currentUserId = Number(userStore.userInfo?.accountId);
  return assignedUsers.filter(userGame => userGame.user_id !== currentUserId);
};

// 获取测试结果提示框内容
const getTestResultTooltipContent = () => {
  if (!testResult.value) return '';
  let content = testResult.value.message;
  if (testResult.value.success && testResult.value.token) {
    content += `\nToken: ${testResult.value.token}\n有效期: ${testResult.value.expiresIn}秒`;
  }
  return content;
};

// 游戏表格列配置
const gameColumns = computed(() => [
  {
    title: '游戏信息',
    slotName: 'game_name',
    width: 250
  },
  ...(canViewAdFields.value ? [{
    title: '广告信息',
    slotName: 'ad_info',
    width: 200
  }] : []),
  ...(canModify.value ? [{
    title: '创建时间',
    dataIndex: 'created_at',
    slotName: 'created_at',
    width: 120
  }] : []),
  {
    title: '分配用户',
    slotName: 'assigned_users_count',
    width: 150
  },
  {
    title: '操作',
    dataIndex: 'actions',
    slotName: 'actions',
    width: 200
  }
]);

// 工具函数
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('zh-CN');
};

// 加载游戏列表（后端已包含主体信息）
const loadGamesWithEntities = async () => {
  console.log('📡 游戏管理页面开始加载游戏列表（包含主体信息）...');
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
      // 隐藏API响应数据日志，避免在控制台输出大量调试信息
      if (result.code === 20000) {
        let gameList = result.data.games;

        // 为每个游戏添加已分配用户信息
        for (let game of gameList) {
          try {
            const usersResponse = await fetch(`/api/game/${game.id}/users`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
              }
            });

            if (usersResponse.ok) {
              const usersResult = await usersResponse.json();
              if (usersResult.code === 20000) {
                game.assigned_users = usersResult.data.users || [];
                game.assigned_users_count = game.assigned_users.length;
              } else {
                game.assigned_users = [];
                game.assigned_users_count = 0;
              }
            } else {
              game.assigned_users = [];
              game.assigned_users_count = 0;
            }
          } catch (error) {
            console.error(`❌ 获取游戏 ${game.id} 的用户信息失败:`, error);
            game.assigned_users = [];
            game.assigned_users_count = 0;
          }
        }

        // 根据用户权限过滤游戏列表
        if (canModify.value) {
          // 管理员可以看到所有游戏
          games.value = gameList;
        } else {
          // 非管理员只能看到分配给自己的游戏
          try {
            const userGamesResponse = await fetch(`/api/game/user-games/${userStore.userInfo?.accountId}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
              }
            });

            if (userGamesResponse.ok) {
              const userGamesResult = await userGamesResponse.json();
              if (userGamesResult.code === 20000) {
                // 使用用户游戏列表，但保留完整的游戏信息并获取完整的分配用户信息
                const userGames = userGamesResult.data.games;
                games.value = await Promise.all(userGames.map(async (userGame) => {
                  const game = userGame.game;

                  // 获取该游戏的完整分配用户信息
                  try {
                    const usersResponse = await fetch(`/api/game/${game.id}/users`, {
                      method: 'GET',
                      headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                      }
                    });

                    if (usersResponse.ok) {
                      const usersResult = await usersResponse.json();
                      if (usersResult.code === 20000) {
                        game.assigned_users = usersResult.data.users || [];
                        game.assigned_users_count = game.assigned_users.length;
                      } else {
                        game.assigned_users = [];
                        game.assigned_users_count = 0;
                      }
                    } else {
                      game.assigned_users = [];
                      game.assigned_users_count = 0;
                    }
                  } catch (error) {
                    console.error(`❌ 获取游戏 ${game.id} 的用户信息失败:`, error);
                    game.assigned_users = [];
                    game.assigned_users_count = 0;
                  }

                  return game;
                }));
                console.log('✅ 用户游戏列表加载成功:', games.value.length, '个游戏');
              } else {
                games.value = [];
                console.log('❌ 获取用户游戏失败，使用空列表');
              }
            } else {
              games.value = [];
              console.log('❌ 获取用户游戏请求失败，使用空列表');
            }
          } catch (error) {
            console.error('❌ 获取用户游戏时出错:', error);
            games.value = [];
          }
        }

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

// 处理表格变化
const handleTableChange = (newPagination: any) => {
  // 更新分页参数
  pagination.current = newPagination.current;
  pagination.pageSize = newPagination.pageSize;
  // 前端分页不需要重新加载数据
};

// 统一的筛选函数 - 处理所有筛选条件的组合
const applyAllFilters = async () => {
  let filtered = [...games.value];

  // 1. 按用户筛选（包括显示模式）
  if (selectedUserId.value) {
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

          if (displayMode.value === 'owned') {
            // 显示拥有的游戏
            filtered = filtered.filter(game => userGameIds.includes(game.id));
          } else {
            // 显示未拥有的游戏
            filtered = filtered.filter(game => !userGameIds.includes(game.id));
          }
        }
      }
    } catch (error) {
      console.error('获取用户游戏失败:', error);
    }
  } else if (!canModify.value) {
    // 非管理员且没有选择特定用户时，默认显示自己拥有的游戏
    try {
      const userGamesResponse = await fetch(`/api/game/user-games/${userStore.userInfo?.accountId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (userGamesResponse.ok) {
        const userGamesResult = await userGamesResponse.json();
        if (userGamesResult.code === 20000) {
          const userGameIds = userGamesResult.data.games.map(userGame => userGame.game?.id).filter(id => id !== undefined);
          filtered = filtered.filter(game => userGameIds.includes(game.id));
        } else {
          filtered = [];
        }
      } else {
        filtered = [];
      }
    } catch (error) {
      console.error('获取用户游戏失败:', error);
      filtered = [];
    }
  }

  // 2. 按内部/外部筛选主体（只有有权限的用户才能使用此筛选）
  if (canFilterByEntityType.value && selectedEntityType.value && selectedEntityType.value !== '') {
    // 获取符合条件的主体
    const matchingEntities = filteredEntities.value;
    const matchingEntityNames = matchingEntities.map(entity => entity.name);

    filtered = filtered.filter(game => {
      if (game.entity_names) {
        const entityNames = game.entity_names.split('、');
        // 检查游戏是否属于符合条件的主体
        return entityNames.some(entityName => matchingEntityNames.includes(entityName));
      }
      return false;
    });
  }

  // 3. 按主体名称筛选
  if (selectedEntityName.value) {
    console.log('🔍 [主体筛选] 开始筛选，选择的主体:', selectedEntityName.value);
    console.log('🔍 [主体筛选] 筛选前游戏数量:', filtered.length);

    filtered = filtered.filter(game => {
      if (game.entity_name) {
        const entityNames = game.entity_name.split('、');
        const includes = entityNames.includes(selectedEntityName.value);
        console.log(`🔍 [主体筛选] 游戏"${game.name}" -> entity_name:"${game.entity_name}" -> 包含主体"${selectedEntityName.value}":${includes}`);
        return includes;
      } else {
        console.log(`🔍 [主体筛选] 游戏"${game.name}" -> 无entity_name字段，过滤掉`);
        return false;
      }
    });

    console.log('🔍 [主体筛选] 筛选后游戏数量:', filtered.length);
  }

  // 4. 按状态筛选
  if (gameStatusFilter.value) {
    filtered = filtered.filter(game => game.status === gameStatusFilter.value);
  }

  filteredGames.value = filtered;
  pagination.total = filteredGames.value.length;
  isInitialized.value = true;
};

// 向后兼容的筛选函数
const filterGamesByUser = async () => {
  await applyAllFilters();
};

const filterGames = () => {
  applyAllFilters();
};

const filterGamesByEntity = () => {
  applyAllFilters();
};

// 刷新游戏列表
const refreshGames = async () => {
  // 先清空当前显示，避免闪烁
  const currentSelectedUserId = selectedUserId.value;

  if (currentSelectedUserId) {
    // 如果选择了特定用户，直接重新筛选
    await filterGamesByUser();
  } else {
    // 刷新时重新应用所有筛选条件
    await applyAllFilters();
  }
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
  await loadGamesWithEntities();
};

const loadUsers = async () => {
  console.log('📡 游戏管理页面开始加载用户列表...');
  try {
    const response = await fetch('/api/user/list', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 用户列表API响应状态:', response.status);
    if (response.ok) {
      const result = await response.json();
      // 隐藏密码信息，避免在日志中记录密码
      const safeResult = { ...result };
      if (safeResult.data?.users) {
        safeResult.data.users = safeResult.data.users.map(user => ({
          ...user,
          password_plain: '******' // 隐藏密码信息，避免在前端显示明文密码
        }));
      }
      if (result.code === 20000) {
        let userList = result.data.users;

        // 根据当前用户角色过滤用户列表
        const currentUserRole = userStore.userInfo?.role;
        const currentUserId = Number(userStore.userInfo?.accountId);

        if (currentUserRole === 'admin' || currentUserRole === 'clerk') {
          // admin可以看到所有用户
          users.value = userList;
        } else if (['internal_boss', 'external_boss', 'internal_service', 'external_service'].includes(currentUserRole || '')) {
          // 老板和客服只能看到自己创建的用户，以及这些用户创建的用户（递归）
          const managedUserIds = getManagedUserIds(userList, currentUserId);
          users.value = userList.filter(user => managedUserIds.includes(user.id));
        } else {
          // 其他角色看不到用户列表
          users.value = [];
        }

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

// 加载主体列表
const loadEntities = async () => {
  console.log('📡 游戏管理页面开始加载主体列表...');
  entityLoading.value = true;
  try {
    const response = await fetch('/api/entity/list', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 主体列表API响应状态:', response.status);
    if (response.ok) {
      const result = await response.json();
      if (result.code === 20000) {
        let entityList = result.data.entities || [];

        // 根据用户角色决定是否去重
        const currentUserRole = userStore.userInfo?.role;
        if (currentUserRole === 'external_boss') {
          // 外部老板不进行去重，因为同名的主体可能有不同的分配用户角色
          entities.value = entityList;
          console.log('✅ 主体列表加载成功（外部老板，不去重）:', entities.value.length, '个主体');
        } else {
          // 其他用户进行去重，避免下拉列表中出现重复选项
          const uniqueEntities = [];
          const seenNames = new Set();

          entityList.forEach(entity => {
            if (!seenNames.has(entity.name)) {
              seenNames.add(entity.name);
              uniqueEntities.push(entity);
            }
          });

          entities.value = uniqueEntities;
          console.log('✅ 主体列表加载成功（已去重）:', entities.value.length, '个主体');
        }
      } else {
        console.log('❌ 主体列表API返回错误:', result.message);
        entities.value = [];
      }
    } else {
      console.log('❌ 主体列表API请求失败，状态码:', response.status);
      entities.value = [];
    }
  } catch (error) {
    console.error('❌ 加载主体列表失败:', error);
    entities.value = [];
  } finally {
    entityLoading.value = false;
  }
};

const testGameConnection = async () => {
  if (!newGame.appid || !newGame.appSecret) {
    alert('请先填写App ID和App Secret');
    return;
  }

  // 检查App Secret是否为有效的32位格式
  if (newGame.appSecret.length !== 32 || !/^[a-f0-9]{32}$/.test(newGame.appSecret)) {
    alert('App Secret格式不正确，请输入有效的32位App Secret（仅包含小写字母和数字）');
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
        message: `❌ 连接失败: ${result.err_tips || result.message || '未知错误'}`,
        suggestion: '请检查App ID和App Secret是否正确。从抖音开放平台获取有效的凭据。'
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
    const requestData: any = {
      name: newGame.name,
      appid: newGame.appid,
      appSecret: newGame.appSecret,
      description: newGame.description
    };

    // 只有有权限的用户才能设置广告字段
    if (canViewAdFields.value) {
      requestData.advertiser_id = newGame.advertiser_id || undefined;
      requestData.promotion_id = newGame.promotion_id || undefined;
    }

    const response = await fetch('/api/game/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
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
  editGameData.app_secret = game.app_secret || '';
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
  if (!editGameData.appid) {
    alert('请先填写App ID');
    return;
  }

  testing.value = true;
  testResult.value = null;

  try {
    let secretToTest = editGameData.app_secret;

    // 如果是编辑现有游戏且表单中的App Secret为空，从数据库获取实际的App Secret
    if (editGameData.id && !editGameData.app_secret) {
      try {
        const gameResponse = await fetch(`/api/game/${editGameData.id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (gameResponse.ok) {
          const gameResult = await gameResponse.json();
          if (gameResult.code === 20000 && gameResult.data.game.app_secret) {
            secretToTest = gameResult.data.game.app_secret;
          }
        }
      } catch (error) {
        console.warn('获取游戏App Secret失败:', error);
      }
    }

    if (!secretToTest) {
      alert('无法获取App Secret，请重新填写或联系管理员');
      testing.value = false;
      return;
    }

    const response = await fetch('/api/douyin/test-connection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        appid: editGameData.appid,
        secret: secretToTest
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
  if (!editGameData.name || !editGameData.appid || !editGameData.app_secret) {
    alert('请填写完整的游戏信息');
    return;
  }

  editing.value = true;

  try {
    const updateData: any = {
      name: editGameData.name,
      appid: editGameData.appid,
      appSecret: editGameData.app_secret,
      description: editGameData.description
    };

    // 只有有权限的用户才能更新广告字段
    if (canEditAdFields.value) {
      updateData.advertiser_id = editGameData.advertiser_id || undefined;
      updateData.promotion_id = editGameData.promotion_id || undefined;
    }

    const response = await fetch(`/api/game/update/${editGameData.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    const result = await response.json();

    if (response.ok && result.code === 20000) {
      alert('游戏更新成功！');
      closeEditGameModal();

      // 更新本地游戏列表中的对应项，避免重新加载导致的闪烁
      const updatedGame = result.data.game;
      const gameIndex = games.value.findIndex(game => game.id === updatedGame.id);
      if (gameIndex !== -1) {
        games.value[gameIndex] = { ...games.value[gameIndex], ...updatedGame };
      }

      // 重新应用所有筛选条件
      await applyAllFilters();
    } else {
      alert(`更新失败: ${result.message || '未知错误'}`);
    }
  } catch (error) {
    alert(`更新失败: ${error.message}`);
  } finally {
    editing.value = false;
  }
};

const openAssignModal = async (game) => {
  console.log('🎯 打开分配用户模态框，游戏信息:', game);
  selectedGame.value = game;
  assignData.userId = '';
  assignData.role = 'viewer';

  // 获取当前游戏的用户列表，用于过滤已分配的用户
  try {
    console.log('🔄 开始获取游戏用户列表，游戏ID:', game.id);
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
        gameUsers.value = result.data.users || [];
        console.log('✅ 获取游戏用户列表成功:', gameUsers.value.length, '个用户');
        console.log('📋 游戏用户详情:', gameUsers.value.map(u => ({ user_id: u.user_id, user: u.user, raw: u })));
      } else {
        gameUsers.value = [];
        console.log('❌ 获取游戏用户列表失败:', result.message);
      }
    } else {
      gameUsers.value = [];
      console.log('❌ 获取游戏用户列表请求失败，状态码:', response.status);
    }
  } catch (error) {
    console.error('❌ 获取游戏用户列表异常:', error);
    gameUsers.value = [];
  }

  console.log('🎯 分配模态框数据准备完成:', {
    selectedGame: selectedGame.value?.name,
    gameUsersCount: gameUsers.value.length,
    assignedUsersCount: assignedUsers.value.length,
    unassignedUsersCount: unassignedUsers.value.length
  });

  showAssignUserModal.value = true;
};

const assignGameToUser = async () => {
  if (!assignData.userId) {
    alert('请选择用户');
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

// 一键批量分配游戏权限
const bulkAssignGames = async () => {
  if (!selectedUserId.value || filteredGames.value.length === 0) {
    Message.warning('没有游戏可以分配');
    return;
  }

  bulkAssigning.value = true;

  try {
    console.log('🎯 开始批量分配游戏权限');

    const userId = parseInt(selectedUserId.value);

    // 获取所有主体信息，用于检查分配用户角色
    let entities = [];
    try {
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
          entities = entityResult.data.entities || [];
        }
      }
    } catch (error) {
      console.warn('获取主体列表失败:', error);
    }

    // 创建主体名称到分配用户角色的映射
    const entityRoleMap = {};
    entities.forEach(entity => {
      entityRoleMap[entity.name] = entity.assigned_user_role;
    });

    // 过滤掉主体分配用户为外部老板的游戏
    const assignableGames = [];

    for (const game of filteredGames.value) {
      let shouldAssign = true;

      if (game.entity_names) {
        // 获取游戏的主体名称（可能有多个，用"、"分隔）
        const entityNames = game.entity_names.split('、');

        for (const entityName of entityNames) {
          // 检查主体的分配用户角色是否为外部老板
          const assignedUserRole = entityRoleMap[entityName];

          if (assignedUserRole === 'external_boss') {
            console.log(`⚠️ 跳过游戏 "${game.name}" - 主体 "${entityName}" 的分配用户是外部老板`);
            shouldAssign = false;
            break;
          }
        }
      }

      if (shouldAssign) {
        assignableGames.push(game);
      }
    }

    if (assignableGames.length === 0) {
      Message.warning('所有游戏的主体都已分配给外部老板，无法分配');
      return;
    }

    console.log(`📋 可分配游戏数量: ${assignableGames.length}/${filteredGames.value.length}`);

    const assignPromises = assignableGames.map(game =>
      fetch('/api/game/assign', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userId,
          gameId: game.id,
          role: 'viewer' // 默认分配查看者权限
        })
      })
    );

    const responses = await Promise.all(assignPromises);
    const results = await Promise.all(responses.map(r => r.json()));

    // 检查所有请求是否成功
    const successCount = results.filter(result => result.code === 20000).length;
    const failCount = results.length - successCount;
    const skippedCount = filteredGames.value.length - assignableGames.length;

    let message = `✅ 批量分配完成！\n成功分配 ${successCount} 个游戏权限`;
    if (failCount > 0) {
      message += `，失败 ${failCount} 个`;
    }
    if (skippedCount > 0) {
      message += `，跳过 ${skippedCount} 个（主体分配用户为外部老板）`;
    }

    if (failCount === 0) {
      Message.success(message);
    } else {
      Message.warning(message);
    }

    // 重新加载游戏列表以反映分配结果
    await applyAllFilters();
  } catch (error) {
    console.error('批量分配游戏权限失败:', error);
    Message.error(`❌ 批量分配失败: ${error.message}`);
  } finally {
    bulkAssigning.value = false;
  }
};

// 一键批量移除游戏权限
const bulkRemoveGames = async () => {
  if (!selectedUserId.value || filteredGames.value.length === 0) {
    Message.warning('没有游戏可以移除');
    return;
  }

  bulkRemoving.value = true;

  try {
    console.log('🗑️ 开始批量移除游戏权限');

    const userId = parseInt(selectedUserId.value);

    const removePromises = filteredGames.value.map(game =>
      fetch(`/api/game/remove/${userId}/${game.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
    );

    const responses = await Promise.all(removePromises);
    const results = await Promise.all(responses.map(r => r.json()));

    // 检查所有请求是否成功
    const successCount = results.filter(result => result.code === 20000).length;
    const failCount = results.length - successCount;

    let message = `✅ 批量移除完成！\n成功移除 ${successCount} 个游戏权限`;
    if (failCount > 0) {
      message += `，失败 ${failCount} 个`;
    }

    if (failCount === 0) {
      Message.success(message);
    } else {
      Message.warning(message);
    }

    // 重新加载游戏列表以反映移除结果
    await applyAllFilters();
  } catch (error) {
    console.error('批量移除游戏权限失败:', error);
    Message.error(`❌ 批量移除失败: ${error.message}`);
  } finally {
    bulkRemoving.value = false;
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

// 确认一键移除全部用户游戏权限
const confirmRemoveAllUserGames = async () => {
  if (!selectedGame.value || gameUsers.value.length === 0) {
    return;
  }

  const confirmed = confirm(`确定要移除游戏 "${selectedGame.value.name}" 的全部用户权限吗？\n\n这将移除 ${gameUsers.value.length} 个用户的权限，此操作不可恢复！`);

  if (confirmed) {
    await removeAllUserGames();
  }
};

// 一键移除全部用户游戏权限
const removeAllUserGames = async () => {
  if (!selectedGame.value) {
    return;
  }

  removingAll.value = true;

  try {
    // 批量移除所有用户的游戏权限
    const removePromises = gameUsers.value.map(userGame =>
      fetch(`/api/game/remove/${userGame.user_id}/${userGame.game_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
    );

    const responses = await Promise.all(removePromises);
    const results = await Promise.all(responses.map(r => r.json()));

    // 检查所有请求是否成功
    const successCount = results.filter(result => result.code === 20000).length;
    const failCount = results.length - successCount;

    if (failCount === 0) {
      alert(`✅ 批量移除成功！\n已移除 ${successCount} 个用户的游戏权限。`);
    } else {
      alert(`⚠️ 批量移除完成！\n成功移除 ${successCount} 个用户权限，失败 ${failCount} 个。`);
    }

    // 重新加载游戏用户列表
    await viewGameUsers(selectedGame.value);
  } catch (error) {
    console.error('批量移除用户游戏权限失败:', error);
    alert(`❌ 批量移除失败: ${error.message}`);
  } finally {
    removingAll.value = false;
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

// 填入示例数据
const fillExampleData = () => {
  newGame.appid = 'tt8c62fadf136c334702';
  newGame.appSecret = ''; // 不设置示例App Secret，避免测试时使用无效凭据
  newGame.name = '示例游戏应用';
  newGame.description = '这是一个示例游戏应用配置';
  testResult.value = null;
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
  editGameData.app_secret = '';
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

  // 初始化为空列表，避免闪烁
  filteredGames.value = [];

  // 直接调用数据加载，不依赖路由监听
  await loadGames();
  await loadUsers();
  await loadEntities();
  // 对于不能看到内部/外部筛选器的用户，根据角色设置默认筛选
  if (!canFilterByEntityType.value) {
    const role = userStore.userInfo?.role;
    if (role?.startsWith('external')) {
      selectedEntityType.value = 'external';
    } else if (role?.startsWith('internal')) {
      selectedEntityType.value = 'internal';
    }
  }

  // 设置默认筛选：显示所有游戏
  filterGames();

  // 重置显示模式
  displayMode.value = 'owned';
});

// 监听主体选择变化
watch(selectedEntityName, (newVal, oldVal) => {
  console.log('🔍 [游戏管理主体选择变化] ===== 开始 =====');
  console.log('🔍 [游戏管理主体选择变化] selectedEntityName 从', oldVal, '变为', newVal);
  console.log('🔍 [游戏管理主体选择变化] 当前游戏列表长度:', games.value.length);
  console.log('🔍 [游戏管理主体选择变化] 当前筛选后游戏列表长度:', filteredGames.value.length);
  console.log('🔍 [游戏管理主体选择变化] 所有游戏详情:', games.value.slice(0, 5).map(g => ({
    name: g.name,
    entity_name: g.entity_name,
    g:g
  })));
    console.log('🔍 [游戏管理主体选择变化] 主体选项:', filteredEntities.value.map(opt => ({ g: opt?.entity_names, name: opt?.entity_names })));

  console.log('🔍 [游戏管理主体选择变化] 主体选项:', filteredEntities.value.map(opt => ({ id: opt?.id, name: opt?.name })));
  console.log('🔍 [游戏管理主体选择变化] 筛选过程详情:');
  games.value.slice(0, 10).forEach(game => {
    const gameEntityNames = game.entity_name ? game.entity_name.split('、') : [];
    const isEntityMatch = newVal ? gameEntityNames.includes(newVal) : true;
    const result = isEntityMatch;
    console.log(`  🎮 游戏"${game.name}" -> 主体列表"${game.entity_name}" | 实体匹配:${isEntityMatch} | 结果:${result}`);
  });
  console.log('🔍 [游戏管理主体选择变化] ===== 结束 =====');
}, { immediate: true });

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
        await loadEntities();
        // 重新应用筛选
        if (!canModify.value && userStore.userInfo?.accountId) {
          selectedUserId.value = userStore.userInfo.accountId.toString();
          displayMode.value = 'owned'; // 非管理员默认显示拥有的游戏
          await filterGamesByUser();
        } else {
          filterGames();
        }
      }, 100);
    }
  },
  { immediate: false } // 移除immediate，避免重复初始化
);
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

  @media (max-width: 768px) {
    .header-content {
      flex-direction: column;
      gap: 16px;
    }
  }
}

/* 用户选择器 */
.user-selector {
  margin-bottom: 32px;
  background: linear-gradient(135deg, #fff 0%, #f8f9ff 100%);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(102, 126, 234, 0.1);
  animation: slideInFromLeft 0.8s ease-out 0.2s both;
  display: flex;
  gap: 16px;
  align-items: flex-start;

  .selector-item {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
    flex: 1;

    label {
      font-weight: 600;
      color: #1d2129;
      white-space: nowrap;
      font-size: 16px;
      display: flex;
      align-items: center;
      gap: 8px;

      // &::before {
      //   content: "👤";
      //   font-size: 18px;
      // }
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

    .radio-group {
      display: flex;
      gap: 16px;
      align-items: center;
      min-height: 44px; /* 与select元素高度保持一致 */
      padding: 12px 0; /* 保持垂直对齐 */
    }

    .radio-option {
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      font-size: 14px;
      color: #1d2129;
      font-weight: 500;
      transition: all 0.3s ease;

      &:hover {
        color: #667eea;
      }

      input[type="radio"] {
        appearance: none;
        width: 18px;
        height: 18px;
        border: 2px solid #e5e6eb;
        border-radius: 50%;
        background: white;
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;

        &:checked {
          border-color: #667eea;
          background: #667eea;

          &::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 6px;
            height: 6px;
            background: white;
            border-radius: 50%;
          }
        }

        &:hover:not(:checked) {
          border-color: #667eea;
        }

        &:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
      }

      span {
        user-select: none;
      }
    }
  }
}

/* 游戏列表 */
.games-section {
  margin-top: 32px;
  animation: slideInFromBottom 0.8s ease-out 0.4s both;

  .games-card {
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
        content: "🎮";
        font-size: 20px;
      }
    }

    .arco-card-body {
      padding: 24px;
    }

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

    .assigned-users-list {
      .users-container {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        align-items: center;
      }

      .user-tag {
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
        color: #667eea;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 500;
        border: 1px solid rgba(102, 126, 234, 0.2);
        white-space: nowrap;
        max-width: 80px;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .more-users {
        color: #86909c;
        font-size: 11px;
        font-style: italic;
        padding: 2px 4px;
      }

      .no-users {
        color: #86909c;
        font-style: italic;
        font-size: 12px;
        display: flex;
        align-items: center;
        gap: 6px;

        &::before {
          content: "👤";
          font-size: 14px;
          opacity: 0.5;
        }
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
  color: #1d2129;
}

.role-badge.admin {
  background: #fff2f0;
  color: #ff4d4f;
}

.role-badge.user {
  background: #f6ffed;
  color: #52c41a;
}

.role-badge.viewer {
  background: #e6f7ff;
  color: #1890ff;
}

.role-badge.editor {
  background: #f6ffed;
  color: #52c41a;
}

.role-badge.owner {
  background: #fff7e6;
  color: #fa8c16;
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

.btn-secondary {
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
  color: #1d2129;
  border: 1px solid #d9d9d9;
}

.btn-secondary:hover:not(:disabled) {
  background: linear-gradient(135deg, #e8e8e8 0%, #d0d0d0 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.btn-outline {
  border: 2px solid #667eea;
  background: white;
  color: #667eea;
  font-weight: 500;
}

.btn-outline:hover:not(:disabled) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
}

.btn-ad-test {
  background: linear-gradient(135deg, #ff9a56 0%, #ff6b35 100%);
  color: white;
  border: 1px solid #ff6b35;
}

.btn-ad-test:hover:not(:disabled) {
  background: linear-gradient(135deg, #ff7a36 0%, #ff4d15 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 107, 53, 0.3);
}

.btn-danger {
  background: linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: linear-gradient(135deg, #cf1322 0%, #a8071a 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 77, 79, 0.3);
}

.btn-small {
  padding: 8px 16px;
  font-size: 12px;
  border-radius: 8px;
}

/* 表单样式 */
.form-item {
  margin-bottom: 20px;
}

.edit-game-modal .form-item {
  margin-bottom: 16px;
}

.edit-game-modal .form-item label {
  margin-bottom: 6px;
  font-size: 13px;
}

.edit-game-modal .form-input {
  padding: 10px 14px;
  font-size: 13px;
}

.edit-game-modal .form-hint small {
  font-size: 11px;
}

.form-item label {
  display: block;
  font-weight: 600;
  color: #1d2129;
  margin-bottom: 10px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;

  &::before {
    content: "📝";
    font-size: 16px;
  }
}

.form-input {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid #e8e8e8;
  border-radius: 12px;
  font-size: 14px;
  transition: all 0.3s ease;
  background: white;
  font-family: inherit;

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

.form-input select {
  cursor: pointer;
}

.form-input textarea {
  resize: vertical;
  min-height: 100px;
  line-height: 1.6;
}

.form-hint {
  margin-top: 8px;
  color: #86909c;
  font-size: 12px;
}

.form-hint small {
  display: block;
  line-height: 1.5;
  display: flex;
  align-items: flex-start;
  gap: 6px;

  &::before {
    content: "💡";
    font-size: 14px;
    flex-shrink: 0;
    margin-top: 1px;
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
  max-width: 600px;
  width: 90%;
  height: 90vh;
  border: 1px solid rgba(102, 126, 234, 0.1);
  animation: slideInScale 0.4s ease-out;
  display: flex;
  flex-direction: column;
}

.edit-game-modal {
  max-height: 90vh;
}

.edit-game-modal .modal-header {
  padding: 20px 24px;
}

.edit-game-modal .modal-body {
  padding: 20px 24px;
}

.edit-game-modal .modal-footer {
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-buttons {
  display: flex;
  gap: 16px;
}

.large-modal {
  max-width: 800px;
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
  display: flex;
  align-items: center;
  gap: 8px;

  &::before {
    content: "🎯";
    font-size: 24px;
  }
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

/* 测试连接区域 */
.test-section {
  margin-top: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.test-result-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
}

.test-result-indicator.success {
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  color: #52c41a;
}

.test-result-indicator.error {
  background: #fff2f0;
  border: 1px solid #ffccc7;
  color: #ff4d4f;
}

.test-status {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.test-icon {
  font-size: 14px;
}

.test-text {
  font-weight: 500;
}

/* 游戏信息区域 */
.game-info-section {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 6px;
  margin-bottom: 20px;
}

/* 批量操作区域 */
.bulk-actions {
  background: linear-gradient(135deg, #fff5f5 0%, #ffebe9 100%);
  border: 1px solid #ffccc7;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.bulk-actions-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.bulk-info {
  font-weight: 600;
  color: #1d2129;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.bulk-info::before {
  content: "👥";
  font-size: 16px;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .container {
    padding: 16px;
  }

  .page-header {
    padding: 20px;
  }

  .page-header h2 {
    font-size: 28px;
  }

  .user-selector {
    padding: 20px;
  }

  .selector-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .user-select {
    width: 100%;
  }

  .games-card .arco-card-body {
    padding: 16px;
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

  .modal-footer .btn,
  .footer-buttons .btn {
    width: 100%;
  }

  .edit-game-modal .modal-footer {
    flex-direction: column;
    gap: 8px;
  }

  .footer-buttons {
    display: flex;
    flex-direction: column;
    gap: 8px;
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

