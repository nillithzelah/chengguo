<template>
  <div class="container">
    <Breadcrumb :items="['menu.user', 'menu.user.entity']" />

    <!-- 页面标题 -->
    <div class="page-header">
      <h2>主体管理</h2>
      <p>管理系统中的主体信息</p>
    </div>

    <!-- 数据统计 -->
    <div class="stats-section">
      <div class="stats-info">
        <div class="total-count">系统中共有 {{ uniqueEntityCount }} 个主体</div>
      </div>
    </div>

    <!-- 操作栏 -->
    <div class="action-bar">
      <!-- 隐藏新增主体按钮，只有管理员可见 -->
      <a-button
        v-if="canCreateEntity"
        type="primary"
        @click="openCreateModal"
      >
        <template #icon>
          <icon-plus />
        </template>
        新增主体
      </a-button>
      <a-button
        v-if="canCreateEntity"
        @click="handleEditEntityName"
      >
      <icon-edit />
      <template #icon>
        </template>
        修改主体名
      </a-button>
      <!-- 分配游戏主体按钮 -->
      <a-button
        v-if="canCreateEntity"
        @click="openAssignModal"
      >
        <template #icon>
          <icon-link />
        </template>
        分配游戏主体
      </a-button>
      <a-button @click="refreshEntityList">
        <template #icon>
          <icon-refresh />
        </template>
        刷新
      </a-button>
    </div>

    <!-- 数据统计 -->
    <div class="stats-section">
      <div class="stats-info">
        <div class="total-count">共有 {{ entityList.length }} 条主体记录</div>
      </div>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-section">
      <div class="filter-row">
        <div class="filter-item">
          <label>搜索主体：</label>
          <a-input
            v-model="searchKeyword"
            @input="handleSearchChange"
            placeholder="输入主体名、程序员或游戏名"
            class="search-input"
            allow-clear
          >
            <template #prefix>
              <icon-search />
            </template>
          </a-input>
        </div>
        <div class="filter-item">
          <label>状态筛选：</label>
          <select
            v-model="statusFilter"
            @change="handleStatusFilterChange"
            class="filter-select"
          >
            <option value="">全部状态</option>
            <option value="游戏创建">游戏创建</option>
            <option value="基础/资质">基础/资质</option>
            <option value="开发/提审">开发/提审</option>
            <option value="游戏备案">游戏备案</option>
            <option value="ICP备案">ICP备案</option>
            <option value="上线运营">上线运营</option>
          </select>
        </div>
        <div class="filter-item">
          <label>分配用户：</label>
          <select
            v-model="assignedUserFilter"
            @change="handleAssignedUserFilterChange"
            class="filter-select"
          >
            <option value="">全部用户</option>
            <option
              v-for="user in assignedUsers"
              :key="user.id"
              :value="user.id"
            >
              {{ user.name || user.username }}
            </option>
          </select>
        </div>
        <div class="filter-item">
          <label>用户类型：</label>
          <select
            v-model="userTypeFilter"
            @change="handleUserTypeFilterChange"
            class="filter-select"
          >
            <option value="">全部类型</option>
            <option value="internal">内部用户</option>
            <option value="external">外部用户</option>
          </select>
        </div>
        <div class="filter-item">
          <a-button @click="clearAllFilters" type="secondary" class="clear-filters-btn">
            <template #icon>
              <icon-refresh />
            </template>
            清除筛选
          </a-button>
        </div>
      </div>
    </div>

    <!-- 主体列表 -->
    <a-table
      :columns="columns"
      :data="entityList"
      :loading="loading"
      :pagination="pagination"
      row-key="id"
      :scroll="{ x: 1700 }"
      @change="handleTableChange"
    >
      <template #empty>
        <div class="empty-state">
          <div class="empty-icon">🏢</div>
          <div class="empty-text">
            <h3>暂无主体数据</h3>
            <p>
              {{ searchKeyword || statusFilter ? '没有找到符合条件的主体' : '系统中还没有主体数据' }}
            </p>
            <div v-if="searchKeyword || statusFilter" class="empty-actions">
              <a-button type="primary" @click="refreshEntityList">
                刷新数据
              </a-button>
            </div>
            <div v-else-if="canCreateEntity" class="empty-actions">
              <a-button type="primary" @click="openCreateModal">
                创建第一个主体
              </a-button>
            </div>
          </div>
        </div>
      </template>

      <template #status="{ record }">
        <a-tag
          :color="getStatusColor(record.status)"
          size="small"
        >
          {{ getStatusText(record.status) }}
        </a-tag>
      </template>

      <template #development_status="{ record }">
        <div class="status-with-action">
          <div v-if="record.game_name" class="current-status-display-compact">
            <div class="status-indicator-compact">
              <span class="status-value-compact">{{ getStatusText(record.development_status) }}</span>
            </div>
            <div class="status-progress-compact">
              <div class="progress-bar-compact">
                <div
                  class="progress-fill-compact"
                  :style="{ width: getProgressWidth(record.development_status || '游戏创建') }"
                ></div>
              </div>
              <div class="progress-steps-compact">
                <span
                  v-for="(status, index) in developmentStatuses"
                  :key="status.value"
                  class="step-dot-compact"
                  :class="{ 'active': isStatusActive(status.value, record.development_status || '游戏创建') }"
                >
                  {{ index + 1 }}
                </span>
              </div>
            </div>
          </div>
          <span v-else class="no-game-status">{{ getStatusText(record.development_status) }}</span>
          <a-button
            v-if="canUpgradeStatus(record.development_status || '游戏创建') && checkCanEditEntity(record) && record.game_name"
            type="text"
            size="small"
            @click="upgradeEntityStatus(record)"
            class="upgrade-btn-inline"
          >
            <template #icon>
              <icon-arrow-up />
            </template>
            升级
          </a-button>
          <a-button
            v-if="canDowngradeStatus(record.development_status || '游戏创建') && checkCanEditEntity(record) && record.game_name"
            type="text"
            size="small"
            @click="downgradeEntityStatus(record)"
            class="downgrade-btn-inline"
            style="color: #fa8c16;"
          >
            <template #icon>
              <icon-arrow-down />
            </template>
            降级
          </a-button>
        </div>
      </template>

      <template #created_at="{ record }">
        {{ formatDateShort(record.created_at) }}
      </template>

      <template #development_status_updated_at="{ record }">
        {{ record.development_status_updated_at ? formatDateShort(record.development_status_updated_at) : '未更新' }}
      </template>

      <template #action="{ record }">
        <a-space>
          <a-button
            v-if="checkCanEditEntity(record)"
            type="text"
            size="small"
            @click="editEntity(record)"
          >
            <template #icon>
              <icon-edit />
            </template>
            编辑
          </a-button>
          <a-button
            v-if="checkCanDeleteEntity(record)"
            type="text"
            size="small"
            danger
            @click="() => { console.log('🖱️ 删除按钮被点击，记录:', record); confirmDeleteEntity(record); }"
          >
            <template #icon>
              <icon-delete />
            </template>
            删除
          </a-button>
        </a-space>
      </template>
    </a-table>

    <!-- 新增主体模态框 -->
    <div v-if="showCreateModal && canCreateEntity" class="modal-overlay">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>新增主体</h3>
          <button @click="resetCreateForm" class="modal-close">&times;</button>
        </div>

        <div class="modal-body">
          <!-- 权限提示 -->
          <div v-if="!canCreateEntity" class="permission-warning">
            <p>您没有权限创建新主体。</p>
          </div>

          <!-- 有权限时显示表单 -->
          <div v-else>
            <div class="form-item">
              <label>主体名</label>
              <input
                v-model="createForm.name"
                type="text"
                placeholder="输入主体名称"
                class="form-input"
                :class="{ 'error': createForm.name && !createFormValidation.name.isValid }"
              />
              <small style="color: #666; margin-top: 4px;">主体的名称</small>
              <small v-if="createForm.name && !createFormValidation.name.isValid" style="color: #ff4d4f; margin-top: 4px;">
                {{ createFormValidation.name.message }}
              </small>
            </div>

            <div class="form-item">
              <label>账号名</label>
              <input
                v-model="createForm.account_name"
                type="text"
                placeholder="输入账号名（可选）"
                class="form-input"
              />
              <small style="color: #666; margin-top: 4px;">账号名（可选）</small>
            </div>

            <div class="form-item">
              <label>分配用户</label>
              <select
                v-model="createForm.assigned_user_id"
                class="form-input"
              >
                <option value="">请选择分配用户</option>
                <option
                  v-for="user in assignedUsers"
                  :key="user.id"
                  :value="user.id"
                >
                  {{ user.name || user.username }} ({{ getRoleText(user.role) }})
                </option>
              </select>
              <small style="color: #666; margin-top: 4px;">选择负责该主体的老板用户</small>
            </div>

            <!-- 可选的游戏分配字段 -->
            <div class="form-section">
              <h4>游戏信息（可选）</h4>
              <p class="section-description">如果需要同时分配游戏，可以填写以下信息</p>
              <div class="form-item">
                <label>游戏名字</label>
                <input
                  v-model="createForm.game_name"
                  type="text"
                  placeholder="输入游戏名称"
                  class="form-input"
                />
                <small style="color: #666; margin-top: 4px;">游戏的名称（可选）</small>
              </div>
              
              <div class="form-item">
                <label>程序员</label>
                <select
                  v-model="createForm.programmer"
                  class="form-input"
                >
                  <option value="">请选择程序员</option>
                  <option value="冯">冯</option>
                  <option value="张">张</option>
                </select>
                <small style="color: #666; margin-top: 4px;">负责该主体的程序员（可选）</small>
              </div>

       

              <div class="form-item">
                <label>开发状态</label>
                <div class="current-status-display">
                  <div class="status-indicator">
                    <span class="status-label">当前状态：</span>
                    <span class="status-value">{{ getStatusText(createForm.development_status || '游戏创建') }}</span>
                  </div>
                  <div class="status-progress">
                    <div class="progress-bar">
                      <div
                        class="progress-fill"
                        :style="{ width: getProgressWidth(createForm.development_status || '游戏创建') }"
                      ></div>
                    </div>
                    <div class="progress-steps">
                      <span
                        v-for="(status, index) in developmentStatuses"
                        :key="status.value"
                        class="step-dot"
                        :class="{ 'active': isStatusActive(status.value, createForm.development_status || '游戏创建') }"
                      >
                        {{ index + 1 }}
                      </span>
                    </div>
                  </div>
                </div>
                <small style="color: #666; margin-top: 4px;">创建时默认为"游戏创建"状态，可在编辑时升级</small>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="resetCreateForm" class="btn btn-secondary" :disabled="createLoading">取消</button>
          <button
            v-if="canCreateEntity"
            @click="handleCreateEntity"
            :disabled="!createForm.name || !createForm.assigned_user_id || createLoading"
            class="btn btn-primary"
          >
            {{ createLoading ? '创建中...' : '创建主体' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 编辑主体模态框 -->
    <div v-if="showEditModal && editEntityInfo" class="modal-overlay">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>编辑主体</h3>
          <button @click="resetEditForm" class="modal-close">&times;</button>
        </div>

        <div class="modal-body">
          <!-- 权限提示 -->
          <div v-if="!canCreateEntity" class="permission-warning">
            <p>您没有权限编辑主体。</p>
          </div>

          <!-- 有权限时显示表单 -->
          <div v-else>
            <div class="form-item">
              <label>游戏名字</label>
              <input
                v-model="editForm.game_name"
                type="text"
                placeholder="输入游戏名称"
                class="form-input"
              />
              <small style="color: #666; margin-top: 4px;">输入游戏的名称</small>
            </div>

            <div class="form-item">
              <label>账号名</label>
              <input
                v-model="editForm.account_name"
                type="text"
                placeholder="输入账号名（可选）"
                class="form-input"
              />
              <small style="color: #666; margin-top: 4px;">账号名（可选）</small>
            </div>

            <div class="form-item">
              <label>程序员</label>
              <select
                v-model="editForm.programmer"
                class="form-input"
              >
                <option value="">请选择程序员</option>
                <option value="冯">冯</option>
                <option value="张">张</option>
              </select>
              <small style="color: #666; margin-top: 4px;">负责该主体的程序员</small>
            </div>

            <div class="form-item">
              <label>主体名</label>
              <select
                v-model="editForm.name"
                class="form-input"
              >
                <option value="">请选择主体</option>
                <option
                  v-for="entity in existingEntities"
                  :key="entity.id"
                  :value="entity.name"
                >
                  {{ entity.name }}
                </option>
              </select>
              <small style="color: #666; margin-top: 4px;">从现有主体中选择</small>
            </div>

            <!-- 开发状态字段 -->
            <div class="form-section">
              <h4>开发状态</h4>
              <p class="section-description">选择当前游戏开发的阶段状态</p>

              <div class="form-item">
                <label>当前状态</label>
                <div class="current-status-display">
                  <div class="status-indicator">
                    <span class="status-label">当前状态：</span>
                    <span class="status-value">{{ getStatusText(editForm.development_status || '游戏创建') }}</span>
                  </div>
                  <div class="status-progress">
                    <div class="progress-bar">
                      <div
                        class="progress-fill"
                        :style="{ width: getProgressWidth(editForm.development_status || '游戏创建') }"
                      ></div>
                    </div>
                    <div class="progress-steps">
                      <span
                        v-for="(status, index) in developmentStatuses"
                        :key="status.value"
                        class="step-dot"
                        :class="{ 'active': isStatusActive(status.value, editForm.development_status || '游戏创建') }"
                      >
                        {{ index + 1 }}
                      </span>
                    </div>
                  </div>
                </div>
                <small style="color: #666; margin-top: 4px;">可在主体列表中直接升级开发状态</small>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="resetEditForm" class="btn btn-secondary" :disabled="editLoading">取消</button>
          <button
            v-if="canCreateEntity"
            @click="handleEditEntity"
            :disabled="!editForm.programmer || !editForm.game_name || !editForm.name || editLoading"
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
            <p>确定要删除主体 <strong>{{ deleteEntityInfo?.name }}</strong> 吗？</p>
            <p class="warning-text">此操作不可撤销，将永久删除该主体及其所有相关数据。</p>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="() => { console.log('❌ 取消删除按钮被点击'); cancelDelete(); }" class="btn btn-secondary" :disabled="deleteLoading">取消</button>
          <button
            @click="() => { console.log('✅ 确认删除按钮被点击'); handleDeleteEntity(); }"
            :disabled="deleteLoading"
            class="btn btn-danger"
          >
            {{ deleteLoading ? '删除中...' : '确认删除' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 分配游戏主体模态框 -->
    <div v-if="showAssignModal && canCreateEntity" class="modal-overlay">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>分配游戏主体</h3>
          <button @click="resetAssignForm" class="modal-close">&times;</button>
        </div>

        <div class="modal-body">
          <!-- 权限提示 -->
          <div v-if="!canCreateEntity" class="permission-warning">
            <p>您没有权限分配游戏主体。</p>
          </div>

          <!-- 有权限时显示表单 -->
          <div v-else>
            <div class="form-item">
              <label>游戏名字</label>
              <input
                v-model="assignForm.game_name"
                type="text"
                placeholder="输入游戏名称"
                class="form-input"
              />
              <small style="color: #666; margin-top: 4px;">输入游戏的名称</small>
            </div>

            <div class="form-item">
              <label>程序员</label>
              <select
                v-model="assignForm.programmer"
                class="form-input"
              >
                <option value="">请选择程序员</option>
                <option value="冯">冯</option>
                <option value="张">张</option>
              </select>
              <small style="color: #666; margin-top: 4px;">负责该主体的程序员</small>
            </div>

            <div class="form-item">
              <label>主体名</label>
              <select
                v-model="assignForm.name"
                class="form-input"
              >
                <option value="">请选择主体</option>
                <option
                  v-for="entity in existingEntities"
                  :key="entity.id"
                  :value="entity.name"
                >
                  {{ entity.name }}
                </option>
              </select>
              <small style="color: #666; margin-top: 4px;">从现有主体中选择</small>
            </div>

            <div class="form-item">
              <label>账号名</label>
              <input
                v-model="assignForm.account_name"
                type="text"
                placeholder="输入账号名（可选）"
                class="form-input"
              />
              <small style="color: #666; margin-top: 4px;">账号名（可选）</small>
            </div>

            <!-- 开发状态字段 -->
            <div class="form-section">
              <h4>开发状态</h4>
              <p class="section-description">选择当前游戏开发的阶段状态</p>

              <div class="form-item">
                <label>当前状态</label>
                <div class="current-status-display">
                  <div class="status-indicator">
                    <span class="status-label">当前状态：</span>
                    <span class="status-value">{{ getStatusText(assignForm.development_status || '游戏创建') }}</span>
                  </div>
                  <div class="status-progress">
                    <div class="progress-bar">
                      <div
                        class="progress-fill"
                        :style="{ width: getProgressWidth(assignForm.development_status || '游戏创建') }"
                      ></div>
                    </div>
                    <div class="progress-steps">
                      <span
                        v-for="(status, index) in developmentStatuses"
                        :key="status.value"
                        class="step-dot"
                        :class="{ 'active': isStatusActive(status.value, assignForm.development_status || '游戏创建') }"
                      >
                        {{ index + 1 }}
                      </span>
                    </div>
                  </div>
                </div>
                <small style="color: #666; margin-top: 4px;">分配时默认为"游戏创建"状态，可在编辑时升级</small>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="resetAssignForm" class="btn btn-secondary" :disabled="createLoading">取消</button>
          <button
            v-if="canCreateEntity"
            @click="handleAssignEntity"
            :disabled="!assignForm.programmer || !assignForm.game_name || !assignForm.name || createLoading"
            class="btn btn-primary"
          >
            {{ createLoading ? '分配中...' : '分配主体' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 修改主体名模态框 -->
    <div v-if="showEditEntityModal && canCreateEntity" class="modal-overlay">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>修改主体名</h3>
          <button @click="resetEditEntityForm" class="modal-close">&times;</button>
        </div>

        <div class="modal-body">
          <!-- 权限提示 -->
          <div v-if="!canCreateEntity" class="permission-warning">
            <p>您没有权限修改主体。</p>
          </div>

          <!-- 有权限时显示表单 -->
          <div v-else>
            <div class="form-item">
              <label>选择主体</label>
              <select
                v-model="editEntityForm.entity_id"
                @change="onEntityChange"
                class="form-input"
              >
                <option value="">请选择要修改的主体</option>
                <option
                  v-for="entity in existingEntities"
                  :key="entity.id"
                  :value="entity.id"
                >
                  {{ entity.name }}
                </option>
              </select>
              <small style="color: #666; margin-top: 4px;">选择要修改的主体</small>
            </div>

            <div class="form-item">
              <label>新主体名</label>
              <input
                v-model="editEntityForm.new_name"
                type="text"
                placeholder="输入新的主体名称"
                class="form-input"
                :class="{ 'error': editEntityForm.new_name && !editEntityFormValidation.new_name.isValid }"
              />
              <small style="color: #666; margin-top: 4px;">输入新的主体名称</small>
              <small v-if="editEntityForm.new_name && !editEntityFormValidation.new_name.isValid" style="color: #ff4d4f; margin-top: 4px;">
                {{ editEntityFormValidation.new_name.message }}
              </small>
            </div>

            <div class="form-item">
              <label>账号名</label>
              <input
                v-model="editEntityForm.account_name"
                type="text"
                placeholder="输入账号名（可选）"
                class="form-input"
              />
              <small style="color: #666; margin-top: 4px;">账号名（可选）</small>
            </div>

            <div class="form-item">
              <label>分配用户</label>
              <select
                v-model="editEntityForm.assigned_user_id"
                class="form-input"
              >
                <option value="">请选择分配用户</option>
                <option
                  v-for="user in assignedUsers"
                  :key="user.id"
                  :value="user.id"
                >
                  {{ user.name || user.username }} ({{ getRoleText(user.role) }})
                </option>
              </select>
              <small style="color: #666; margin-top: 4px;">选择负责该主体的用户</small>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="resetEditEntityForm" class="btn btn-secondary" :disabled="editEntityLoading">取消</button>
          <button
            v-if="canCreateEntity"
            @click="handleUpdateEntity"
            :disabled="!editEntityForm.entity_id || !editEntityForm.new_name || !editEntityForm.assigned_user_id || editEntityLoading"
            class="btn btn-primary"
          >
            {{ editEntityLoading ? '修改中...' : '修改主体' }}
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
  IconSearch,
  IconLink,
  IconArrowUp,
  IconArrowDown
} from '@arco-design/web-vue/es/icon';
import useUserStore from '@/store/modules/user';
import Breadcrumb from '@/components/breadcrumb/index.vue';

// 响应式数据
const loading = ref(false);
const createLoading = ref(false);
const deleteLoading = ref(false);
const editLoading = ref(false);
const editEntityLoading = ref(false);
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showEditEntityModal = ref(false);
const showDeleteModal = ref(false);
const showAssignModal = ref(false);
const entityList = ref<any[]>([]);
const deleteEntityInfo = ref<any | null>(null);
const editEntityInfo = ref<any | null>(null);

// 筛选相关
const statusFilter = ref('');
const searchKeyword = ref('');
const assignedUserFilter = ref('');
const userTypeFilter = ref('');
const originalEntityList = ref<any[]>([]); // 保存原始主体列表

// 分配用户选项
const assignedUsers = ref<any[]>([]);

// 现有主体选项
const existingEntities = ref<any[]>([]);

// 用户Store
const userStore = useUserStore();

// 权限检查
const canCreateEntity = computed(() => {
  const role = userStore.userInfo?.role;
  return role === 'admin' || role === 'programmer'; // 管理员和程序员可以创建和编辑主体
});

const canViewEntity = computed(() => {
  const role = userStore.userInfo?.role;
  return ['admin', 'internal_boss', 'external_boss', 'programmer'].includes(role || ''); // 管理员、老板和程序员可以查看主体
});

// 计算去重后的主体数量
const uniqueEntityCount = computed(() => {
  const uniqueEntities = entityList.value.reduce((acc, entity) => {
    if (!acc.find(e => e.name === entity.name)) {
      acc.push(entity);
    }
    return acc;
  }, []);
  return uniqueEntities.length;
});

// 表单验证计算属性
const createFormValidation = computed(() => ({
  name: {
    isValid: createForm.name.trim().length > 0,
    message: createForm.name && !createForm.name.trim() ? '请输入主体名称' : ''
  },
  programmer: {
    isValid: createForm.programmer.trim().length > 0,
    message: createForm.programmer && !createForm.programmer.trim() ? '请输入程序员姓名' : ''
  },
  game_name: {
    isValid: createForm.game_name.trim().length > 0,
    message: createForm.game_name && !createForm.game_name.trim() ? '请输入游戏名称' : ''
  }
}));

const editFormValidation = computed(() => ({
  name: {
    isValid: editForm.name.trim().length > 0,
    message: editForm.name && !editForm.name.trim() ? '请输入主体名称' : ''
  },
  programmer: {
    isValid: editForm.programmer.trim().length > 0,
    message: editForm.programmer && !editForm.programmer.trim() ? '请输入程序员姓名' : ''
  }
}));

const editEntityFormValidation = computed(() => ({
  new_name: {
    isValid: editEntityForm.new_name.trim().length > 0,
    message: editEntityForm.new_name && !editEntityForm.new_name.trim() ? '请输入新的主体名称' : ''
  }
}));

// 表单数据
const createForm = reactive({
  name: '',
  programmer: '',
  game_name: '',
  development_status: '',
  assigned_user_id: '',
  account_name: ''
});

const editForm = reactive({
  game_name: '',
  programmer: '',
  name: '',
  development_status: '',
  account_name: ''
});

const editEntityForm = reactive({
  entity_id: '',
  new_name: '',
  assigned_user_id: '',
  account_name: ''
});

// 开发状态选项
const developmentStatuses = [
  { value: '游戏创建', label: '游戏创建' },
  { value: '基础/资质', label: '基础/资质' },
  { value: '开发/提审', label: '开发/提审' },
  { value: '游戏备案', label: '游戏备案' },
  { value: 'ICP备案', label: 'ICP备案' },
  { value: '上线运营', label: '上线运营' }
];

// 可用游戏列表
const availableGames = ref<any[]>([]);

const assignForm = reactive({
  game_name: '',
  programmer: '',
  name: '',
  development_status: '',
  account_name: ''
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
    title: '主体名',
    dataIndex: 'name',
    width: 150,
    minWidth: 120,
    ellipsis: true
  },
  {
    title: '程序员',
    dataIndex: 'programmer',
    width: 80,
    minWidth: 60,
    ellipsis: true
  },
  {
    title: '游戏名字',
    dataIndex: 'game_name',
    width: 150,
    minWidth: 120,
    ellipsis: true
  },
  {
    title: '开发状态',
    dataIndex: 'development_status',
    slotName: 'development_status',
    width: 220,
    minWidth: 180
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
    title: '开发状态更新时间',
    dataIndex: 'development_status_updated_at',
    slotName: 'development_status_updated_at',
    width: 180,
    minWidth: 160,
    ellipsis: true
  },
  {
    title: '分配用户',
    dataIndex: 'assigned_user_name',
    width: 120,
    minWidth: 100,
    ellipsis: true
  },
  {
    title: '账号名',
    dataIndex: 'account_name',
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
const checkCanEditEntity = (entity: any) => {
  const currentUserRole = userStore.userInfo?.role;
  // 管理员和程序员可以编辑主体
  return currentUserRole === 'admin' || currentUserRole === 'programmer';
};

const checkCanDeleteEntity = (entity: any) => {
  // 管理员和程序员可以删除主体
  const currentUserRole = userStore.userInfo?.role;
  const canDelete = currentUserRole === 'admin' || currentUserRole === 'programmer';

  return canDelete;
};

// 获取状态颜色
const getStatusColor = (status: string) => {
  const colors = {
    '进行中……': 'blue',
    '审核中': 'orange',
    '排队中': 'yellow',
    '暂停中': 'red',
    '1': 'green',
    '游戏创建': 'blue',
    '基础/资质': 'cyan',
    '开发/提审': 'orange',
    '游戏备案': 'purple',
    'ICP备案': 'magenta',
    '上线运营': 'green'
  };
  return colors[status] || 'default';
};


// 获取状态文本
const getStatusText = (status: string) => {
  const texts = {
    '进行中……': '进行中',
    '审核中': '审核中',
    '排队中': '排队中',
    '暂停中': '暂停中',
    '1': '已完成'
  };
  return texts[status] || status;
};

// 获取角色文本显示
const getRoleText = (role: string) => {
  const roleTexts = {
    'admin': '管理员',
    'internal_boss': '内部老板',
    'external_boss': '外部老板',
    'internal_service': '内部客服',
    'external_service': '外部客服',
    'internal_user_1': '内部1级用户',
    'internal_user_2': '内部2级用户',
    'internal_user_3': '内部3级用户',
    'external_user_1': '外部1级用户',
    'external_user_2': '外部2级用户',
    'external_user_3': '外部3级用户',
    'programmer': '程序员'
  };
  return roleTexts[role] || role;
};



// 格式化日期
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN');
};

// 格式化日期（仅年月日）
const formatDateShort = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('zh-CN');
};

// 检查是否可以升级状态（是否可以显示升级按钮）
const canUpgradeStatus = (currentStatus: string) => {
  const currentIndex = developmentStatuses.findIndex(s => s.value === currentStatus);
  // 如果还没到最后一个状态，就可以升级
  return currentIndex < developmentStatuses.length - 1;
};

// 检查是否可以降级状态（是否可以显示降级按钮）
const canDowngradeStatus = (currentStatus: string) => {
  const currentIndex = developmentStatuses.findIndex(s => s.value === currentStatus);
  // 如果还没到第一个状态，就可以降级
  return currentIndex > 0;
};

// 升级状态到下一级（编辑模态框中使用）
const upgradeStatus = () => {
  const currentIndex = developmentStatuses.findIndex(s => s.value === editForm.development_status);
  if (currentIndex < developmentStatuses.length - 1) {
    editForm.development_status = developmentStatuses[currentIndex + 1].value;
  }
};

// 获取进度条宽度百分比
const getProgressWidth = (currentStatus: string) => {
  const currentIndex = developmentStatuses.findIndex(s => s.value === currentStatus);
  const progress = ((currentIndex + 1) / developmentStatuses.length) * 100;
  return `${progress}%`;
};

// 检查状态是否激活（已完成）
const isStatusActive = (statusValue: string, currentStatus: string) => {
  const statusIndex = developmentStatuses.findIndex(s => s.value === statusValue);
  const currentIndex = developmentStatuses.findIndex(s => s.value === currentStatus);
  return statusIndex <= currentIndex;
};

// 加载分配用户选项
const loadAssignedUsers = async () => {
  try {
    const response = await fetch('/api/user/assigned-options', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const result = await response.json();
      if (result.code === 20000) {
        assignedUsers.value = result.data.users || [];
      }
    }
  } catch (error) {
    console.error('加载分配用户选项失败:', error);
  }
};

// 加载主体列表
const loadEntityList = async () => {
  loading.value = true;
  try {
    // 构建API URL，如果是程序员角色，添加程序员姓名筛选参数
    let apiUrl = '/api/entity/list';
    const currentUserRole = userStore.userInfo?.role;
    const currentUserName = userStore.userInfo?.name;

    if (currentUserRole === 'programmer' && currentUserName) {
      // 程序员只看到自己负责的主体记录
      apiUrl += `?programmer_filter=${encodeURIComponent(currentUserName)}`;
      console.log(`👨‍💻 [程序员查询] 程序员 ${currentUserName} (角色: ${currentUserRole}) 正在查询自己负责的主体列表`);
    } else {
      console.log(`🔍 [主体查询] 用户角色: ${currentUserRole || '未登录'}, 用户名: ${currentUserName || '未知'} 正在查询主体列表`);
    }

    // 调用获取主体列表API
    console.log(`📡 [API调用] 发送主体列表查询请求: ${apiUrl}`);
    if (currentUserRole === 'programmer' && currentUserName) {
      console.log(`👨‍💻 [API调试] 程序员筛选参数详情:`, {
        currentUserName,
        encodedName: encodeURIComponent(currentUserName),
        apiUrl,
        expectedFilter: `programmer_filter=${encodeURIComponent(currentUserName)}`
      });
    }

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`📡 [API响应] 主体列表查询响应状态: ${response.status}`);

    if (!response.ok) {
      console.error(`❌ [API错误] 主体列表查询失败，HTTP状态码: ${response.status}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log(`📊 [API数据] 主体列表查询结果:`, {
      code: result.code,
      message: result.message,
      entitiesCount: result.data?.entities?.length || 0
    });

    if (result.code === 20000) {
      entityList.value = result.data.entities || [];
      pagination.total = entityList.value.length;

      if (currentUserRole === 'programmer' && currentUserName) {
        console.log(`👨‍💻 [程序员数据] 程序员 ${currentUserName} 获取到 ${entityList.value.length} 条主体记录`);

        // 统计程序员分布
        const programmerStats = entityList.value.reduce((acc, entity) => {
          const programmer = entity.programmer || '未分配';
          acc[programmer] = (acc[programmer] || 0) + 1;
          return acc;
        }, {});
        console.log(`📊 [程序员统计] 主体记录中程序员分布:`, programmerStats);

        // 检查是否包含其他程序员的记录
        const otherProgrammers = Object.keys(programmerStats).filter(p => p !== currentUserName && p !== '未分配');
        if (otherProgrammers.length > 0) {
          console.warn(`⚠️ [筛选警告] 程序员 ${currentUserName} 的查询结果中包含其他程序员的记录:`, otherProgrammers);
          console.warn(`⚠️ [筛选警告] 筛选参数: programmer_filter=${encodeURIComponent(currentUserName)}`);
        }

        // 记录前5条主体的详细信息用于调试
        const displayCount = Math.min(5, entityList.value.length);
        console.log(`📋 [主体记录详情] 显示前 ${displayCount} 条记录:`);
        entityList.value.slice(0, displayCount).forEach((entity, index) => {
          console.log(`📋 [记录 ${index + 1}] ID: ${entity.id}, 名称: ${entity.name}, 程序员: ${entity.programmer || '未分配'}, 游戏: ${entity.game_name || '无'}, 状态: ${entity.development_status}`);
        });

        if (entityList.value.length > displayCount) {
          console.log(`📋 [主体记录详情] ... 还有 ${entityList.value.length - displayCount} 条记录`);
        }
      } else {
        console.log(`📊 [主体数据] 成功加载 ${entityList.value.length} 条主体记录`);
      }

      // 保存原始主体列表用于筛选
      originalEntityList.value = [...entityList.value];

      // 更新现有主体选项（去重，从完整列表）
      const uniqueEntities = originalEntityList.value.reduce((acc, entity) => {
        if (!acc.find(e => e.name === entity.name)) {
          acc.push(entity);
        }
        return acc;
      }, []);
      existingEntities.value = uniqueEntities;

      // 重新应用筛选
      applyFilters();
    } else {
      console.error(`❌ [API业务错误] 主体列表查询失败: ${result.message}`);
      Message.error(result.message || '加载主体列表失败');
      entityList.value = [];
      originalEntityList.value = [];
      existingEntities.value = [];
      pagination.total = 0;
    }
  } catch (error: any) {
    console.error('❌ [加载异常] 加载主体列表失败:', error);
    const currentUserRole = userStore.userInfo?.role;
    const currentUserName = userStore.userInfo?.name;
    if (currentUserRole === 'programmer' && currentUserName) {
      console.error(`👨‍💻 [程序员查询失败] 程序员 ${currentUserName} 查询主体列表时发生异常:`, error.message);
    } else {
      console.error(`🔍 [查询失败] 用户查询主体列表时发生异常:`, error.message);
    }
    Message.error('加载主体列表失败，请稍后重试');
    entityList.value = [];
    originalEntityList.value = [];
    existingEntities.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
    console.log(`✅ [加载完成] 主体列表加载流程结束，当前状态: ${entityList.value.length} 条记录`);
  }
};

// 刷新主体列表
const refreshEntityList = () => {
  loadEntityList();
};

// 处理搜索变化
const handleSearchChange = () => {
  applyFilters();
};

// 处理状态筛选变化
const handleStatusFilterChange = () => {
  applyFilters();
};

// 处理分配用户筛选变化
const handleAssignedUserFilterChange = () => {
  applyFilters();
};

// 处理用户类型筛选变化
const handleUserTypeFilterChange = () => {
  applyFilters();
};

// 应用所有筛选
const applyFilters = () => {
  let filteredEntities = [...originalEntityList.value];

  // 应用搜索筛选
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase().trim();
    filteredEntities = filteredEntities.filter(entity =>
      entity.name.toLowerCase().includes(keyword) ||
      entity.programmer.toLowerCase().includes(keyword) ||
      entity.game_name.toLowerCase().includes(keyword)
    );
  }

  // 应用状态筛选
  if (statusFilter.value) {
    filteredEntities = filteredEntities.filter(entity => entity.development_status === statusFilter.value);
  }

  // 应用分配用户筛选
  if (assignedUserFilter.value) {
    filteredEntities = filteredEntities.filter(entity => entity.assigned_user_id == assignedUserFilter.value);
  }

  // 应用用户类型筛选
  if (userTypeFilter.value) {
    filteredEntities = filteredEntities.filter(entity => {
      if (userTypeFilter.value === 'internal') {
        // 内部用户：internal_boss
        return entity.assigned_user_role === 'internal_boss';
      } else if (userTypeFilter.value === 'external') {
        // 外部用户：external_boss
        return entity.assigned_user_role === 'external_boss';
      }
      return true;
    });
  }

  entityList.value = filteredEntities;
  // 更新分页
  pagination.total = entityList.value.length;
  pagination.current = 1; // 重置到第一页
};

// 清除所有筛选条件
const clearAllFilters = () => {
  searchKeyword.value = '';
  statusFilter.value = '';
  assignedUserFilter.value = '';
  userTypeFilter.value = '';
  applyFilters();
};

// 处理表格变化
const handleTableChange = (newPagination: any) => {
  // 更新分页参数
  pagination.current = newPagination.current;
  pagination.pageSize = newPagination.pageSize;
  // 前端分页不需要重新加载数据
};

// 编辑主体
const editEntity = (entity: any) => {
  editEntityInfo.value = entity;

  // 填充编辑表单
  editForm.game_name = entity.game_name || '';
  editForm.programmer = entity.programmer || '';
  editForm.name = entity.name || '';
  editForm.development_status = entity.development_status || '游戏创建';
  editForm.account_name = entity.account_name || '';

  showEditModal.value = true;
};

// 确认删除主体
const confirmDeleteEntity = async (entity: any) => {
  console.log('🗑️ 删除按钮被点击，实体信息:', entity);
  console.log('🗑️ 删除按钮权限检查:', checkCanDeleteEntity(entity));
  console.log('🗑️ 当前用户角色:', userStore.userInfo?.role);
  console.log('🗑️ showDeleteModal当前值:', showDeleteModal.value);

  deleteEntityInfo.value = entity;
  console.log('🗑️ 设置deleteEntityInfo为:', deleteEntityInfo.value);

  showDeleteModal.value = true;
  console.log('🗑️ 设置showDeleteModal为true，现在值为:', showDeleteModal.value);

  console.log('🗑️ 删除确认对话框已打开');
};

// 取消删除
const cancelDelete = () => {
  deleteEntityInfo.value = null;
  showDeleteModal.value = false;
};

// 执行删除主体
const handleDeleteEntity = async () => {
  console.log('🗑️ 开始执行删除操作，实体信息:', deleteEntityInfo.value);

  if (!deleteEntityInfo.value) {
    console.log('❌ 删除实体信息为空');
    return;
  }

  deleteLoading.value = true;
  console.log('🔄 设置删除加载状态为true');

  try {
    console.log('📡 调用删除API，实体ID:', deleteEntityInfo.value.id);

    // 调用删除API
    try {
      const response = await fetch(`/api/entity/delete/${deleteEntityInfo.value.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 删除API响应状态:', response.status);

      const result = await response.json();
      console.log('📡 删除API响应结果:', result);

      if (result.code === 20000) {
        console.log('✅ 删除成功');
        Message.success('主体删除成功');
        showDeleteModal.value = false;
        deleteEntityInfo.value = null;
        // 重新加载主体列表和游戏列表
        console.log('🔄 开始重新加载主体列表和游戏列表');
        await loadEntityList();
        await loadAvailableGames();
      } else {
        console.log('❌ 删除失败，错误信息:', result.message);
        Message.error(result.message || '删除主体失败');
      }
    } catch (error) {
      console.error('❌ 删除API调用失败:', error);
      Message.error('删除主体失败，请稍后重试');
    }
  } catch (error) {
    console.error('❌ 删除操作异常:', error);
    Message.error('删除主体失败');
  } finally {
    console.log('🔄 重置删除加载状态');
    deleteLoading.value = false;
  }
};

// 打开创建主体模态框
const openCreateModal = () => {
  // 重置表单
  createForm.name = '';
  createForm.programmer = '';
  createForm.game_name = '';
  createForm.development_status = '';
  createForm.assigned_user_id = '';

  showCreateModal.value = true;
};

// 处理修改主体名
const handleEditEntityName = () => {
  if (entityList.value.length === 0) {
    Message.warning('当前没有主体数据');
    return;
  }

  // 打开修改主体模态框
  openEditEntityModal();
};

// 重置创建表单
const resetCreateForm = () => {
  createForm.name = '';
  createForm.programmer = '';
  createForm.game_name = '';
  createForm.development_status = '';
  createForm.assigned_user_id = '';
  createForm.account_name = '';
  showCreateModal.value = false;
};

// 重置编辑表单
const resetEditForm = () => {
  editForm.game_name = '';
  editForm.programmer = '';
  editForm.name = '';
  editForm.development_status = '';
  editForm.account_name = '';
  showEditModal.value = false;
  editEntityInfo.value = null;
};

// 重置修改主体表单
const resetEditEntityForm = () => {
  editEntityForm.entity_id = '';
  editEntityForm.new_name = '';
  editEntityForm.assigned_user_id = '';
  editEntityForm.account_name = '';
  showEditEntityModal.value = false;
};

// 重置并打开修改主体模态框
const openEditEntityModal = () => {
  editEntityForm.entity_id = '';
  editEntityForm.new_name = '';
  editEntityForm.assigned_user_id = '';
  editEntityForm.account_name = '';
  showEditEntityModal.value = true;
};

// 当选择主体时，设置默认的分配用户和新主体名
const onEntityChange = () => {
  const selectedEntity = existingEntities.value.find(entity => entity.id === editEntityForm.entity_id);
  if (selectedEntity) {
    // 设置新主体名为当前主体名
    editEntityForm.new_name = selectedEntity.name;
    // 设置分配用户为当前分配用户
    editEntityForm.assigned_user_id = selectedEntity.assigned_user_id;
    // 设置账号名为当前账号名
    editEntityForm.account_name = selectedEntity.account_name || '';
  } else {
    editEntityForm.new_name = '';
    editEntityForm.assigned_user_id = '';
    editEntityForm.account_name = '';
  }
};

// 加载可用游戏列表（过滤掉已被分配的游戏）
const loadAvailableGames = async () => {
  try {
    const response = await fetch('/api/game/list', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const result = await response.json();
      if (result.code === 20000) {
        const allGames = result.data.games || [];

        // 获取所有已被分配的游戏名称
        const assignedGameNames = new Set(
          entityList.value
            .filter(entity => entity.game_name)
            .map(entity => entity.game_name)
        );

        // 过滤掉已被分配的游戏
        availableGames.value = allGames.filter(game => !assignedGameNames.has(game.name));
      }
    }
  } catch (error) {
    console.error('加载可用游戏列表失败:', error);
  }
};

// 打开分配游戏主体模态框
const openAssignModal = () => {
  assignForm.game_name = '';
  assignForm.programmer = '';
  assignForm.name = '';
  assignForm.development_status = '游戏创建';
  showAssignModal.value = true;
};

// 重置分配表单
const resetAssignForm = () => {
  assignForm.game_name = '';
  assignForm.programmer = '';
  assignForm.name = '';
  assignForm.development_status = '';
  assignForm.account_name = '';
  showAssignModal.value = false;
};

// 处理编辑主体
const handleEditEntity = async () => {
  if (!editEntityInfo.value) {
    return;
  }

  try {
    // 基础表单验证
    if (!editForm.name.trim()) {
      Message.error('请输入主体名称');
      return;
    }

    editLoading.value = true;

    const updateData: any = {
      name: editForm.name,
      programmer: editForm.programmer.trim(),
      game_name: editForm.game_name,
      development_status: editForm.development_status,
      account_name: editForm.account_name.trim() || ''
    };

    // 调用更新API
    try {
      const response = await fetch(`/api/entity/update/${editEntityInfo.value.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updateData)
      });

      const result = await response.json();

      if (result.code === 20000) {
        Message.success(`主体"${editForm.name}"信息更新成功！`);

        showEditModal.value = false;
        editEntityInfo.value = null;

        // 重新加载主体列表
        loadEntityList();
      } else {
        Message.error(result.message || '更新主体失败');
      }
    } catch (error) {
      console.error('更新主体失败:', error);
      Message.error('更新主体失败，请稍后重试');
    }
  } catch (error: any) {
    console.error('编辑主体失败:', error);
    Message.error('编辑主体失败，请稍后重试');
  } finally {
    editLoading.value = false;
  }
};

// 处理修改主体
const handleUpdateEntity = async () => {
  try {
    // 基础表单验证
    if (!editEntityForm.entity_id) {
      Message.error('请选择要修改的主体');
      return;
    }

    if (!editEntityForm.new_name.trim()) {
      Message.error('请输入新的主体名称');
      return;
    }

    if (!editEntityForm.assigned_user_id) {
      Message.error('请选择分配用户');
      return;
    }

    editEntityLoading.value = true;

    // 获取选中的主体
    const selectedEntity = existingEntities.value.find(entity => entity.id === editEntityForm.entity_id);
    if (!selectedEntity) {
      Message.error('选择的主体不存在');
      return;
    }

    const oldName = selectedEntity.name;
    const newName = editEntityForm.new_name.trim();
    const assignedUserId = editEntityForm.assigned_user_id;

    // 查找所有具有相同名称的主体（从完整列表中查找）
    const entitiesToUpdate = originalEntityList.value.filter(entity => entity.name === oldName);

    if (entitiesToUpdate.length === 0) {
      Message.error('没有找到需要修改的主体');
      return;
    }

    const updateData = {
      name: newName,
      assigned_user_id: assignedUserId,
      account_name: editEntityForm.account_name.trim() || ''
    };

    let successCount = 0;
    let errorCount = 0;

    // 逐个更新所有相关主体
    for (const entity of entitiesToUpdate) {
      try {
        const response = await fetch(`/api/entity/update/${entity.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(updateData)
        });

        const result = await response.json();

        if (result.code === 20000) {
          successCount++;
        } else {
          errorCount++;
          console.error(`更新主体 ${entity.id} 失败:`, result.message);
        }
      } catch (error) {
        errorCount++;
        console.error(`更新主体 ${entity.id} 异常:`, error);
      }
    }

    // 显示结果
    if (successCount > 0) {
      const message = errorCount > 0
        ? `成功修改 ${successCount} 个主体，${errorCount} 个失败`
        : `成功修改 ${successCount} 个主体名称为"${newName}"`;

      Message.success(message);
      showEditEntityModal.value = false;
      resetEditEntityForm();

      // 重新加载主体列表
      loadEntityList();
    } else {
      Message.error('修改主体失败');
    }
  } catch (error: any) {
    console.error('修改主体失败:', error);
    Message.error('修改主体失败，请稍后重试');
  } finally {
    editEntityLoading.value = false;
  }
};

// 处理创建主体
const handleCreateEntity = async () => {
  console.log('🏗️ 开始创建主体，表单数据:', createForm);

  try {
    // 基础表单验证
    if (!createForm.name.trim()) {
      console.log('❌ 表单验证失败：主体名称为空');
      Message.error('请输入主体名称');
      return;
    }

    if (!createForm.assigned_user_id) {
      console.log('❌ 表单验证失败：未选择分配用户');
      Message.error('请选择分配用户');
      return;
    }

    console.log('✅ 表单验证通过，开始创建');
    console.log('📝 表单数据:', {
      name: createForm.name,
      programmer: createForm.programmer,
      game_name: createForm.game_name,
      assigned_user_id: createForm.assigned_user_id
    });

    createLoading.value = true;

    const entityData: any = {
      name: createForm.name.trim(),
      development_status: createForm.development_status || '游戏创建',
      assigned_user_id: createForm.assigned_user_id
    };

    // 包含游戏信息（程序员和游戏名字可以单独填写）
    if (createForm.programmer.trim()) {
      entityData.programmer = createForm.programmer.trim();
    } else {
      entityData.programmer = '';
    }

    if (createForm.game_name.trim()) {
      entityData.game_name = createForm.game_name.trim();
    } else {
      entityData.game_name = '';
    }

    if (createForm.account_name.trim()) {
      entityData.account_name = createForm.account_name.trim();
    } else {
      entityData.account_name = '';
    }

    console.log('📡 最终发送的数据:', entityData);

    console.log('📡 发送创建请求，数据:', entityData);

    // 调用创建API
    try {
      const response = await fetch('/api/entity/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(entityData)
      });

      console.log('📡 创建API响应状态:', response.status);

      const result = await response.json();
      console.log('📡 创建API响应结果:', result);

      if (result.code === 20000) {
        console.log('✅ 创建成功');
        Message.success({
          content: `主体"${createForm.name}"创建成功！`,
          duration: 3000
        });

        showCreateModal.value = false;
        resetCreateForm();

        // 重新加载主体列表和游戏列表
        console.log('🔄 开始重新加载数据');
        await loadEntityList();
        await loadAvailableGames();
        console.log('✅ 数据重新加载完成');
      } else {
        console.log('❌ 创建失败，错误信息:', result.message);
        Message.error(result.message || '创建主体失败');
      }
    } catch (error) {
      console.error('❌ 创建API调用失败:', error);
      Message.error('创建主体失败，请稍后重试');
    }
  } catch (error: any) {
    console.error('❌ 创建操作异常:', error);
    Message.error('创建主体失败，请稍后重试');
  } finally {
    console.log('🔄 重置创建加载状态');
    createLoading.value = false;
  }
};

// 处理分配游戏主体
const handleAssignEntity = async () => {
  try {
    // 基础表单验证
    if (!assignForm.game_name.trim()) {
      Message.error('请输入游戏名称');
      return;
    }

    if (!assignForm.programmer.trim()) {
      Message.error('请选择程序员');
      return;
    }

    if (!assignForm.name.trim()) {
      Message.error('请选择主体');
      return;
    }

    createLoading.value = true;

    // 查找选中的主体
    const selectedEntity = existingEntities.value.find(entity => entity.name === assignForm.name);
    if (!selectedEntity) {
      Message.error('选择的主体不存在');
      return;
    }

    // 调用分配游戏API
    try {
      const assignData = {
        entity_id: selectedEntity.id,
        game_name: assignForm.game_name.trim(),
        programmer: assignForm.programmer.trim(),
        development_status: assignForm.development_status,
        account_name: assignForm.account_name.trim() || ''
      };

      const response = await fetch('/api/entity/assign-game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(assignData)
      });

      const result = await response.json();

      if (result.code === 20000) {
        const message = result.data.created_new_entity
          ? `游戏分配成功，已创建新的同名主体！`
          : `主体"${assignForm.name}"分配成功！`;

        Message.success({
          content: message,
          duration: 3000
        });

        showAssignModal.value = false;
        resetAssignForm();

        // 重新加载主体列表
        await loadEntityList();
        // 重新加载游戏列表（此时entityList已经更新）
        await loadAvailableGames();
      } else {
        Message.error(result.message || '分配主体失败');
      }
    } catch (error) {
      console.error('分配主体失败:', error);
      Message.error('分配主体失败，请稍后重试');
    }
  } catch (error: any) {
    console.error('分配主体失败:', error);
    Message.error('分配主体失败，请稍后重试');
  } finally {
    createLoading.value = false;
  }
};

// 获取当前用户信息
const loadUserInfo = async () => {
  try {
    const response = await fetch('/api/user/info', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const result = await response.json();
      if (result.code === 20000) {
        // 更新userStore中的用户信息
        userStore.setInfo(result.data);
      }
    }
  } catch (error) {
    console.error('获取用户信息失败:', error);
  }
};

// 升级主体开发状态
const upgradeEntityStatus = async (entity: any) => {
  try {
    const currentIndex = developmentStatuses.findIndex(s => s.value === entity.development_status);
    if (currentIndex < developmentStatuses.length - 1) {
      const newStatus = developmentStatuses[currentIndex + 1].value;

      const response = await fetch(`/api/entity/update/${entity.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: entity.name,
          programmer: entity.programmer,
          game_name: entity.game_name,
          development_status: newStatus
        })
      });

      const result = await response.json();

      if (result.code === 20000) {
        Message.success(`主体"${entity.name}"开发状态已升级到"${getStatusText(newStatus)}"`);
        // 重新加载主体列表
        loadEntityList();
      } else {
        Message.error(result.message || '升级开发状态失败');
      }
    }
  } catch (error) {
    console.error('升级开发状态失败:', error);
    Message.error('升级开发状态失败，请稍后重试');
  }
};

// 降级主体开发状态
const downgradeEntityStatus = async (entity: any) => {
  try {
    const currentIndex = developmentStatuses.findIndex(s => s.value === entity.development_status);
    if (currentIndex > 0) {
      const newStatus = developmentStatuses[currentIndex - 1].value;

      const response = await fetch(`/api/entity/update/${entity.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: entity.name,
          programmer: entity.programmer,
          game_name: entity.game_name,
          development_status: newStatus
        })
      });

      const result = await response.json();

      if (result.code === 20000) {
        Message.success(`主体"${entity.name}"开发状态已降级到"${getStatusText(newStatus)}"`);
        // 重新加载主体列表
        loadEntityList();
      } else {
        Message.error(result.message || '降级开发状态失败');
      }
    }
  } catch (error) {
    console.error('降级开发状态失败:', error);
    Message.error('降级开发状态失败，请稍后重试');
  }
};

// 组件挂载时加载数据
onMounted(async () => {
  // 先获取用户信息
  await loadUserInfo();

  // 检查用户权限
  if (!canViewEntity.value) {
    Message.error('您没有权限访问此页面，只有管理员、老板和程序员可以访问主体管理');
    return;
  }

  loadEntityList();
  loadAssignedUsers();
  loadAvailableGames();
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
      content: "🏢";
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
  max-width: 600px;
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

.form-section {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e5e6eb;

  h4 {
    margin: 0 0 8px 0;
    font-size: 16px;
    font-weight: 600;
    color: #1d2129;
  }

  .section-description {
    margin: 0 0 16px 0;
    font-size: 14px;
    color: #86909c;
    font-weight: 400;
  }

  .current-status-display {
    background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%);
    border: 2px solid #e5e6eb;
    border-radius: 16px;
    padding: 20px;
    margin-top: 8px;
  }

  .status-indicator {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }

  .status-label {
    font-weight: 600;
    color: #86909c;
    font-size: 14px;
  }

  .status-value {
    font-weight: 700;
    color: #1d2129;
    font-size: 16px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .upgrade-btn {
    margin-left: auto;
    border-radius: 8px;
    font-size: 12px;
    padding: 6px 12px;
    height: auto;
  }

  .status-progress {
    position: relative;
  }

  .progress-bar {
    width: 100%;
    height: 8px;
    background: #e5e6eb;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 12px;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 4px;
    transition: width 0.3s ease;
  }

  .progress-steps {
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
  }

  .step-dot {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #e5e6eb;
    color: #86909c;
    font-weight: 600;
    font-size: 12px;
    transition: all 0.3s ease;

    &.active {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
    }
  }

  .status-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 16px;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: 12px;
    }
  }
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
  content: "🏢";
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

.btn-danger {
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(255, 77, 79, 0.3);
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

.status-with-action {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.upgrade-btn-inline {
  font-size: 12px;
  padding: 4px 8px;
  height: auto;
  border-radius: 6px;
}

.downgrade-btn-inline {
  font-size: 12px;
  padding: 4px 8px;
  height: auto;
  border-radius: 6px;
}

.current-status-display-compact {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 120px;
}

.status-indicator-compact {
  display: flex;
  align-items: center;
}

.status-value-compact {
  font-weight: 600;
  font-size: 12px;
  color: #1d2129;
}

.status-progress-compact {
  position: relative;
}

.progress-bar-compact {
  width: 100%;
  height: 4px;
  background: #e5e6eb;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill-compact {
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.progress-steps-compact {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2px;
}

.step-dot-compact {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #e5e6eb;
  color: #86909c;
  font-weight: 600;
  font-size: 8px;
  transition: all 0.3s ease;

  &.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    box-shadow: 0 1px 3px rgba(102, 126, 234, 0.3);
  }
}

.no-game-status {
  font-size: 12px;
  color: #86909c;
  font-weight: 500;
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