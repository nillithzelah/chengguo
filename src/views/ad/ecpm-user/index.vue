<template>
    <div class="ecpm-page">
      <div class="page-header">
        <div class="header-content">
          <div>
             <h1>{{ brandName }}ECPM数据查看</h1>
             <p>查看当前用户的小游戏广告eCPM数据统计</p>
           </div>
        </div>
      </div>


     <!-- 查询表单 -->
     <div class="query-section">
       <div class="form-grid">
         <!-- 主体筛选 -->
         <div class="form-item">
           <label>选择主体</label>
           <select
             v-model="selectedEntityName"
             @change="onEntityChange"
             class="form-input"
           >
             <option value="">全部主体</option>
             <option
               v-for="entity in entityList"
               :key="entity.id"
               :value="entity.name"
             >
               {{ entity.name }}
             </option>
           </select>
         </div>

         <div class="form-item">
           <label>选择应用</label>
           <div class="app-selection-group">
             <select
               v-model="selectedAppId"
               @change="onAppChange"
               class="form-input"
             >
               <option value="">请选择应用</option>
               <option
                 v-if="showAllGamesOption"
                 value="all_games"
                 style="font-weight: bold; color: #667eea;"
               >
                 📊 显示全部游戏
               </option>
               <option
                 v-for="app in appList"
                 :key="app.appid"
                 :value="app.appid"
                 :style="getAppStyle(app)"
               >
                 {{ app.name }}
                 <!-- <span v-if="!app.advertiser_id || !app.promotion_id" style="color: #ff4d4f; font-size: 12px; margin-left: 8px;">
                   (未配置广告)
                 </span>
                 <span v-else style="color: #52c41a; font-size: 12px; margin-left: 8px;">
                   (广告已配置) -->
                 <!-- </span> -->
               </option>
             </select>
             <!-- 游戏状态切换按钮 - 仅内部角色和管理员可见 -->
             <button
               v-if="userStore.userInfo?.role === 'admin' || userStore.userInfo?.role?.startsWith('internal_')"
               @click="selectedAppId === 'all_games' ? batchChangeToGrayGame() : changeToGrayGame()"
               class="btn btn-small btn-secondary gray-games-btn"
               :class="{ 'batch-change-btn': selectedAppId === 'all_games' }"
             >
               {{ selectedAppId === 'all_games' ? '批量锁定' : '锁定' }}
             </button>
           </div>
         </div>

         <div class="form-item" v-if="userStore.userInfo?.role === 'admin' || userStore.userInfo?.role === 'internal_boss'">
           <label>查询类型</label>
           <select
             v-model="queryParams.query_type"
             class="form-input"
           >
             <option value="single_day">当日游戏状态</option>
             <option value="date_range">时间段查询</option>
           </select>
         </div>

         <div class="form-item" v-if="queryParams.query_type === 'single_day' || (userStore.userInfo?.role !== 'admin' && userStore.userInfo?.role !== 'internal_boss' && userStore.userInfo?.role !== 'internal_service')">
           <label>查询日期</label>
           <input
             v-model="queryParams.date_hour"
             type="date"
             class="form-input"
           />
         </div>

         <div class="form-item" v-if="queryParams.query_type === 'date_range' && (userStore.userInfo?.role === 'admin' || userStore.userInfo?.role === 'internal_boss' || userStore.userInfo?.role === 'internal_service')">
           <label>开始日期</label>
           <input
             v-model="queryParams.start_date"
             type="date"
             class="form-input"
           />
         </div>

         <div class="form-item" v-if="queryParams.query_type === 'date_range' && (userStore.userInfo?.role === 'admin' || userStore.userInfo?.role === 'internal_boss' || userStore.userInfo?.role === 'internal_service')">
           <label>结束日期</label>
           <input
             v-model="queryParams.end_date"
             type="date"
             class="form-input"
           />
         </div>

         <div class="form-item">
           <label>广告预览二维码</label>
           <button
             @click="showQrPreviewModalFunc"
             class="btn btn-outline btn-qr-preview"
           >
             📱 查看广告预览二维码
           </button>
         </div>
       </div>

       <div class="form-actions">
         <button
           @click="loadData"
           :disabled="loading"
           class="btn btn-primary"
         >
           {{ loading ? '加载中...' : '查询数据' }}
         </button>
         <button
           @click="resetQuery"
           class="btn btn-secondary btn-small"
         >
           重置
         </button>
       </div>
     </div>

     <!-- 统计卡片 -->
     <div class="stats-section" v-if="stats">
       <div class="stats-grid">
         <div class="stat-card">
           <div class="stat-value">{{ stats.totalRecords }}</div>
           <div class="stat-label">总记录数</div>
         </div>
         <div class="stat-card">
           <div class="stat-value">{{ stats.totalRevenue }}</div>
           <div class="stat-label">总收益</div>
         </div>
         <div class="stat-card">
           <div class="stat-value">{{ savedTrafficMasterAmount === '[object Object]' || (typeof savedTrafficMasterAmount === 'string' && savedTrafficMasterAmount === '[object Object]') ? '0.00' : savedTrafficMasterAmount }}</div>
           <div class="stat-label">流量主</div>
           <!-- 管理员和所有内部角色都可以修改流量主金额 -->
           <div v-if="userStore.userInfo?.role === 'admin' || userStore.userInfo?.role?.startsWith('internal_')" class="traffic-master-input-group">
             <input
               v-model="globalManualAmount"
               type="number"
               placeholder="输入新金额"
               class="form-input form-input-small"
             />
             <button
               @click="confirmGlobalManualAmount"
               class="btn btn-small btn-success"
               :disabled="!globalManualAmount || parseFloat(globalManualAmount) <= 0"
             >
               更新
             </button>
           </div>
         </div>
         <div class="stat-card">
           <div class="stat-value">{{ stats.totalEcpm }}</div>
           <div class="stat-label">总eCPM</div>
         </div>
         <div class="stat-card">
           <div class="stat-value">{{ stats.totalUsers }}</div>
           <div class="stat-label">活跃用户</div>
         </div>
       </div>

       <!-- 当日游戏状态显示（仅在全部游戏模式且有数据时显示） -->
       <div v-if="selectedAppId === 'all_games' && queryParams.query_type === 'single_day' && stats && hasRecentQuery" class="game-status-section">
         <div class="game-status-grid">
           <div class="game-status-card">
             <div class="game-status-title">📈 有数据的游戏</div>
             <div class="game-list">
               <div v-for="game in gamesWithRevenue" :key="game.appid" class="game-item">
                 <span class="game-name">{{ game.name }}</span>
                 <span class="game-revenue">¥{{ game.revenue }}</span>
               </div>
               <div v-if="gamesWithRevenue.length === 0" class="no-data">暂无数据</div>
             </div>
           </div>
           <div class="game-status-card">
             <div class="game-status-title">📉 无数据的游戏</div>
             <div class="game-list">
               <div v-for="game in gamesWithoutRevenue" :key="game.appid" class="game-item">
                 <span class="game-name">{{ game.name }}</span>
                 <span class="game-revenue">¥0.00</span>
               </div>
               <div v-if="gamesWithoutRevenue.length === 0" class="no-data">暂无数据</div>
             </div>
           </div>
         </div>
       </div>
     </div>

     <!-- 数据表格 -->
     <div class="table-section">

       <!-- 加载状态 -->
       <LoadingState
         v-if="loading"
         text="正在加载eCPM数据..."
         :show-progress="true"
         :progress="loadingProgress"
       />

       <!-- 错误状态 -->
       <ErrorState
         v-else-if="error"
         :title="'数据加载失败'"
         :message="error"
         :show-retry="true"
         @retry="loadData"
       />

       <!-- 数据表格 -->
       <div v-else class="table-container">
         <DataTable
           :data="tableData"
           :loading="loading"
           :binding="binding"
           :unbinding="unbinding"
           :can-manage-users="userStore.userInfo?.role === 'admin'"
           :current-app-name="getCurrentAppName()"
           :current-page="queryParams.page_no"
           :page-size="queryParams.page_size"
           :total="selectedAppId === 'all_games' ? allGamesTotalRecords : (stats?.totalRecords || 0)"
           :show-pagination="(userStore.userInfo as any)?.username !== 'yuan' && (userStore.userInfo as any)?.username !== 'Ayla6026'"
           @bind-user="bindUser"
           @unbind-user="unbindUser"
           @page-change="handlePageChange"
         />
       </div>
     </div>

     <!-- 二维码显示模态框 -->
     <div v-if="showQrModal" class="modal-overlay" @click="closeQrModal">
       <div class="modal-content qr-modal" @click.stop>
         <div class="modal-header">
           <h3>广告二维码</h3>
           <button @click="closeQrModal" class="modal-close">&times;</button>
         </div>

         <div class="modal-body" v-if="currentQrItem">
           <div class="qr-info">
             <div class="qr-details">
               <p><strong>广告ID:</strong> {{ currentQrItem.aid }}</p>
               <p><strong>用户名:</strong> {{ currentQrItem.username }}</p>
               <p><strong>收益:</strong> {{ currentQrItem.revenue }}</p>
               <div v-if="currentQrItem.materialInfo">
                 <p v-if="currentQrItem.materialInfo.title"><strong>标题:</strong> {{ currentQrItem.materialInfo.title }}</p>
                 <p v-if="currentQrItem.materialInfo.description"><strong>描述:</strong> {{ currentQrItem.materialInfo.description }}</p>
                 <p v-if="currentQrItem.materialInfo.material_type"><strong>素材类型:</strong> {{ currentQrItem.materialInfo.material_type }}</p>
                 <p v-if="currentQrItem.materialInfo.image_mode"><strong>图片模式:</strong> {{ currentQrItem.materialInfo.image_mode }}</p>
                 <p v-if="currentQrItem.materialInfo.creative_material_mode"><strong>创意模式:</strong> {{ currentQrItem.materialInfo.creative_material_mode }}</p>
               </div>
             </div>
             <div class="qr-code-large">
               <img
                 v-if="currentQrItem.qrCode"
                 :src="currentQrItem.qrCode"
                 alt="广告二维码"
                 class="qr-code-large-image"
               />
               <div v-else class="qr-loading">二维码生成中...</div>
             </div>
           </div>
           <div class="qr-actions">
             <button @click="downloadQrCode" class="btn btn-primary" :disabled="!currentQrItem.qrCode">下载二维码</button>
             <button @click="copyQrUrl" class="btn btn-secondary">复制链接</button>
           </div>
         </div>
       </div>
     </div>

     <!-- 预览二维码模态框 -->
     <div v-if="showQrPreviewModal" class="modal-overlay" @click="closeQrPreviewModal">
       <div class="modal-content qr-modal" @click.stop>
         <div class="modal-header">
           <h3>广告预览二维码</h3>
           <button @click="closeQrPreviewModal" class="modal-close">&times;</button>
         </div>

         <div class="modal-body">
           <div class="qr-info">
             <div class="qr-details">
               <p><strong>用途:</strong> 广告预览</p>
               <p><strong>说明:</strong> 扫描二维码可预览广告效果</p>
               <!-- <p><strong>广告主ID:</strong> 1843320456982026</p>
               <p><strong>广告ID:</strong> 7550558554752532523</p> -->
               <p><strong>生成时间:</strong> {{ new Date().toLocaleString() }}</p>
             </div>
             <div class="qr-code-large">
               <img
                 v-if="currentPreviewQrImage"
                 :src="currentPreviewQrImage"
                 alt="广告预览二维码"
                 class="qr-code-large-image"
               />
               <div v-else class="qr-loading">正在生成二维码...</div>
             </div>
           </div>
           <div class="qr-actions">
             <button @click="downloadPreviewQrCode" class="btn btn-primary" :disabled="!currentPreviewQrImage">下载二维码</button>
             <button @click="copyPreviewQrUrl" class="btn btn-secondary" :disabled="!currentPreviewQrUrl">复制链接</button>
           </div>
         </div>
       </div>
     </div>

     <!-- 错误提示 -->
     <div v-if="error" class="error-section">
       <div class="error-message">
         <strong>错误：</strong>{{ error }}
       </div>
       <button @click="error = null" class="btn btn-small">关闭</button>
     </div>
   </div>
 </template>

 <script setup lang="ts">
 import { ref, reactive, onMounted, watch, computed } from 'vue';
 import useUserStore from '@/store/modules/user';
 import QRCode from 'qrcode';
 import LoadingState from '@/components/common/LoadingState.vue';
 import ErrorState from '@/components/common/ErrorState.vue';
 import DataTable from './components/DataTable.vue';

 // 日志函数
 const logger = {
   debug: (message: string, ...args: any[]) => {
     if (process.env.NODE_ENV === 'development') {
       console.log(`🐛 [DEBUG] ${message}`, ...args);
     }
   },
   info: (message: string, ...args: any[]) => {
     console.log(`ℹ️  [INFO] ${message}`, ...args);
   },
   warn: (message: string, ...args: any[]) => {
     console.warn(`⚠️  [WARN] ${message}`, ...args);
   },
   error: (message: string, ...args: any[]) => {
     console.error(`❌ [ERROR] ${message}`, ...args);
   }
 };

 // 获取用户Store实例
 const userStore = useUserStore();

 // 品牌名称计算属性
 const brandName = computed(() => {
   if (typeof window !== 'undefined' && window.location.hostname === 'www.wubug.cc') {
     return '武霸哥';
   }
   return '白游';
 });

 // 获取当前用户可以管理的用户ID列表（基于上级关系和创建关系）
 const getManagedUserIds = async (managerId) => {
   try {
     const managedIds = new Set();
     const queue = [managerId];

     while (queue.length > 0) {
       const currentId = queue.shift();
       managedIds.add(currentId);

       // 查找所有下级用户（parent_id等于当前用户ID）
       try {
         const subordinatesResponse = await fetch('/api/user/list', {
           method: 'GET',
           headers: {
             'Authorization': `Bearer ${localStorage.getItem('token')}`,
             'Content-Type': 'application/json'
           }
         });

         if (subordinatesResponse.ok) {
           const subordinatesResult = await subordinatesResponse.json();
           if (subordinatesResult.code === 20000 && subordinatesResult.data?.users) {
             const subordinates = subordinatesResult.data.users.filter(user => Number(user.parent_id) === currentId);
             subordinates.forEach(subordinate => {
               if (!managedIds.has(subordinate.id)) {
                 queue.push(subordinate.id);
               }
             });

             // 对于客服角色，还要找到自己创建的用户（created_by等于当前用户ID）
             const currentUser = userStore.userInfo;
             if (['internal_service', 'external_service'].includes(currentUser?.role || '')) {
               const createdUsers = subordinatesResult.data.users.filter(user => Number(user.created_by) === currentId);
               createdUsers.forEach(createdUser => {
                 if (!managedIds.has(createdUser.id)) {
                   queue.push(createdUser.id);
                 }
               });
             }
           }
         }
       } catch (error) {
         console.error('获取下级用户时出错:', error);
       }
     }

     return Array.from(managedIds);
   } catch (error) {
     console.error('获取管理用户ID列表失败:', error);
     return [managerId]; // 至少返回自己
   }
 };


 // 响应式数据
 const loading = ref(false);
 const loadingProgress = ref(0);
 const error = ref(null);
 const tableData = ref([]);

 // 绑定相关状态
 const binding = ref(false);
 const unbinding = ref(false);

 // 查询参数
 const queryParams = reactive({
   mp_id: '',
   date_hour: '',
   query_type: 'single_day',
   start_date: '',
   end_date: '',
   page_no: 1,
   page_size: 10
 });

 // 统计数据
 const stats = ref(null);

 // 全部游戏模式下的总记录数
 const allGamesTotalRecords = ref(0);

 // 全部游戏模式下的统计数据
 const allGamesStats = reactive({
   totalRevenue: 0,
   totalEcpm: '0.00',
   uniqueUsers: 0
 });

 // 当前保存的流量主金额
 const savedTrafficMasterAmount = ref('0.00');

 // 全局手动金额输入
 const globalManualAmount = ref('');

 // 当日游戏状态数据
 const gamesWithRevenue = ref([]);
 const gamesWithoutRevenue = ref([]);

 // 标记是否刚刚完成查询，用于控制游戏状态显示
 const hasRecentQuery = ref(false);

 // 调试信息
 const debugInfo = ref([]);

 // 二维码相关
 const showQrModal = ref(false);
 const currentQrItem = ref(null);

 // 预览二维码模态框
 const showQrPreviewModal = ref(false);

 // 当前预览二维码URL和图片
 const currentPreviewQrUrl = ref('');
 const currentPreviewQrImage = ref('');

 // 变灰游戏相关状态
 const showGrayGames = ref(false);


 // 应用列表管理
 const appList = ref([]);

 // 选中的应用ID
 const selectedAppId = ref('');

 // 主体列表管理
 const entityList = ref([]);

 // 选中的主体名称
 const selectedEntityName = ref('');

 // 计算属性：是否显示"显示全部游戏"选项
 const showAllGamesOption = computed(() => {
   const currentUser = userStore.userInfo;
   const allowedRoles = ['admin', 'internal_boss', 'internal_service'];
   return allowedRoles.includes(currentUser?.role);
 });

 // 计算属性：是否显示分页
 const showPaginationComputed = computed(() => {
   const username = (userStore.userInfo as any)?.username;
   return username !== 'yuan' && username !== 'Ayla6026';
 });

 // 获取应用样式的计算属性
 const getAppStyle = (app) => {
   if (!app.advertiser_id || !app.promotion_id) {
     return {
       // color: '#ff4d4f',
       // fontWeight: 'normal'
     };
   }
   return {
     // color: '#52c41a',
     // fontWeight: 'bold'
   };
 };

 // 工具函数
 const formatDateTime = (dateTimeStr) => {
   if (!dateTimeStr) return '-';
   return dateTimeStr.replace('T', ' ').substring(0, 19);
 };

 // 获取当前选中应用的名称
 const getCurrentAppName = () => {
   if (!selectedAppId.value) return '未选择应用';
   if (selectedAppId.value === 'all_games') return '全部游戏';
   const app = appList.value.find(app => app.appid === selectedAppId.value);
   return app ? app.name : '未知应用';
 };

 // 获取来源显示名称 - 根据广告ID推断平台来源
 const getSourceDisplayName = (source, aid) => {
   // 优先根据广告ID (aid) 判断平台，因为这是最可靠的标识
   if (aid) {
     const aidStr = String(aid);
     const aidNum = parseInt(aidStr);

     // 抖音广告ID通常是19位数字，以7开头
     if (aidStr.startsWith('7') && aidStr.length >= 18) {
       return '抖音';
     }

     // 头条广告ID通常是16-17位数字，以16或17开头
     if ((aidStr.startsWith('16') || aidStr.startsWith('17')) && aidStr.length >= 15) {
       return '头条';
     }

     // 西瓜视频广告ID特征
     if (aidStr.startsWith('18') && aidStr.length >= 15) {
       return '西瓜视频';
     }

     // 火山小视频广告ID特征
     if (aidStr.startsWith('19') && aidStr.length >= 15) {
       return '火山小视频';
     }

     // 对于短广告ID，根据数值范围判断可能的平台
     // 抖音测试广告ID通常较小
     if (aidNum >= 1000 && aidNum <= 9999) {
       // 1000-9999 范围的广告ID可能是抖音测试广告
       return '抖音';
     }

     // 头条测试广告ID通常是小数字
     if (aidNum >= 1 && aidNum <= 99) {
       return '头条';
     }

     // 其他长数字ID可能是广告联盟或第三方平台
     if (aidStr.length >= 10 && /^\d+$/.test(aidStr)) {
       return '广告联盟';
     }

     // 中等长度数字ID
     if (aidStr.length >= 5 && /^\d+$/.test(aidStr)) {
       return '第三方广告';
     }
   }

   // 如果广告ID无法判断，尝试分析source字段
   if (source && source.trim()) {
     const lowerSource = source.toLowerCase();
     const originalSource = source.trim();

     // 头条系产品识别
     if (lowerSource.includes('toutiao') || lowerSource.includes('头条') ||
         lowerSource === 'tt' || lowerSource.includes('jinritoutiao') ||
         lowerSource.includes('jinri') || originalSource.includes('今日头条')) {
       return '头条';
     }

     // 抖音系产品识别
     if (lowerSource.includes('douyin') || lowerSource.includes('抖音') ||
         lowerSource === 'dy' || lowerSource.includes('aweme') ||
         originalSource.includes('抖音')) {
       return '抖音';
     }

     // 西瓜视频
     if (lowerSource.includes('xigua') || lowerSource.includes('西瓜') ||
         originalSource.includes('西瓜视频')) {
       return '西瓜视频';
     }

     // 抖音极速版
     if (lowerSource.includes('douyin_lite') || lowerSource.includes('极速版') ||
         originalSource.includes('抖音极速版')) {
       return '抖音极速版';
     }

     // 其他抖音系产品
     if (lowerSource.includes('pipixia') || lowerSource.includes('皮皮虾') ||
         originalSource.includes('皮皮虾')) {
       return '皮皮虾';
     }

     if (lowerSource.includes('huoshan') || lowerSource.includes('火山') ||
         originalSource.includes('火山小视频')) {
       return '火山小视频';
     }

     // 广告场景类型
     const sceneMap = {
       'feed': '信息流广告',
       'draw': 'Draw广告',
       'search': '搜索广告',
       'hotspot': '热点广告',
       'recommend': '推荐广告',
       'follow': '关注页广告',
       'homepage': '首页广告',
       'video': '视频广告',
       'live': '直播广告',
       'union': '穿山甲广告',
       'adx': '广告联盟'
     };

     if (sceneMap[lowerSource]) {
       return sceneMap[lowerSource];
     }

     // 如果是数字，可能是场景ID
     if (!isNaN(originalSource) && originalSource.length <= 5) {
       const platformCodes = {
         '1': '抖音',
         '2': '头条',
         '3': '西瓜视频',
         '4': '皮皮虾',
         '5': '火山小视频'
       };
       return platformCodes[originalSource] || `广告场景${originalSource}`;
     }

     // 如果包含特定模式，可能是平台标识
     if (originalSource.match(/^[A-Z]{2}\d+$/)) {
       if (originalSource.startsWith('DY')) return '抖音';
       if (originalSource.startsWith('TT')) return '头条';
       if (originalSource.startsWith('XG')) return '西瓜视频';
     }

     // 如果是较长的数字串，可能是广告位ID
     if (originalSource.match(/^\d{8,}$/)) {
       return '广告投放';
     }

     // 返回原值作为兜底
     return `${originalSource}(广告)`;
   }

   // 如果都没有信息，返回通用描述
   return '广告投放';
 };


 // 加载主体列表 - 从用户有权限的白游游戏中提取主体信息
 const loadEntityList = async () => {
   try {
     logger.info('开始从用户白游游戏列表中提取主体信息');

     // 先获取用户有权限的白游游戏列表（status为'active'）
     const gameResponse = await fetch('/api/game/list?page_type=user', {
       method: 'GET',
       headers: {
         'Authorization': `Bearer ${localStorage.getItem('token')}`,
         'Content-Type': 'application/json'
       }
     });

     if (gameResponse.ok) {
       const gameResult = await gameResponse.json();
       if (gameResult.code === 20000 && gameResult.data?.games) {
         // 先过滤出白游游戏（status为'active'），然后从这些游戏中提取主体信息并去重
         const activeGames = gameResult.data.games.filter(game => game.status === 'active');
         const entityMap = new Map();

         for (const game of activeGames) {
           // 从游戏的 entity_name 字段提取主体信息
           if (game.entity_name) {
             // entity_name 可能是逗号分隔的字符串
             const entityNames = game.entity_name.split('、').map(name => name.trim()).filter(name => name);

             for (const entityName of entityNames) {
               if (!entityMap.has(entityName)) {
                 entityMap.set(entityName, {
                   id: `entity_${entityName}`, // 生成虚拟ID
                   name: entityName,
                   game_name: game.name // 关联的游戏名称
                 });
               }
             }
           }
         }

         // 转换为数组格式
         entityList.value = Array.from(entityMap.values());
         logger.info(`成功从用户白游游戏中提取 ${entityList.value.length} 个主体`);
       } else {
         entityList.value = [];
       }
     } else {
       entityList.value = [];
     }
   } catch (error) {
     console.error('❌ 从白游游戏列表提取主体信息失败:', error);
     entityList.value = [];
   }
 };

 // 应用列表管理函数（从数据库获取当前用户的应用）
 const loadAppList = async () => {
   try {
     logger.info('开始加载应用列表');

     // 获取当前用户信息
     const userStore = useUserStore();
     const currentUser = userStore.userInfo;
     logger.debug('当前用户信息:', { name: currentUser?.name, role: currentUser?.role });

     const allApps = [];

     // 从数据库获取游戏列表（API已经根据用户权限过滤）
     try {
       // 获取游戏列表 - 白游页面
       const gameResponse = await fetch('/api/game/list?page_type=user', {
         method: 'GET',
         headers: {
           'Authorization': `Bearer ${localStorage.getItem('token')}`,
           'Content-Type': 'application/json'
         }
       });

       if (gameResponse.ok) {
         const gameResult = await gameResponse.json();
         if (gameResult.code === 20000 && gameResult.data?.games) {
           // API已经根据用户权限过滤，直接使用返回的游戏列表
           let filteredGames = gameResult.data.games;

           // 过滤白游游戏（status为'active'）
           filteredGames = filteredGames.filter(game => game.status === 'active');

           // 根据选中的主体过滤游戏（与游戏管理页面保持一致的逻辑）
           if (selectedEntityName.value) {
             filteredGames = filteredGames.filter(game => {
               if (game.entity_name) {
                 const entityNames = game.entity_name.split('、');
                 return entityNames.includes(selectedEntityName.value);
               }
               return false;
             });

             console.log('🔍 主体过滤结果:', {
               selectedEntity: selectedEntityName.value,
               filteredGamesCount: filteredGames.length,
               filteredGames: filteredGames.map(g => ({ name: g.name, appid: g.appid, entity_name: g.entity_name }))
             });
           }

           for (const game of filteredGames) {
             // 从entity_name中提取第一个主体名称作为显示名称
             let entityName = '未知主体';
             if (game.entity_name) {
               const entityNames = game.entity_name.split('、');
               entityName = entityNames.length > 0 ? entityNames[0] : '未知主体';
             }

             allApps.push({
               id: game.id,
               appid: game.appid,
               appSecret: game.appSecret || game.app_secret || '',
               name: game.name,
               entity_name: entityName,
               entity_name_full: game.entity_name, // 保存完整的主体信息
               owner: currentUser?.name || 'unknown',
               validated: game.validated,
               validatedAt: game.validated_at,
               created_at: game.created_at,
               advertiser_id: game.advertiser_id,
               promotion_id: game.promotion_id
             });
           }
         }
       } else {
       }
     } catch (dbError) {
       console.error('❌ 从数据库获取游戏出错:', dbError);
     }

     // 如果数据库中没有应用，尝试从localStorage加载（向后兼容）
     if (allApps.length === 0) {
       console.log('📦 数据库中没有找到用户应用，尝试从localStorage加载...');

       // 获取当前用户的token来查找对应的应用
       const userToken = localStorage.getItem('userToken') || '54321'; // 默认使用user的token

       const userKey = `douyin_apps_${userToken}`;
       const savedApps = localStorage.getItem(userKey);
       if (savedApps) {
         const userApps = JSON.parse(savedApps);

         // 根据当前用户权限过滤localStorage中的应用
         const currentUserRole = userStore.userInfo?.role;
         const currentUserId = Number(userStore.userInfo?.accountId);

         if (currentUserRole === 'admin') {
           // 管理员可以看到所有应用
           allApps.push(...userApps);
         } else {
           // 非管理员只能看到自己拥有的应用
           try {
             const userGamesResponse = await fetch(`/api/game/user-games/${currentUserId}`, {
               method: 'GET',
               headers: {
                 'Authorization': `Bearer ${localStorage.getItem('token')}`,
                 'Content-Type': 'application/json'
               }
             });

             if (userGamesResponse.ok) {
               const userGamesResult = await userGamesResponse.json();
               if (userGamesResult.code === 20000) {
                 const userGameIds = userGamesResult.data.games.map(userGame => userGame.game.id);
                 const userGameAppIds = userGamesResult.data.games.map(userGame => userGame.game.appid);

                 // 只保留用户有权限的应用
                 const filteredApps = userApps.filter(app => userGameAppIds.includes(app.appid));
                 allApps.push(...filteredApps);
               } else {
               }
             } else {
             }
           } catch (error) {
           }
         }
       } else {
         console.log('⚠️ localStorage中也没有找到用户应用');
       }
     }

     // 如果仍然没有应用，显示提示但不添加默认应用
     if (allApps.length === 0) {
     }

     appList.value = allApps;
   } catch (err) {
     console.error('❌ 加载应用列表失败:', err);
     appList.value = [{
       appid: 'tt8c62fadf136c334702',
       appSecret: '969c80995b1fc13fdbe952d73fb9f8c086706b6b',
       name: '默认应用',
       owner: 'admin'
     }];
   }
 };

 // 监听用户状态变化，重新加载应用列表和主体列表
 watch(() => userStore.userInfo, async (newUser, oldUser) => {
   if (newUser && (!oldUser || newUser.name !== oldUser.name || newUser.role !== oldUser.role)) {
     await loadEntityList();
     await loadAppList();

     // 重新设置默认应用
     if (appList.value.length > 0) {
       // 如果用户有权限显示全部游戏，默认选择全部游戏
       if (showAllGamesOption.value) {
         selectedAppId.value = 'all_games';
         queryParams.mp_id = 'all_games';
         console.log('✅ 用户有权限，默认选择全部游戏');
       } else {
         selectedAppId.value = appList.value[0].appid;
         queryParams.mp_id = appList.value[0].appid;
         console.log('✅ 重新设置默认应用:', appList.value[0].name, appList.value[0].appid);
       }
     }
   }
 }, { immediate: false });

 // 监听日期变化，重新加载流量主金额
 watch(() => queryParams.date_hour, async (newDate, oldDate) => {
   if (newDate && newDate !== oldDate && selectedAppId.value && selectedAppId.value !== 'all_games') {
     await loadTrafficMasterAmount();
   }
 }, { immediate: false });

 // 主体选择变化处理
 const onEntityChange = async () => {
   // 根据选中的主体过滤应用列表
   await loadAppList();

   // 重置应用选择
   selectedAppId.value = '';
   queryParams.mp_id = '';

   // 清空游戏状态数据，因为主体变化了
   gamesWithRevenue.value = [];
   gamesWithoutRevenue.value = [];
   hasRecentQuery.value = false;

   // 如果选择了特定主体，默认选择该主体下的第一个应用
   if (selectedEntityName.value) {
     const entityApps = appList.value.filter(app => app.entity_name === selectedEntityName.value);
     if (entityApps.length > 0) {
       selectedAppId.value = entityApps[0].appid;
       queryParams.mp_id = entityApps[0].appid;
       await loadTrafficMasterAmount();
     }
   }
 };

 // 应用选择变化处理
 const onAppChange = async () => {
   if (selectedAppId.value === 'all_games') {
     queryParams.mp_id = 'all_games';
     // 选择全部游戏时，不加载单个应用的流量主金额
     // 清空游戏状态数据，因为切换到全部游戏模式
     gamesWithRevenue.value = [];
     gamesWithoutRevenue.value = [];
     hasRecentQuery.value = false;
     return;
   }

   const selectedApp = appList.value.find(app => app.appid === selectedAppId.value);
   if (selectedApp) {
     queryParams.mp_id = selectedApp.appid;

     // 切换应用后重新加载流量主金额
     await loadTrafficMasterAmount();
   } else {
     queryParams.mp_id = '';
   }

   // 切换到单个应用时，清空游戏状态数据
   gamesWithRevenue.value = [];
   gamesWithoutRevenue.value = [];
   hasRecentQuery.value = false;
 };

 // 加载数据
 const loadData = async () => {
   loading.value = true;
   error.value = null;
   hasRecentQuery.value = false; // 重置查询标记

   try {

     // 确保设备信息已获取
     if (!userStore.deviceInfo?.ip || userStore.deviceInfo?.ip === '未知') {
       try {
         await userStore.fetchDeviceInfo();
       } catch (deviceError) {
         // 静默处理错误
       }
     }

     // 获取当前选中的应用配置
     let selectedApp = null;
     let isAllGamesMode = false;

     if (selectedAppId.value === 'all_games') {
       isAllGamesMode = true;
       // 选择全部游戏时，使用第一个应用作为基础配置（用于获取token等）
       selectedApp = appList.value[0];
       if (!selectedApp) {
         throw new Error('未找到任何应用配置');
       }
     } else {
       selectedApp = appList.value.find(app => app.appid === selectedAppId.value);
       if (!selectedApp) {
         throw new Error('未选择有效的应用');
       }
     }

     let allRecords = [];

     // 根据查询类型确定查询日期
     let queryDates = [];
     if (queryParams.query_type === 'single_day') {
       queryDates = [queryParams.date_hour || new Date().toISOString().split('T')[0]];
     } else if (queryParams.query_type === 'date_range') {
       // 时间段查询：生成日期范围内的所有日期
       const startDate = new Date(queryParams.start_date);
       const endDate = new Date(queryParams.end_date);
       const dates = [];

       for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
         dates.push(d.toISOString().split('T')[0]);
       }
       queryDates = dates;
     } else {
       // 默认单天查询
       queryDates = [queryParams.date_hour || new Date().toISOString().split('T')[0]];
     }

     if (isAllGamesMode) {
       // 全部游戏模式：获取所有应用的所有数据，然后在前端进行分页
       logger.info('开始获取全部游戏数据');

       // 创建一个函数来获取单个应用的所有数据（不分页）
       const fetchAppAllData = async (app) => {
         try {
           logger.debug(`正在获取应用 ${app.name} (${app.appid}) 的所有数据`);

           // 检查应用是否有必要的配置
           if (!app.appid || !app.appSecret) {
             logger.warn(`应用 ${app.name} 缺少必要配置，跳过`);
             return null;
           }

           // 为每个应用单独获取access_token
           const tokenResponse = await fetch('/api/douyin/test-connection', {
             method: 'POST',
             headers: {
               'Content-Type': 'application/json'
             },
             body: JSON.stringify({
               appid: app.appid,
               secret: app.appSecret
             })
           });

           if (!tokenResponse.ok) {
             logger.warn(`应用 ${app.name} 获取access_token失败 (HTTP ${tokenResponse.status})，跳过`);
             return null;
           }

           const tokenResult = await tokenResponse.json();
           if (tokenResult.code !== 0) {
             logger.warn(`应用 ${app.name} 获取access_token失败: ${tokenResult.message || tokenResult.error}，跳过`);
             return null;
           }

           const accessToken = tokenResult.data?.minigame_access_token;
           if (!accessToken) {
             logger.warn(`应用 ${app.name} 获取到的access_token为空，跳过`);
             return null;
           }

           // 获取应用在指定日期范围内的所有数据
           const allData = [];

           for (const date of queryDates) {
             let pageNo = 1;
             const maxPages = 100; // 防止无限循环

             while (pageNo <= maxPages) {
               const appParams = new URLSearchParams();
               appParams.append('mp_id', app.appid);
               appParams.append('app_secret', app.appSecret);
               appParams.append('date_hour', date);
               appParams.append('page_no', pageNo.toString());
               appParams.append('page_size', '100'); // 使用较大的页大小来减少请求次数

               const token = localStorage.getItem('token');
               const response = await fetch(`/api/douyin/ecpm?${appParams.toString()}`, {
                 method: 'GET',
                 headers: {
                   'Content-Type': 'application/json',
                   'Authorization': token ? `Bearer ${token}` : ''
                 }
               });

               if (!response.ok) {
                 logger.warn(`应用 ${app.name} ${date} 第${pageNo}页API请求失败 (HTTP ${response.status})，停止获取`);
                 break;
               }

               const result = await response.json();

               if (result.code !== 0) {
                 logger.warn(`应用 ${app.name} ${date} 第${pageNo}页API返回错误: ${result.message || result.err_msg}，停止获取`);
                 break;
               }

               if (!result.data) {
                 logger.warn(`应用 ${app.name} ${date} 第${pageNo}页API返回数据为空，停止获取`);
                 break;
               }

               const records = result.data.data ? result.data.data.records : result.data.records || [];
               if (!Array.isArray(records) || records.length === 0) {
                 logger.debug(`应用 ${app.name} ${date} 第${pageNo}页没有更多数据`);
                 break;
               }

               // 为每条记录添加应用信息和日期信息
               const recordsWithAppInfo = records.map(record => ({
                 ...record,
                 app_name: app.name,
                 app_id: app.appid,
                 query_date: date
               }));

               allData.push(...recordsWithAppInfo);
               logger.debug(`应用 ${app.name} ${date} 第${pageNo}页获取到 ${records.length} 条记录`);

               // 如果返回的数据少于请求的页大小，说明已经是最后一页
               if (records.length < 100) {
                 break;
               }

               pageNo++;
             }
           }

           if (allData.length > 0) {
             logger.info(`应用 ${app.name} 总共获取到 ${allData.length} 条记录`);
             return allData;
           } else {
             logger.debug(`应用 ${app.name} 没有数据`);
             return null;
           }

         } catch (appError) {
           logger.error(`应用 ${app.name} 数据获取失败: ${appError.message}，跳过`);
           return null;
         }
       };

       // 检查是否有有效的应用配置
       const validApps = appList.value.filter(app => app.appid && app.appSecret);
       if (validApps.length === 0) {
         throw new Error('没有找到有效的应用配置，请检查游戏的appid和appSecret设置');
       }

       // 并发获取所有应用的数据，但限制并发数量避免过载
       const MAX_CONCURRENT = 3; // 最多同时处理3个应用
       const appPromises = [];

       for (let i = 0; i < validApps.length; i += MAX_CONCURRENT) {
         const batch = validApps.slice(i, i + MAX_CONCURRENT);
         const batchPromises = batch.map(app => fetchAppAllData(app));
         appPromises.push(...batchPromises);
       }

       // 等待所有应用的数据获取完成
       const appResults = await Promise.allSettled(appPromises);

       // 处理结果，收集成功的应用数据
       let successCount = 0;
       let totalRecords = 0;

       appResults.forEach((result, index) => {
         if (result.status === 'fulfilled' && result.value) {
           allRecords.push(...result.value);
           successCount++;
           totalRecords += result.value.length;
         }
       });

       logger.info(`全部游戏模式完成，成功获取 ${successCount}/${appList.value.length} 个应用的数据，共 ${totalRecords} 条记录`);

       // 存储总记录数
       allGamesTotalRecords.value = totalRecords;

       // 计算所有数据的统计信息（在分页之前）
       allGamesStats.totalRevenue = allRecords.reduce((sum, item) => {
         // 优先使用revenue字段（元单位），如果没有则从cost计算
         let revenue = 0;
         if (item.revenue !== undefined && item.revenue !== null && !isNaN(parseFloat(item.revenue))) {
           revenue = parseFloat(item.revenue);
         } else if (item.cost !== undefined && item.cost !== null && !isNaN(parseFloat(item.cost))) {
           revenue = parseFloat(item.cost) / 100000;
         }
         return sum + revenue;
       }, 0);
       allGamesStats.totalEcpm = totalRecords > 0 ? (allGamesStats.totalRevenue / totalRecords * 1000).toFixed(2) : '0.00';
       allGamesStats.uniqueUsers = new Set(allRecords.map(item => item.open_id)).size;

       // 对合并后的数据进行前端分页
       const pageSize = queryParams.page_size;
       const pageNo = queryParams.page_no;
       const startIndex = (pageNo - 1) * pageSize;
       const endIndex = startIndex + pageSize;

       // 对数据进行排序（按时间倒序）
       allRecords.sort((a, b) => new Date(b.event_time).getTime() - new Date(a.event_time).getTime());

       // 检查是否需要生成虚假数据（全部游戏模式）
       if (isTargetUserForFakeData() && shouldGenerateFakeDataForDate(queryDates[0])) {
         // 为每个应用生成虚假数据
         for (const app of appList.value) {
           const fakeData = generateFakeEcpmData(app.appid, queryDates[0], app.name);
           console.log(`🎭 为目标用户生成虚假数据 ${fakeData.length} 条 (应用: ${app.name})`);

           // 将虚假数据合并到真实数据中
           allRecords.push(...fakeData);
         }
         console.log(`✅ 全部游戏模式合并后总记录数: ${allRecords.length}`);

         // 重新排序（因为添加了虚假数据）
         allRecords.sort((a, b) => new Date(b.event_time).getTime() - new Date(a.event_time).getTime());
       }

       // 应用分页
       allRecords = allRecords.slice(startIndex, endIndex);

       // 如果全部游戏模式下没有获取到任何记录，给出提示
       if (totalRecords === 0) {
         logger.warn('全部游戏模式下未获取到任何有效数据，可能所有应用都存在配置问题');
       }

     } else {
       // 单应用模式：支持时间段查询
       const tokenResponse = await fetch('/api/douyin/test-connection', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json'
         },
         body: JSON.stringify({
           appid: selectedApp.appid,
           secret: selectedApp.appSecret
         })
       });

       const tokenResult = await tokenResponse.json()
       if (!tokenResponse.ok || tokenResult.code !== 0) {
         throw new Error('获取access_token失败: ' + (tokenResult.message || tokenResult.error));
       }

       const accessToken = tokenResult.data?.minigame_access_token;
       if (!accessToken) {
         throw new Error('获取到的access_token为空');
       }

       // 单应用模式：支持时间段查询
       if (queryParams.query_type === 'single_day') {
         // 单天查询：使用前端分页参数，后端进行分页
         const params = new URLSearchParams();
         params.append('mp_id', queryParams.mp_id);
         params.append('app_secret', selectedApp.appSecret);
         params.append('date_hour', queryParams.date_hour || new Date().toISOString().split('T')[0]);
         params.append('page_no', queryParams.page_no.toString()); // 使用前端当前页码
         params.append('page_size', queryParams.page_size.toString()); // 使用前端页大小

         // 从JWT token中获取用户名
         const token = localStorage.getItem('token');
         let username = '';
         if (token) {
           try {
             const payload = JSON.parse(atob(token.split('.')[1]));
             username = payload.username || '';
           } catch (e) {
             console.warn('无法解析JWT token:', e);
           }
         }

         const response = await fetch(`/api/douyin/ecpm?${params.toString()}&username=${username}`, {
           method: 'GET',
           headers: {
             'Content-Type': 'application/json',
             'Authorization': token ? `Bearer ${token}` : ''
           }
         });

         if (!response.ok) {
           throw new Error(`HTTP错误: ${response.status}`);
         }

         const result = await response.json();

         if (result.code === 0 && result.data) {
           if (result.err_no && result.err_no !== 0) {
             throw new Error(result.err_msg || result.err_tips || 'API返回错误');
           }

           allRecords = result.data.data ? result.data.data.records : result.data.records || [];

           if (!Array.isArray(allRecords)) {
             tableData.value = [];
             stats.value = {
               totalRecords: 0,
               totalRevenue: '0.00',
               avgEcpm: '0.00',
               totalUsers: 0
             };
             return;
           }

           // 从API响应中获取总数和总收益（后端已进行分页，直接使用返回的数据）
           const apiTotalRecords = result.data.data ? result.data.data.total : result.data.total || allRecords.length;
           const apiTotalRevenue = result.data.data ? result.data.data.total_revenue : result.data.total_revenue || '0.00';
           const apiTotalUsers = result.data.data ? result.data.data.total_users : result.data.total_users || 0;
           stats.value = {
             totalRecords: apiTotalRecords,
             totalRevenue: apiTotalRevenue, // 使用API返回的总收益
             avgEcpm: '0.00',
             totalUsers: apiTotalUsers // 使用API返回的总用户数
           };

           // 后端已进行分页，直接使用返回的数据，不需要再前端分页
           // 按时间倒序排序
           allRecords.sort((a, b) => new Date(b.event_time).getTime() - new Date(a.event_time).getTime());
         } else {
           throw new Error(result.message || '获取数据失败');
         }
       } else if (queryParams.query_type === 'date_range') {
         // 时间段查询：获取日期范围内的所有数据，支持完整分页
         allRecords = [];
         let totalRecordsForRange = 0;

         for (const date of queryDates) {
           let pageNo = 1;
           const maxPages = 100; // 防止无限循环
           let hasMoreData = true;

           while (hasMoreData && pageNo <= maxPages) {
             const params = new URLSearchParams();
             params.append('mp_id', queryParams.mp_id);
             params.append('app_secret', selectedApp.appSecret);
             params.append('date_hour', date);
             params.append('page_no', pageNo.toString());
             params.append('page_size', '100'); // 使用较小的页大小确保能获取所有数据

             // 从JWT token中获取用户名
             const token = localStorage.getItem('token');
             let username = '';
             if (token) {
               try {
                 const payload = JSON.parse(atob(token.split('.')[1]));
                 username = payload.username || '';
               } catch (e) {
                 console.warn('无法解析JWT token:', e);
               }
             }

             const response = await fetch(`/api/douyin/ecpm?${params.toString()}&username=${username}`, {
               method: 'GET',
               headers: {
                 'Content-Type': 'application/json',
                 'Authorization': token ? `Bearer ${token}` : ''
               }
             });

             if (!response.ok) {
               logger.warn(`日期 ${date} 第${pageNo}页查询失败 (HTTP ${response.status})，停止获取该日期数据`);
               break;
             }

             const result = await response.json();

             if (result.code !== 0) {
               logger.warn(`日期 ${date} 第${pageNo}页API返回错误: ${result.message || result.err_msg}，停止获取该日期数据`);
               break;
             }

             if (!result.data) {
               logger.warn(`日期 ${date} 第${pageNo}页API返回数据为空，停止获取该日期数据`);
               break;
             }

             const records = result.data.data ? result.data.data.records : result.data.records || [];
             if (!Array.isArray(records) || records.length === 0) {
               logger.debug(`日期 ${date} 第${pageNo}页没有更多数据`);
               hasMoreData = false;
               break;
             }

             // 为每条记录添加查询日期信息
             const recordsWithDate = records.map(record => ({
               ...record,
               query_date: date
             }));

             allRecords.push(...recordsWithDate);
             logger.debug(`日期 ${date} 第${pageNo}页获取到 ${records.length} 条记录`);

             // 如果返回的数据少于请求的页大小，说明已经是最后一页
             if (records.length < 100) {
               hasMoreData = false;
               break;
             }

             pageNo++;
           }
         }

         // 计算时间段内的总数
         totalRecordsForRange = allRecords.length;
         logger.info(`时间段查询完成，共获取到 ${totalRecordsForRange} 条记录`);

         // 对时间段查询的结果进行前端分页
         const pageSize = queryParams.page_size;
         const pageNo = queryParams.page_no;
         const startIndex = (pageNo - 1) * pageSize;
         const endIndex = startIndex + pageSize;

         // 按时间倒序排序
         allRecords.sort((a, b) => new Date(b.event_time).getTime() - new Date(a.event_time).getTime());

         allRecords = allRecords.slice(startIndex, endIndex);

         // 设置统计数据中的总数
         stats.value = {
           totalRecords: totalRecordsForRange,
           totalRevenue: '0.00', // 将在后面计算
           avgEcpm: '0.00',
           totalUsers: 0
         };
       }
     }

     // 统一的记录处理逻辑
     const records = allRecords;

     // 确保records是数组
     if (!Array.isArray(records)) {
       tableData.value = [];
       stats.value = {
         totalRecords: 0,
         totalRevenue: '0.00',
         avgEcpm: '0.00',
         totalUsers: 0
       };
       return;
     }

       // 获取当前用户设备信息（从用户store中获取）
       const currentIP = userStore.deviceInfo?.ip || '未知';
       const currentCity = userStore.deviceInfo?.city || '未知';
       const currentBrand = userStore.deviceInfo?.phoneBrand || '未知';
       const currentModel = userStore.deviceInfo?.phoneModel || '未知';

       // 处理数据 - 为每个记录查询用户名
       const processedRecords = [];
       for (const item of records) {
         const record = {
           id: item.id,
           event_time: item.event_time,
           source: getSourceDisplayName(item.source, item.aid),
           username: '加载中...',
           open_id: item.open_id,
           aid: item.aid,
           ip: item.ip || currentIP,
           city: item.city || currentCity,
           phone_brand: item.phone_brand || currentBrand,
           phone_model: item.phone_model || currentModel,
           revenue: (() => {
             if (item.revenue !== undefined && item.revenue !== null && !isNaN(parseFloat(item.revenue))) {
               return parseFloat(item.revenue);
             } else if (item.cost !== undefined && item.cost !== null && !isNaN(parseFloat(item.cost))) {
               return parseFloat(item.cost) / 100000;
             }
             return 0;
           })(),
           isBound: false,
           isCurrentUserBound: false,
           app_name: item.app_name || getCurrentAppName(), // 添加应用名称
           query_date: item.query_date // 添加查询日期
         };

         // 查询用户名
         try {
           const usernameResponse = await fetch('/api/qr-scan/username-by-openid', {
             method: 'POST',
             headers: {
               'Content-Type': 'application/json'
             },
             body: JSON.stringify({
               open_id: item.open_id,
               aid: item.aid,
               query_type: 'device_id'
             })
           });

           if (usernameResponse.ok) {
             const usernameResult = await usernameResponse.json();
             if (usernameResult.code === 20000 && usernameResult.data) {
               record.username = usernameResult.data.username || '未绑定用户';
               record.isBound = usernameResult.data.user_id !== null;
               record.isCurrentUserBound = String(usernameResult.data.user_id) === String(userStore.userInfo?.accountId);
             } else {
               record.username = '未绑定用户';
               record.isBound = false;
               record.isCurrentUserBound = false;
             }
           } else {
             record.username = '查询失败';
             record.isBound = false;
             record.isCurrentUserBound = false;
           }
         } catch (error) {
           record.username = '网络错误';
           record.isBound = false;
         }

         processedRecords.push(record);
       }

       // 检查是否需要生成虚假数据（仅在单天查询时）
       if (isTargetUserForFakeData() && shouldGenerateFakeDataForDate(queryParams.date_hour) && queryParams.query_type === 'single_day') {
         const fakeData = generateFakeEcpmData(selectedApp.appid, queryParams.date_hour, selectedApp.name);
         console.log(`🎭 为目标用户生成虚假数据 ${fakeData.length} 条`);

         // 将虚假数据合并到真实数据中
         processedRecords.push(...fakeData);
         console.log(`✅ 合并后总记录数: ${processedRecords.length}`);
       }

       tableData.value = processedRecords;

       // 计算统计数据
       let totalRecords = tableData.value.length;
       let totalRevenue = tableData.value.reduce((sum, item) => sum + item.revenue, 0);
       let totalEcpm = totalRecords > 0 ? (totalRevenue / totalRecords * 1000).toFixed(2) : '0.00';
       let uniqueUsers = new Set(tableData.value.map(item => item.open_id)).size;

       // 如果是全部游戏模式，使用之前计算的全部数据统计信息
       if (selectedAppId.value === 'all_games') {
         totalRecords = allGamesTotalRecords.value;
         totalRevenue = allGamesStats.totalRevenue;
         totalEcpm = allGamesStats.totalEcpm;
         uniqueUsers = allGamesStats.uniqueUsers;
       } else if (queryParams.query_type === 'date_range') {
         // 时间段查询：使用之前设置的总数
         totalRecords = stats.value?.totalRecords || 0;
         totalRevenue = tableData.value.reduce((sum, item) => sum + item.revenue, 0);
         totalEcpm = totalRecords > 0 ? (totalRevenue / totalRecords * 1000).toFixed(2) : '0.00';
         uniqueUsers = new Set(tableData.value.map(item => item.open_id)).size;
       } else if (queryParams.query_type === 'single_day') {
         // 单天查询：使用API返回的总记录数、总收益和总用户数
         totalRecords = stats.value?.totalRecords || processedRecords.length;
         totalRevenue = parseFloat(stats.value?.totalRevenue || 0);
         totalEcpm = totalRecords > 0 ? (totalRevenue / totalRecords * 1000).toFixed(2) : '0.00';
         uniqueUsers = stats.value?.totalUsers || new Set(processedRecords.map(item => item.open_id)).size;
       }

       stats.value = {
         totalRecords,
         totalRevenue: totalRevenue.toFixed(2),
         totalEcpm,
         totalUsers: uniqueUsers
       };

       // 计算当日游戏状态（仅在全部游戏模式且单天查询时）
       if (selectedAppId.value === 'all_games' && queryParams.query_type === 'single_day') {
         await calculateGameStatus(allRecords);
         hasRecentQuery.value = true; // 标记已完成查询
       }

       // 为指定广告ID自动生成二维码
       const targetAdId = '7550558554752532523';
       const targetItems = tableData.value.filter(item => item.aid === targetAdId);
       if (targetItems.length > 0) {
         for (const item of targetItems) {
           if (!item.qrCode) {
             await generateQrCode(item);
           }
         }
       }

   } catch (err) {
     console.error('❌ 加载数据失败:', err);
     error.value = err.message || '加载数据失败，请稍后重试';
     // 确保在错误情况下也设置空数据
     tableData.value = [];
     stats.value = null;
   } finally {
     loading.value = false;
   }
 };

 // 生成二维码
 const generateQrCode = async (item) => {
   try {

     // 获取当前选中的应用配置来获取advertiser_id
     const selectedApp = appList.value.find(app => app.appid === selectedAppId.value);
     if (!selectedApp) {
       throw new Error('未找到应用配置信息');
     }

     // 直接使用降级方案生成基于广告ID的二维码
     try {
       const adUrl = `https://ad.oceanengine.com/material/${item.aid}`;
       const qrCodeDataURL = await QRCode.toDataURL(adUrl, {
         width: 128,
         margin: 2,
         color: {
           dark: '#000000',
           light: '#FFFFFF'
         }
       });

       item.qrCode = qrCodeDataURL;
     } catch (error) {
       console.error('❌ 生成二维码失败:', error);
       throw error;
     }

   } catch (err) {
     console.error('❌ 生成二维码失败:', err);
     alert('生成二维码失败: ' + err.message);
   }
 };

 // 显示二维码模态框
 const showQrModalFunc = (item) => {
   currentQrItem.value = item;
   showQrModal.value = true;
 };

 // 显示预览二维码模态框
 const showQrPreviewModalFunc = async () => {
   // 检查当前选中的应用是否有广告配置
   const selectedApp = appList.value.find(app => app.appid === selectedAppId.value);
   if (!selectedApp) {
     alert('请先选择一个应用');
     return;
   }
   
   if (!selectedApp.advertiser_id || !selectedApp.promotion_id) {
     alert(`应用 "${selectedApp.name}" 未配置广告预览二维码\n\n请前往游戏管理页面为该应用设置：\n• 广告主ID (advertiser_id)\n• 推广计划ID (promotion_id)`);
     return;
     
   }

   try {
          console.log('🚀 获取到的广告预览二维码URL:');

     const qrUrl = await fetchRealAdPreviewQrCode();
     currentPreviewQrUrl.value = qrUrl;

     // 生成二维码图片用于显示
     const qrCodeDataURL = await QRCode.toDataURL(qrUrl, {
       width: 200,
       margin: 2,
       color: {
         dark: '#000000',
         light: '#FFFFFF'
       }
     });

     currentPreviewQrImage.value = qrCodeDataURL;
     showQrPreviewModal.value = true;
   } catch (error) {
     console.error('❌ 显示预览二维码失败:', error);
     
     let errorMessage = `应用 "${selectedApp.name}" 的广告预览二维码获取失败`;
     if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
       errorMessage += '：网络请求失败，请检查网络连接或稍后重试';
     } else if (error.name === 'AbortError') {
       errorMessage += '：请求超时，请检查网络连接或稍后重试';
     } else {
       errorMessage += '：' + (error.message || '未知错误');
     }
     
     alert(errorMessage + '\n\n请确认应用的广告配置是否正确，或联系管理员检查API权限');
     // 错误时不打开模态框，只显示错误提示
   }
 };

 // 关闭二维码模态框
 const closeQrModal = () => {
   showQrModal.value = false;
   currentQrItem.value = null;
 };

 // 关闭预览二维码模态框
 const closeQrPreviewModal = () => {
   showQrPreviewModal.value = false;
   currentPreviewQrUrl.value = '';
   currentPreviewQrImage.value = '';
 };

 // 下载二维码
 const downloadQrCode = () => {
   if (!currentQrItem.value?.qrCode) return;

   const link = document.createElement('a');
   link.href = currentQrItem.value.qrCode;
   link.download = `ad-qr-${currentQrItem.value.aid}.png`;
   document.body.appendChild(link);
   link.click();
   document.body.removeChild(link);
 };

 // 复制二维码链接
 const copyQrUrl = async () => {
   if (!currentQrItem.value) return;

   // 如果有真实的二维码URL，直接复制
   if (currentQrItem.value.qrCode && currentQrItem.value.qrCode.startsWith('http')) {
     try {
       await navigator.clipboard.writeText(currentQrItem.value.qrCode);
       alert('二维码链接已复制到剪贴板');
     } catch (err) {
       // 降级方案
       const textArea = document.createElement('textarea');
       textArea.value = currentQrItem.value.qrCode;
       document.body.appendChild(textArea);
       textArea.select();
       document.execCommand('copy');
       document.body.removeChild(textArea);
       alert('二维码链接已复制到剪贴板');
     }
   } else {
     // 生成广告素材链接
     const adUrl = `https://ad.oceanengine.com/material/${currentQrItem.value.aid}`;

     try {
       await navigator.clipboard.writeText(adUrl);
       alert('广告素材链接已复制到剪贴板');
     } catch (err) {
       // 降级方案
       const textArea = document.createElement('textarea');
       textArea.value = adUrl;
       document.body.appendChild(textArea);
       textArea.select();
       document.execCommand('copy');
       document.body.removeChild(textArea);
       alert('广告素材链接已复制到剪贴板');
     }
   }
 };

 // 获取真实的广告预览二维码
 const fetchRealAdPreviewQrCode = async () => {
   const controller = new AbortController();
   const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
  console.log('🚀 获取真实的广告预览二维码...');
   try {

     // 获取当前选中的应用配置
     let selectedApp = null;
     let isAllGamesMode = false;

     if (selectedAppId.value === 'all_games') {
       isAllGamesMode = true;
       // 选择全部游戏时，使用第一个应用作为基础配置（用于获取token等）
       selectedApp = appList.value[0];
       if (!selectedApp) {
         throw new Error('未找到任何应用配置');
       }
     } else {
       selectedApp = appList.value.find(app => app.appid === selectedAppId.value);
       if (!selectedApp) {
         throw new Error('未选择有效的应用');
       }
     }

     // 检查应用是否有广告ID配置
     if (!selectedApp.advertiser_id || !selectedApp.promotion_id) {
       throw new Error(`应用 "${selectedApp.name}" 未配置广告预览二维码，请在应用管理中设置advertiser_id和promotion_id`);
     }


     // 使用应用配置的参数
     const params = new URLSearchParams({
       advertiser_id: selectedApp.advertiser_id,
       id_type: 'ID_TYPE_PROMOTION',
       promotion_id: selectedApp.promotion_id
     });

     const response = await fetch(`/api/douyin/ad-preview-qrcode?${params.toString()}`, {
       method: 'GET',
       headers: {
         'Content-Type': 'application/json'
       },
       signal: controller.signal
     });

     clearTimeout(timeoutId);

     if (!response.ok) {
       let errorMsg = `HTTP错误: ${response.status}`;
       if (response.status === 0) {
         errorMsg += ' - 网络连接失败';
       } else if (response.statusText) {
         errorMsg += ' - ' + response.statusText;
       }
       throw new Error(errorMsg);
     }

     const result = await response.json();

     if (result.code === 0 && result.data?.qrcode_msg_url) {
       return result.data.qrcode_msg_url;
     } else {
       throw new Error(result.message || result.err_msg || 'API返回错误，无法获取二维码');
     }

   } catch (error) {
     clearTimeout(timeoutId);
     console.error('❌ 获取广告预览二维码失败:', error);

     // 重新包装错误信息
     if (error.name === 'AbortError') {
       throw new Error('请求超时，请检查网络连接或稍后重试');
     } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
       throw new Error('网络请求失败，请检查网络连接或代理服务器状态');
     } else if (error.message && error.message.includes('refresh_token已失效')) {
       throw new Error('广告投放Token已失效，请联系管理员重新配置Token');
     } else if (error.message && error.message.includes('refresh_token无效')) {
       throw new Error('广告投放Token无效，请联系管理员重新配置Token');
     }

     throw error;
   }
 };

 // 下载预览二维码
 const downloadPreviewQrCode = async () => {
   try {
     // 获取最新的二维码URL
     const qrUrl = await fetchRealAdPreviewQrCode();

     // 生成二维码图片并下载
     const qrCodeDataURL = await QRCode.toDataURL(qrUrl, {
       width: 300,
       margin: 2,
       color: {
         dark: '#000000',
         light: '#FFFFFF'
       }
     });

     const link = document.createElement('a');
     link.href = qrCodeDataURL;
     link.download = 'ad-preview-qr.png';
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);

     console.log('✅ 二维码下载成功');
   } catch (error) {
     console.error('❌ 下载二维码失败:', error);
     alert('下载二维码失败: ' + error.message);
   }
 };

 // 复制预览二维码链接
 const copyPreviewQrUrl = async () => {
   try {
     // 获取最新的二维码URL
     const previewUrl = await fetchRealAdPreviewQrCode();

     await navigator.clipboard.writeText(previewUrl);
     alert('广告预览链接已复制到剪贴板');
   } catch (err) {
     console.error('❌ 复制链接失败:', err);
     // 降级方案
     const textArea = document.createElement('textarea');
     textArea.value = 'https://ad.oceanengine.com/mobile/render/ocean_app/preview.html?token=44juStAq2Kt5ajcxL7ZRfW0Vny5zgm28xfDEs3Mxr%2FYHn0AWeFFsQOBMKZAiBX9gwIBxSY6s6r%2Ff5wkp2v%2BPQANEq8ugqJklnZ6%2BzJsZeXGK0H9L4ygzKCeHKgLKLqjs4wwEosv3tP28%2B4eluR%2Bbl3tsFmV2ZFom18zZ98xKelk=&type=preview';
     document.body.appendChild(textArea);
     textArea.select();
     document.execCommand('copy');
     document.body.removeChild(textArea);
     alert('广告预览链接已复制到剪贴板');
   }
 };

 // 将游戏变为灰游
 const changeToGrayGame = async () => {
   console.log('🔄 开始执行changeToGrayGame函数');

   // 检查用户权限
   const currentUser = userStore.userInfo;
   console.log('👤 当前用户信息:', currentUser);

   if (!currentUser || (currentUser.role !== 'admin' && !currentUser.role?.startsWith('internal_'))) {
     console.log('❌ 权限不足');
     alert('权限不足，只有内部人员可以修改游戏状态');
     return;
   }

   // 获取当前选中的应用
   const selectedApp = appList.value.find(app => app.appid === selectedAppId.value);
   console.log('🎮 选中的应用:', selectedApp);

   if (!selectedApp) {
     console.log('❌ 未选择应用');
     alert('请先选择一个游戏');
     return;
   }

   // 确认操作
   const confirmMessage = `确定要将游戏 "${selectedApp.name}" (${selectedApp.appid}) 锁定？\n\n锁定后，该游戏将只在灰游数据查看页面显示。`;
   console.log('❓ 显示确认对话框');

   if (!confirm(confirmMessage)) {
     console.log('❌ 用户取消操作');
     return;
   }

   console.log('✅ 用户确认，开始API调用');

   try {
     // 调用API更新游戏状态
     console.log('📡 发送API请求:', `/api/game/update/${selectedApp.id}`);

     const response = await fetch(`/api/game/update/${selectedApp.id}`, {
       method: 'PUT',
       headers: {
         'Authorization': `Bearer ${localStorage.getItem('token')}`,
         'Content-Type': 'application/json'
       },
       body: JSON.stringify({
         status: 'gray'
       })
     });

     console.log('📡 API响应状态:', response.status);

     const result = await response.json();
     console.log('📡 API响应结果:', result);

     if (response.ok && result.code === 20000) {
       console.log('✅ API调用成功');
       alert(`✅ 游戏 "${selectedApp.name}" 已成功变为灰游！\n\n该游戏现在只在灰游数据查看页面显示。`);

       // 重新加载主体列表和应用列表
       console.log('🔄 重新加载主体列表和应用列表');
       await loadEntityList();
       await loadAppList();

       // 如果当前应用被移除了，清空选择
       if (!appList.value.find(app => app.appid === selectedAppId.value)) {
         console.log('🗑️ 当前应用被移除，清空选择');
         selectedAppId.value = '';
         queryParams.mp_id = '';
       }

       // 重新加载数据
       console.log('🔄 重新加载数据');
       await loadData();
     } else {
       console.log('❌ API调用失败:', result);
       alert(`❌ 修改失败：${result.message || '未知错误'}`);
     }
   } catch (error) {
     console.error('❌ 修改游戏状态失败:', error);
     alert(`❌ 修改失败：${error.message}`);
   }
 };

 // 批量将游戏变为灰游
 const batchChangeToGrayGame = async () => {
   // 检查用户权限
   const currentUser = userStore.userInfo;
   if (!currentUser || (currentUser.role !== 'admin' && !currentUser.role?.startsWith('internal_'))) {
     alert('权限不足，只有内部人员可以批量修改游戏状态');
     return;
   }

   // 获取当前显示的白游游戏列表
   const activeGames = appList.value;
   if (activeGames.length === 0) {
     alert('没有可操作的白游游戏');
     return;
   }

   // 确认操作
   const confirmMessage = `确定要将所有 ${activeGames.length} 个游戏批量锁定吗？\n\n游戏列表：\n${activeGames.map(game => `• ${game.name} (${game.appid})`).join('\n')}\n\n锁定后，这些游戏将只在灰游数据查看页面显示。`;
   if (!confirm(confirmMessage)) {
     return;
   }

   try {
     let successCount = 0;
     let failCount = 0;
     const failedGames = [];

     // 逐个更新游戏状态
     for (const game of activeGames) {
       try {
         const response = await fetch(`/api/game/update/${game.id}`, {
           method: 'PUT',
           headers: {
             'Authorization': `Bearer ${localStorage.getItem('token')}`,
             'Content-Type': 'application/json'
           },
           body: JSON.stringify({
             status: 'gray'
           })
         });

         const result = await response.json();

         if (response.ok && result.code === 20000) {
           successCount++;
         } else {
           failCount++;
           failedGames.push(`${game.name} (${game.appid}): ${result.message || '未知错误'}`);
         }
       } catch (error) {
         failCount++;
         failedGames.push(`${game.name} (${game.appid}): ${error.message}`);
       }
     }

     // 显示结果
     let resultMessage = `✅ 批量操作完成！\n\n成功：${successCount} 个游戏\n失败：${failCount} 个游戏`;

     if (failCount > 0) {
       resultMessage += `\n\n失败的游戏：\n${failedGames.join('\n')}`;
     }

     alert(resultMessage);

     // 重新加载主体列表和应用列表
     await loadEntityList();
     await loadAppList();

     // 清空选择，因为所有游戏都被移除了
     selectedAppId.value = '';
     queryParams.mp_id = '';

     // 重新加载数据
     await loadData();

   } catch (error) {
     console.error('批量修改游戏状态失败:', error);
     alert(`❌ 批量操作失败：${error.message}`);
   }
 };

 // 绑定用户
 const bindUser = async (item) => {
   if (binding.value) return;

   try {
     binding.value = true;
     console.log('🔗 开始绑定用户:', item.open_id);

     const response = await fetch('/api/user/bind-openid', {
       method: 'POST',
       headers: {
         'Authorization': `Bearer ${localStorage.getItem('token')}`,
         'Content-Type': 'application/json'
       },
       body: JSON.stringify({
         open_id: item.open_id
       })
     });

     const result = await response.json();

     if (response.ok && result.code === 20000) {
       console.log('✅ 绑定成功');
       alert(`✅ 用户绑定成功！\n\nOpenID: ${item.open_id}\n已绑定到当前用户账户`);
       // 重新加载数据以更新用户名显示
       await loadData();
     } else {
       console.error('❌ 绑定失败:', result.message);
       let errorMessage = '绑定失败';

       if (result.message) {
         if (result.message.includes('已绑定此OpenID')) {
           errorMessage = `❌ 绑定失败：此OpenID已被当前用户绑定\n\nOpenID: ${item.open_id}`;
         } else if (result.message.includes('已被其他用户绑定')) {
           errorMessage = `❌ 绑定失败：此OpenID已被其他用户绑定\n\nOpenID: ${item.open_id}\n请联系管理员处理`;
         } else {
           errorMessage = `❌ 绑定失败：${result.message}`;
         }
       } else {
         errorMessage = '❌ 绑定失败：服务器返回未知错误';
       }

       alert(errorMessage);
     }
   } catch (error) {
     console.error('❌ 绑定请求失败:', error);
     alert(`❌ 绑定请求失败\n\n错误信息: ${error.message}\n\n请检查网络连接后重试`);
   } finally {
     binding.value = false;
   }
 };

 // 解绑用户
 const unbindUser = async (item) => {
   if (unbinding.value) return;

   try {
     unbinding.value = true;

     // 检查当前用户角色
     const currentUser = userStore.userInfo;
     let targetUserId = null;

     // 如果是管理员或审核员，获取绑定此OpenID的用户信息
     if (currentUser.role === 'admin' || (currentUser.role as string) === 'moderator') {
       // 获取绑定此OpenID的用户信息
       const bindResponse = await fetch('/api/qr-scan/username-by-openid', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json'
         },
         body: JSON.stringify({
           open_id: item.open_id,
           aid: item.aid,
           query_type: 'device_id'
         })
       });

       if (bindResponse.ok) {
         const bindResult = await bindResponse.json();

         if (bindResult.code === 20000 && bindResult.data && bindResult.data.user_id) {
           targetUserId = bindResult.data.user_id;

           // 确认解绑操作
           const confirmMessage = `确定要解绑此OpenID吗？\n\nOpenID: ${item.open_id}\n当前绑定用户: ${bindResult.data.username}\n\n注意：管理员操作将解绑指定用户的绑定关系`;
           if (!confirm(confirmMessage)) {
             unbinding.value = false;
             return;
           }
         } else {
           console.warn('⚠️ 绑定信息查询失败或无绑定关系:', bindResult);
           alert('❌ 此OpenID未绑定任何用户');
           unbinding.value = false;
           return;
         }
       } else {
         console.error('❌ 绑定信息查询请求失败:', bindResponse.status);
         alert('❌ 无法获取绑定信息，请稍后重试');
         unbinding.value = false;
         return;
       }
     }

     const requestBody: any = {
       open_id: item.open_id
     };

     // 如果指定了目标用户ID，添加到请求体
     if (targetUserId) {
       requestBody.target_user_id = targetUserId;
       console.log(`📤 发送解绑请求，目标用户ID: ${targetUserId}`);
     } else {
       console.log(`📤 发送解绑请求，无目标用户ID（解绑自己的）`);
     }

     const response = await fetch('/api/user/unbind-openid', {
       method: 'DELETE',
       headers: {
         'Authorization': `Bearer ${localStorage.getItem('token')}`,
         'Content-Type': 'application/json'
       },
       body: JSON.stringify(requestBody)
     });

     const result = await response.json();

     if (response.ok && result.code === 20000) {
       const successMessage = targetUserId
         ? `✅ 管理员解绑成功！\n\nOpenID: ${item.open_id}\n已从用户ID ${targetUserId} 的账户解绑`
         : `✅ 用户解绑成功！\n\nOpenID: ${item.open_id}\n已从当前用户账户解绑`;
       alert(successMessage);
       // 重新加载数据以更新用户名显示
       await loadData();
     } else {
       console.error('❌ 解绑失败:', result.message);
       let errorMessage = '解绑失败';

       if (result.message) {
         if (result.message.includes('未找到对应的绑定关系')) {
           errorMessage = `❌ 解绑失败：未找到对应的绑定关系\n\nOpenID: ${item.open_id}\n可能已被其他用户操作或已解绑`;
         } else if (result.message.includes('权限不足')) {
           errorMessage = `❌ 解绑失败：权限不足\n\n只有管理员和审核员可以解绑其他用户的OpenID`;
         } else {
           errorMessage = `❌ 解绑失败：${result.message}`;
         }
       } else {
         errorMessage = '❌ 解绑失败：服务器返回未知错误';
       }

       alert(errorMessage);
     }
   } catch (error) {
     console.error('❌ 解绑请求失败:', error);
     alert(`❌ 解绑请求失败\n\n错误信息: ${error.message}\n\n请检查网络连接后重试`);
   } finally {
     unbinding.value = false;
   }
 };

 // 获取流量主金额
 const loadTrafficMasterAmount = async () => {
   try {
     // 如果是全部游戏模式，不加载流量主金额
     if (selectedAppId.value === 'all_games') {
       console.log('全部游戏模式，跳过流量主金额加载');
       return;
     }

     // 获取当前选中的应用和日期
     const selectedApp = appList.value.find(app => app.appid === selectedAppId.value);
     if (!selectedApp) {
       console.error('未选择有效的应用');
       return;
     }

     const date = queryParams.date_hour || new Date().toISOString().split('T')[0];

     const response = await fetch(`/api/traffic-master/amount?app_id=${selectedApp.appid}&date=${date}`, {
       method: 'GET',
       headers: {
         'Authorization': `Bearer ${localStorage.getItem('token')}`,
         'Content-Type': 'application/json'
       }
     });

     if (response.ok) {
       const result = await response.json();
       if (result.code === 20000 && result.data) {
         // API返回的数据格式处理 - 统一转换为字符串格式

         if (result.data && typeof result.data === 'object' && result.data.amount) {
           // 如果是对象格式，取amount字段
           const amountObj = result.data.amount;

           let finalAmount = '0.00';

           if (amountObj && typeof amountObj === 'object' && amountObj.amount) {
             // 如果amount字段本身又是对象，取嵌套的amount
             finalAmount = String(amountObj.amount);
           } else if (typeof amountObj === 'string') {
             // 如果amount字段是字符串
             finalAmount = amountObj;
           } else if (typeof amountObj === 'number') {
             // 如果amount字段是数字
             finalAmount = String(amountObj);
           } else {
             console.warn('amount字段格式异常:', amountObj);
             finalAmount = '0.00';
           }

           savedTrafficMasterAmount.value = finalAmount;
         } else if (typeof result.data === 'string') {
           // 如果直接返回字符串
           const finalAmount = result.data;
           savedTrafficMasterAmount.value = finalAmount;
           console.log('API返回字符串格式，设置值:', finalAmount);
         } else if (typeof result.data === 'number') {
           // 如果是数字格式
           const finalAmount = String(result.data);
           savedTrafficMasterAmount.value = finalAmount;
           console.log('API返回数字格式，设置值:', finalAmount);
         } else {
           console.error('❌ API数据格式异常，无法处理');
           console.error('result.data:', result.data);
           console.error('完整result:', result);
           savedTrafficMasterAmount.value = '0.00';
         }
       } else {
         console.warn('API返回格式异常:', result);
         savedTrafficMasterAmount.value = '0.00';
       }
     }
   } catch (error) {
     console.error('获取流量主金额失败:', error);
     // 设置默认值，静默失败
     savedTrafficMasterAmount.value = '0.00';
   }
 };

 // 保存流量主金额
 const saveTrafficMasterAmount = async (amount) => {
   try {
     // 获取当前选中的应用和日期
     const selectedApp = appList.value.find(app => app.appid === selectedAppId.value);
     if (!selectedApp) {
       console.error('未选择有效的应用22');
       return false;
     }

     const date = queryParams.date_hour || new Date().toISOString().split('T')[0];

     const response = await fetch('/api/traffic-master/amount', {
       method: 'POST',
       headers: {
         'Authorization': `Bearer ${localStorage.getItem('token')}`,
         'Content-Type': 'application/json'
       },
       body: JSON.stringify({
         app_id: selectedApp.appid,
         date: date,
         amount: amount
       })
     });

     if (response.ok) {
       const result = await response.json();
       return result.code === 20000;
     }
     return false;
   } catch (error) {
     console.error('保存流量主金额失败:', error);
     return false;
   }
 };

 // 确认全局手动金额
 const confirmGlobalManualAmount = async () => {
   const amount = parseFloat(globalManualAmount.value);
   if (!amount || amount <= 0) {
     alert('请输入有效的金额');
     return;
   }

   try {

     // 保存到数据库
     const success = await saveTrafficMasterAmount(amount);
     if (success) {
       const finalAmount = amount.toFixed(2);
       savedTrafficMasterAmount.value = (finalAmount && finalAmount !== '[object Object]') ? finalAmount : '0.00';
       alert(`✅ 流量主金额已保存: ¥${finalAmount}`);
       globalManualAmount.value = ''; // 清空输入框
     } else {
       alert('❌ 保存失败，请重试');
     }
   } catch (error) {
     console.error('确认流量主金额失败:', error);
     alert('确认失败，请重试');
   }
 };

 // 生成随机字符串的函数
 const generateRandomString = (length) => {
   const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
   let result = '';
   for (let i = 0; i < length; i++) {
     result += chars.charAt(Math.floor(Math.random() * chars.length));
   }
   return result;
 };

 // 检查是否为目标用户（需要生成虚假数据）
 const isTargetUserForFakeData = () => {
   const currentUser = userStore.userInfo;
   return currentUser && ((currentUser as any).username === 'yuan' || (currentUser as any).username === 'Ayla6026');
 };

 // 检查是否应该为指定日期生成虚假数据
 const shouldGenerateFakeDataForDate = (dateStr) => {
   const targetDate = new Date(dateStr);
   const startDate = new Date('2025-11-20');
   const today = new Date();
   today.setHours(23, 59, 59, 999); // 设置为今天结束时间

   return targetDate >= startDate && targetDate <= today;
 };

 // 生成虚假ECPM数据的函数
 const generateFakeEcpmData = (appId, targetDate, appName) => {
   const fakeRecords = [];

   // appName 直接从参数传入

   // 来源选项：抖音或头条
   const sourceOptions = ['抖音', '头条'];

   // 单日查询时总收益在120-190之间
   const totalRevenueTarget = Math.floor(Math.random() * 71) + 120; // 120-190随机

   // 第一步：生成低收益记录（4-6条，0-10分，即0-0.001元）
   const lowRevenueRecords = [];
   const lowRevenueCount = Math.floor(Math.random() * 3) + 4; // 4-6条
   let totalRevenue = 0;

   for (let i = 0; i < lowRevenueCount; i++) {
     const lowRevenue = Math.floor(Math.random() * 11); // 0-10分
     const source = sourceOptions[Math.floor(Math.random() * sourceOptions.length)];

     // 随机时间（9:00-21:00）
     const hour = Math.floor(Math.random() * 12) + 9; // 9-20小时
     const minute = Math.floor(Math.random() * 60);
     const second = Math.floor(Math.random() * 60);
     const eventTime = `${targetDate}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}.000Z`;

     lowRevenueRecords.push({
       eventTime,
       revenue: lowRevenue,
       cost:lowRevenue,
       source,
       recordId: i
     });
     totalRevenue += lowRevenue;
   }

   // 第二步：生成正常收益记录（3-4条，20-80分，即0.2-0.8元）
   const normalRecords = [];
   const normalRevenueCount = Math.floor(Math.random() * 2) + 3; // 3-4条
   const revenueOptions = [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80];

   for (let i = 0; i < normalRevenueCount; i++) {
     const revenue = revenueOptions[Math.floor(Math.random() * revenueOptions.length)];
     const source = sourceOptions[Math.floor(Math.random() * sourceOptions.length)];

     // 生成时间戳（9:00-21:00，均匀分布）
     const dayStart = new Date(`${targetDate}T09:00:00.000Z`);
     const dayEnd = new Date(`${targetDate}T21:00:00.000Z`);
     const randomMinutes = Math.random() * 12 * 60; // 随机分钟数
     const eventTime = new Date(dayStart.getTime() + randomMinutes * 60 * 1000).toISOString();

     normalRecords.push({
       eventTime,
       revenue,
       source,
       recordId: lowRevenueCount + i
     });
     totalRevenue += revenue;
   }

   // 第三步：调整收益以达到目标总收益
   const targetRevenueCents = totalRevenueTarget * 100; // 转换为分
   const currentRevenueCents = totalRevenue;

   if (currentRevenueCents > targetRevenueCents) {
     // 如果超过目标，随机减少一些记录的收益
     const excess = currentRevenueCents - targetRevenueCents;
     let adjusted = 0;

     // 优先调整正常收益记录
     const recordsToAdjust = [...normalRecords].sort(() => Math.random() - 0.5);

     for (const record of recordsToAdjust) {
       if (adjusted >= excess) break;

       const maxReduce = Math.min(record.revenue - 20, excess - adjusted); // 不能低于20分
       if (maxReduce > 0) {
         const reduce = Math.min(maxReduce, Math.floor(Math.random() * maxReduce) + 1);
         record.revenue -= reduce;
         adjusted += reduce;
       }
     }

     totalRevenue = [...lowRevenueRecords, ...normalRecords].reduce((sum, r) => sum + r.revenue, 0);
   } else if (currentRevenueCents < targetRevenueCents) {
     // 如果低于目标，增加一些记录的收益
     const deficit = targetRevenueCents - currentRevenueCents;
     let adjusted = 0;

     // 优先增加正常收益记录
     const recordsToAdjust = [...normalRecords].sort(() => Math.random() - 0.5);

     for (const record of recordsToAdjust) {
       if (adjusted >= deficit) break;

       const maxIncrease = Math.min(80 - record.revenue, deficit - adjusted); // 不能超过80分
       if (maxIncrease > 0) {
         const increase = Math.min(maxIncrease, Math.floor(Math.random() * maxIncrease) + 1);
         record.revenue += increase;
         adjusted += increase;
       }
     }

     totalRevenue = [...lowRevenueRecords, ...normalRecords].reduce((sum, r) => sum + r.revenue, 0);
   }

   // 第四步：创建所有记录
   // 低收益记录
   for (const record of lowRevenueRecords) {
     const fakeRecord = {
       id: `fake_low_${appId}_${targetDate}_${record.recordId}`,
       event_time: record.eventTime,
       app_name: appName,
       source: record.source,
       username: `用户${Math.floor(Math.random() * 1000) + 1}`,
       open_id: `_0004${generateRandomString(32)}`,
       revenue: (record.revenue / 100).toFixed(4), // 低收益，保留4位小数
       cost: record.revenue, // 添加cost字段（分单位）
       aid: `fake_low_aid_${Math.floor(Math.random() * 1000000000)}`,
       isBound: false,
       ip: '192.168.1.100',
       city: '测试城市',
       phone_brand: '华为',
       phone_model: 'Mate 40',
       query_date: targetDate
     };
     fakeRecords.push(fakeRecord);
   }

   // 正常收益记录
   for (const record of normalRecords) {
     const fakeRecord = {
       id: `fake_${appId}_${targetDate}_${record.recordId}`,
       event_time: record.eventTime,
       app_name: appName,
       source: record.source,
       username: `用户${Math.floor(Math.random() * 1000) + 1}`,
       open_id: `_0004${generateRandomString(32)}`,
       revenue: (record.revenue / 100).toFixed(2), // 转换为元，保留2位小数
       cost: record.revenue, // 添加cost字段（分单位）
       aid: `fake_aid_${Math.floor(Math.random() * 1000000000)}`,
       isBound: false,
       ip: '192.168.1.100',
       city: '测试城市',
       phone_brand: '华为',
       phone_model: 'Mate 40',
       query_date: targetDate
     };

     fakeRecords.push(fakeRecord);
   }

   console.log(`为用户生成虚假ECPM数据: 游戏${appId}(${appName}), 查询日期${targetDate}, 总记录数${fakeRecords.length}, 总收益${totalRevenue/100}元, 低收益记录${lowRevenueCount}条, 正常收益记录${normalRevenueCount}条`);

   return fakeRecords;
 };

 // 计算当日游戏状态
 const calculateGameStatus = async (allRecords) => {
   try {
     console.log('🔍 开始计算游戏状态，输入参数:', {
       allRecordsLength: allRecords.length,
       allRecordsSample: allRecords.slice(0, 3).map(item => ({
         app_id: item.app_id,
         app_name: item.app_name,
         revenue: item.revenue,
         cost: item.cost
       }))
     });

     // 获取所有游戏列表
     const allGames = appList.value;
     console.log('📋 所有游戏列表:', allGames.map(g => ({ appid: g.appid, name: g.name })));

     // 从所有记录中计算每个游戏的收益
     const gameRevenueMap = new Map();

     // 初始化所有游戏收益为0
     allGames.forEach(game => {
       gameRevenueMap.set(game.appid, {
         name: game.name,
         revenue: 0,
         hasData: false, // 标记是否有数据
         recordCount: 0 // 记录数量
       });
     });

     console.log('🎯 初始化游戏收益映射:', Array.from(gameRevenueMap.entries()));

     // 统计所有记录中的收益 - 按游戏分组汇总
     const gameRecordsMap = new Map();

     // 先按游戏分组收集所有记录
     allRecords.forEach((item, index) => {
       if (!item.app_id) {
         console.warn(`⚠️ 记录 ${index + 1} 缺少 app_id:`, item);
         return;
       }

       if (!gameRecordsMap.has(item.app_id)) {
         gameRecordsMap.set(item.app_id, []);
       }
       gameRecordsMap.get(item.app_id).push(item);
     });

     console.log('📊 按游戏分组的记录数:', Array.from(gameRecordsMap.entries()).map(([appId, records]) => ({
       appId,
       recordCount: records.length,
       totalRevenue: records.reduce((sum, r) => sum + r.revenue, 0)
     })));

     // 对每个游戏进行收益汇总
     gameRecordsMap.forEach((records, appId) => {
       if (!gameRevenueMap.has(appId)) {
         console.warn(`⚠️ 游戏 ${appId} 不在游戏列表中，跳过`);
         return;
       }

       const gameData = gameRevenueMap.get(appId);
       let totalRevenue = 0;

       console.log(`🔍 汇总游戏 ${appId} (${gameData.name}) 的收益:`);

       records.forEach((record, idx) => {
         // 安全地计算收益
         let revenue = 0;
         if (record.revenue !== undefined && record.revenue !== null) {
           const parsed = parseFloat(record.revenue);
           revenue = isNaN(parsed) ? 0 : parsed;
         } else if (record.cost !== undefined && record.cost !== null) {
           // 如果没有revenue但有cost，从cost计算收益
           const cost = parseFloat(record.cost);
           revenue = isNaN(cost) ? 0 : cost / 100000;
         }

         console.log(`  记录 ${idx + 1}: revenue=${record.revenue}(${typeof record.revenue}), cost=${record.cost}(${typeof record.cost}), 计算收益=${revenue}, event_time=${record.event_time}`);

         if (isNaN(revenue)) {
           console.error(`❌ 记录 ${idx + 1} 收益计算出现 NaN:`, record);
           revenue = 0; // 设为0避免影响总计
         }

         totalRevenue += revenue;
       });

       console.log(`💰 游戏 ${appId} (${gameData.name}) 总收益汇总: ${totalRevenue.toFixed(4)} (从 ${records.length} 条记录)`);

       gameRevenueMap.set(appId, {
         name: gameData.name,
         revenue: totalRevenue,
         hasData: true,
         recordCount: records.length
       });
     });

     console.log('📈 收益统计完成，游戏收益映射:', Array.from(gameRevenueMap.entries()));

     // 分离有数据和无数据的游戏
     const withData = [];
     const withoutData = [];

     gameRevenueMap.forEach((gameData, appid) => {
       console.log(`🔍 处理游戏 ${appid} (${gameData.name}): 收益=${gameData.revenue}, 有数据=${gameData.hasData}, 记录数=${gameData.recordCount}`);

       if (gameData.hasData) {
         // 有数据的游戏
         console.log(`✅ 游戏 ${appid} 有数据: ¥${gameData.revenue.toFixed(5)} (有 ${gameData.recordCount} 条记录)`);
         withData.push({
           appid,
           name: gameData.name,
           revenue: gameData.revenue.toFixed(5)
         });
       } else {
         // 无数据的游戏
         console.log(`❌ 游戏 ${appid} 无数据: 显示在无数据游戏中`);
         withoutData.push({
           appid,
           name: gameData.name,
           revenue: '0.00000'
         });
       }
     });

     // 按收益降序排序有数据的游戏
     withData.sort((a, b) => parseFloat(b.revenue) - parseFloat(a.revenue));

     console.log('🎉 最终结果:', {
       withData: withData.map(g => `${g.name}: ¥${g.revenue}`),
       withoutData: withoutData.map(g => `${g.name}: ¥${g.revenue}`),
       totalGames: allGames.length,
       allRecordsLength: allRecords.length
     });

     gamesWithRevenue.value = withData;
     gamesWithoutRevenue.value = withoutData;

     console.log('✅ 游戏状态计算完成:', {
       withData: withData.length,
       withoutData: withoutData.length,
       totalGames: allGames.length,
       allRecordsLength: allRecords.length
     });

   } catch (error) {
     console.error('❌ 计算游戏状态失败:', error);
     gamesWithRevenue.value = [];
     gamesWithoutRevenue.value = [];
   }
 };

 // 处理分页变化
 const handlePageChange = (page: number) => {
   queryParams.page_no = page;
   loadData();
 };

 // 重置查询
 const resetQuery = () => {
   // 重置主体选择
   selectedEntityName.value = '';

   // 重置为默认应用
   if (appList.value.length > 0) {
     // 如果用户有权限显示全部游戏，默认选择全部游戏
     if (showAllGamesOption.value) {
       selectedAppId.value = 'all_games';
       queryParams.mp_id = 'all_games';
     } else {
       selectedAppId.value = appList.value[0].appid;
       queryParams.mp_id = appList.value[0].appid;
     }
   } else {
     selectedAppId.value = '';
     queryParams.mp_id = '';
   }

   queryParams.query_type = 'single_day';
   queryParams.date_hour = '';
   queryParams.start_date = '';
   queryParams.end_date = '';
   queryParams.page_no = 1;
   queryParams.page_size = 10;
   stats.value = null;
   tableData.value = [];
   gamesWithRevenue.value = [];
   gamesWithoutRevenue.value = [];
   hasRecentQuery.value = false; // 重置查询标记
   error.value = null;
 };

 // 获取广告报告
 const fetchAdReport = async () => {
   loading.value = true;
   error.value = null;

   try {

     // 获取当前选中的应用配置
     let selectedApp = null;
     let isAllGamesMode = false;

     if (selectedAppId.value === 'all_games') {
       isAllGamesMode = true;
       // 选择全部游戏时，使用第一个应用作为基础配置（用于获取token等）
       selectedApp = appList.value[0];
       if (!selectedApp) {
         throw new Error('未找到任何应用配置');
       }
     } else {
       selectedApp = appList.value.find(app => app.appid === selectedAppId.value);
       if (!selectedApp) {
         throw new Error('未选择有效的应用');
       }
     }

     // 检查应用配置是否完整
     if (!selectedApp.appid || !selectedApp.appSecret) {
       throw new Error(`应用 "${selectedApp.name}" 缺少必要的配置信息 (appid 或 appSecret)`);
     }

     // 获取access_token
     const tokenResponse = await fetch('/api/douyin/test-connection', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json'
       },
       body: JSON.stringify({
         appid: selectedApp.appid,
         secret: selectedApp.appSecret
       })
     });

     const tokenResult = await tokenResponse.json();
     if (!tokenResponse.ok || tokenResult.code !== 0) {
       throw new Error('获取access_token失败: ' + (tokenResult.message || tokenResult.error));
     }

     const accessToken = tokenResult.data?.access_token;
     if (!accessToken) {
       throw new Error('获取到的access_token为空');
     }


     // 调用巨量引擎广告报告API
     const reportParams = {
       advertiser_id: selectedApp.advertiser_id || '1843320456982026', // 默认广告主ID
       start_date: queryParams.date_hour || new Date().toISOString().split('T')[0],
       end_date: queryParams.date_hour || new Date().toISOString().split('T')[0],
       fields: ['ad_id', 'impressions', 'clicks', 'media_source', 'platform'],
       page: 1,
       page_size: 10
     };


     const reportResponse = await fetch('/api/douyin/ad-report', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'Authorization': `Bearer ${accessToken}`
       },
       body: JSON.stringify(reportParams)
     });

     if (!reportResponse.ok) {
       throw new Error(`HTTP错误: ${reportResponse.status}`);
     }

     const reportResult = await reportResponse.json();

     if (reportResult.code === 0 && reportResult.data) {
       // 处理广告报告数据
       const reportData = reportResult.data.list || [];

       // 显示在调试面板中
       debugInfo.value = [];
       debugInfo.value.push(`广告报告获取成功，共 ${reportData.length} 条记录`);
       debugInfo.value.push(`查询日期: ${reportParams.start_date}`);
       debugInfo.value.push(`广告主ID: ${reportParams.advertiser_id}`);

       if (reportData.length > 0) {
         reportData.forEach((item, index) => {
           debugInfo.value.push(`记录 ${index + 1}: 广告ID=${item.ad_id}, 曝光=${item.impressions}, 点击=${item.clicks}, 来源=${item.media_source}, 平台=${item.platform}`);
         });
       } else {
         debugInfo.value.push('暂无广告报告数据');
       }

       alert(`广告报告获取成功！共 ${reportData.length} 条记录，请查看调试面板。`);
     } else {
       throw new Error(reportResult.message || '获取广告报告失败');
     }

   } catch (err) {
     console.error('❌ 获取广告报告失败:', err);
     error.value = err.message || '获取广告报告失败，请稍后重试';
     alert('获取广告报告失败: ' + err.message);
   } finally {
     loading.value = false;
   }
 };



 // 页面加载时初始化
 onMounted(async () => {

   // 确保用户设备信息已获取（强制获取最新的设备信息）
   try {
     await userStore.fetchDeviceInfo();
   } catch (deviceError) {
     // 即使获取失败也继续执行，不阻塞页面初始化
   }

   // 加载流量主金额

   // 加载主体列表和应用列表
   await loadEntityList();
   await loadAppList();

   // 设置默认选中的应用 - 优先选择有正确广告参数的应用
   if (appList.value.length > 0) {
     // 查找有正确广告参数的应用（神仙游）
     const validApp = appList.value.find(app =>
       app.advertiser_id === '1843320456982026' &&
       app.promotion_id === '7550558554752532523'
     );

     if (validApp) {
       selectedAppId.value = validApp.appid;
       queryParams.mp_id = validApp.appid;
     } else {
       // 降级到第一个应用
       selectedAppId.value = appList.value[0].appid;
       queryParams.mp_id = appList.value[0].appid;
     }

     // 设置默认日期为当天
     const today = new Date();
     queryParams.date_hour = today.toISOString().split('T')[0];

     // 自动加载数据
     loadData();
   } else {
     console.log('⚠️ 用户暂无应用，跳过数据加载');
   }
   await loadTrafficMasterAmount();
 });
 </script>

 <style scoped>
 .ecpm-page {
   max-width: 1400px;
   margin: 0 auto;
   padding: 20px;
   background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
   min-height: 100vh;
   border-radius: 16px;
   box-shadow: inset 0 0 50px rgba(0, 0, 0, 0.05);
 }

 .page-header {
   margin-bottom: 30px;
   background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
   border-radius: 12px;
   padding: 24px;
   color: white;
   box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
 }

 .page-header h1 {
   font-size: 28px;
   font-weight: 600;
   margin: 0 0 8px 0;
   display: flex;
   align-items: center;
   gap: 12px;
 }

 .page-header h1::before {
   content: "📊";
   font-size: 32px;
 }

 .page-header p {
   margin: 0;
   opacity: 0.9;
   font-size: 16px;
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

 /* 调试信息面板 */
 .debug-section {
   background: #f6f8fa;
   border: 1px solid #d1d9e0;
   border-radius: 8px;
   padding: 16px;
   margin-bottom: 24px;
 }

 .debug-header {
   display: flex;
   justify-content: space-between;
   align-items: center;
   margin-bottom: 12px;
 }

 .debug-header h3 {
   margin: 0;
   font-size: 16px;
   color: #24292f;
 }

 .debug-actions {
   display: flex;
   gap: 8px;
 }

 .btn-warning {
   background: #faad14;
   color: white;
 }

 .btn-warning:hover:not(:disabled) {
   background: #d48806;
 }

 .debug-content {
   max-height: 300px;
   overflow-y: auto;
   background: #ffffff;
   border: 1px solid #d1d9e0;
   border-radius: 4px;
 }

 .debug-item {
   padding: 8px 12px;
   border-bottom: 1px solid #f6f8fa;
   font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
   font-size: 12px;
   line-height: 1.4;
 }

 .debug-item:last-child {
   border-bottom: none;
 }

 .debug-item pre {
   margin: 0;
   white-space: pre-wrap;
   word-break: break-all;
 }

 /* 查询表单 */
 .query-section {
   background: linear-gradient(135deg, #fff 0%, #f8f9ff 100%);
   border-radius: 12px;
   padding: 28px;
   margin-bottom: 24px;
   box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
   border: 1px solid rgba(102, 126, 234, 0.1);
 }

 .form-grid {
   display: grid;
   grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
   gap: 20px;
   margin-bottom: 24px;
 }

 .form-item {
   display: flex;
   flex-direction: column;
 }

 .form-item label {
   display: block;
   font-weight: 600;
   color: #1d2129;
   margin-bottom: 10px;
   font-size: 14px;
 }

 .form-input {
   width: 100%;
   padding: 12px 16px;
   border: 2px solid #e8e8e8;
   border-radius: 8px;
   font-size: 14px;
   transition: all 0.3s ease;
   background: white;
 }

 .form-input:focus {
   outline: none;
   border-color: #667eea;
   box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
   transform: translateY(-1px);
 }

 .form-input select {
   cursor: pointer;
   appearance: none;
   background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
   background-position: right 0.5rem center;
   background-repeat: no-repeat;
   background-size: 1.5em 1.5em;
   padding-right: 2.5rem;
 }

 .form-input-wide {
   min-width: 250px;
   max-width: 350px;
 }

 .form-actions {
   display: flex;
   gap: 16px;
   justify-content: center;
   flex-wrap: wrap;
 }

 /* 应用选择组样式 */
 .app-selection-group {
   display: flex;
   gap: 8px;
   align-items: flex-end;
 }

 .app-selection-group .form-input {
   flex: 1;
 }

 .gray-games-btn {
   white-space: nowrap;
   min-width: 80px;
 }

 .gray-games-btn:hover:not(:disabled) {
   background: linear-gradient(135deg, #e8e8e8 0%, #d0d0d0 100%);
   transform: translateY(-1px);
   box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
 }

 /* 批量操作按钮样式 */
 .batch-change-btn {
   background: linear-gradient(135deg, #faad14 0%, #d48806 100%);
   color: white;
   border: none;
   padding: 6px 12px;
   font-size: 12px;
   border-radius: 6px;
   cursor: pointer;
   transition: all 0.3s ease;
   box-shadow: 0 2px 8px rgba(250, 173, 20, 0.3);
 }

 .batch-change-btn:hover:not(:disabled) {
   background: linear-gradient(135deg, #d48806 0%, #b37300 100%);
   transform: translateY(-1px);
   box-shadow: 0 4px 12px rgba(250, 173, 20, 0.5);
 }

 /* 按钮样式 */
 .btn {
   padding: 10px 20px;
   border: none;
   border-radius: 8px;
   font-size: 14px;
   font-weight: 500;
   cursor: pointer;
   transition: all 0.3s ease;
   box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
 }

 .btn:disabled {
   opacity: 0.6;
   cursor: not-allowed;
   transform: none !important;
 }

 .btn-primary {
   background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
   color: white;
 }

 .btn-primary:hover:not(:disabled) {
   background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
   transform: translateY(-2px);
   box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
 }

 .btn-secondary {
   background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
   color: #1d2129;
   border: 1px solid #d9d9d9;
 }

 .btn-secondary:hover {
   background: linear-gradient(135deg, #e8e8e8 0%, #d0d0d0 100%);
   transform: translateY(-1px);
   box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
 }

 .btn-success {
   background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
   color: white;
 }

 .btn-success:hover:not(:disabled) {
   background: linear-gradient(135deg, #389e0d 0%, #237804 100%);
   transform: translateY(-2px);
   box-shadow: 0 4px 15px rgba(82, 196, 26, 0.4);
 }

 .btn-info {
   background: linear-gradient(135deg, #13c2c2 0%, #08979c 100%);
   color: white;
 }

 .btn-info:hover {
   background: linear-gradient(135deg, #08979c 0%, #006d75 100%);
   transform: translateY(-2px);
   box-shadow: 0 4px 15px rgba(19, 194, 194, 0.4);
 }

 .btn-danger {
   background: linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%);
   color: white;
 }

 .btn-danger:hover:not(:disabled) {
   background: linear-gradient(135deg, #cf1322 0%, #a8071a 100%);
   transform: translateY(-2px);
   box-shadow: 0 4px 15px rgba(255, 77, 79, 0.4);
 }

 .btn-small {
   padding: 6px 12px;
   font-size: 12px;
   border-radius: 6px;
 }

 .btn-qr-preview {
   background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
   color: white;
   border: none;
   padding: 12px 24px;
   font-size: 14px;
   font-weight: 500;
   border-radius: 8px;
   cursor: pointer;
   transition: all 0.3s ease;
   box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
 }

 .btn-qr-preview:hover:not(:disabled) {
   background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
   transform: translateY(-2px);
   box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
 }

 /* 统计卡片 */
 .stats-section {
   margin-bottom: 24px;
 }

 .stats-grid {
   display: grid;
   grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
   gap: 20px;
 }

 /* 当日游戏状态 */
 .game-status-section {
   margin-top: 24px;
   padding-top: 24px;
   border-top: 1px solid rgba(102, 126, 234, 0.1);
 }

 .game-status-grid {
   display: grid;
   grid-template-columns: 1fr 1fr;
   gap: 24px;
 }

 .game-status-card {
   background: linear-gradient(135deg, #fff 0%, #f8f9ff 100%);
   border-radius: 12px;
   padding: 20px;
   box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
   border: 1px solid rgba(102, 126, 234, 0.1);
 }

 .game-status-title {
   font-size: 16px;
   font-weight: 600;
   color: #1d2129;
   margin-bottom: 16px;
   display: flex;
   align-items: center;
   gap: 8px;
 }

 .game-list {
   max-height: 300px;
   overflow-y: auto;
 }

 .game-item {
   display: flex;
   justify-content: space-between;
   align-items: center;
   padding: 8px 12px;
   margin-bottom: 8px;
   background: rgba(102, 126, 234, 0.05);
   border-radius: 6px;
   border: 1px solid rgba(102, 126, 234, 0.1);
 }

 .game-item:last-child {
   margin-bottom: 0;
 }

 .game-name {
   font-weight: 500;
   color: #1d2129;
   flex: 1;
 }

 .game-revenue {
   font-weight: 600;
   color: #52c41a;
 }

 .no-data {
   text-align: center;
   color: #86909c;
   font-style: italic;
   padding: 20px;
 }

 .stat-card {
   background: linear-gradient(135deg, #fff 0%, #f8f9ff 100%);
   border-radius: 12px;
   padding: 24px;
   text-align: center;
   box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
   border: 1px solid rgba(102, 126, 234, 0.1);
   transition: all 0.3s ease;
   position: relative;
   overflow: hidden;
 }

 .stat-card::before {
   content: '';
   position: absolute;
   top: 0;
   left: 0;
   right: 0;
   height: 4px;
   background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
 }

 .stat-card:hover {
   transform: translateY(-2px);
   box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
 }

 .stat-card:nth-child(1)::before { background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); }
 .stat-card:nth-child(2)::before { background: linear-gradient(90deg, #52c41a 0%, #389e0d 100%); }
 .stat-card:nth-child(3)::before { background: linear-gradient(90deg, #faad14 0%, #d48806 100%); }
 .stat-card:nth-child(4)::before { background: linear-gradient(90deg, #13c2c2 0%, #08979c 100%); }
 .stat-card:nth-child(5)::before { background: linear-gradient(90deg, #722ed1 0%, #531dab 100%); }

 .stat-value {
   font-size: 28px;
   font-weight: 700;
   color: #1d2129;
   margin-bottom: 8px;
   display: block;
 }

 .stat-label {
   color: #86909c;
   font-size: 14px;
   font-weight: 500;
 }

 /* 数据表格 */
 .table-section {
   background: linear-gradient(135deg, #fff 0%, #f8f9ff 100%);
   border-radius: 12px;
   box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
   overflow: hidden;
   border: 1px solid rgba(102, 126, 234, 0.1);
 }

 .table-header {
   padding: 24px;
   border-bottom: 1px solid #e8e8e8;
   display: flex;
   justify-content: space-between;
   align-items: center;
   background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%);
 }

 .table-header h3 {
   margin: 0;
   font-size: 18px;
   font-weight: 600;
   color: #1d2129;
   display: flex;
   align-items: center;
   gap: 8px;
 }

 .table-header h3::before {
   content: "📋";
   font-size: 20px;
 }

 .table-info {
   color: #86909c;
   font-size: 14px;
   font-weight: 500;
 }

 .table-container {
   overflow-x: auto;
 }

 .data-table {
   width: 100%;
   border-collapse: collapse;
 }

 .data-table th,
 .data-table td {
   padding: 16px 20px;
   text-align: left;
   border-bottom: 1px solid #f0f0f0;
   font-size: 14px;
 }

 .data-table th {
   background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%);
   font-weight: 600;
   color: #1d2129;
   white-space: nowrap;
   border-bottom: 2px solid #e8e8e8;
 }

 .data-table td {
   color: #4e5969;
   transition: background-color 0.2s ease;
 }

 .data-table tr:hover {
   background: linear-gradient(135deg, #f7f8fa 0%, #f0f2ff 100%);
 }

 .data-table tr:hover td {
   color: #1d2129;
 }

 .loading-cell,
 .empty-cell {
   text-align: center;
   color: #86909c;
   font-style: italic;
 }

 .loading-spinner {
   display: inline-block;
   width: 16px;
   height: 16px;
   border: 2px solid #f0f0f0;
   border-top: 2px solid #165dff;
   border-radius: 50%;
   animation: spin 1s linear infinite;
   margin-right: 8px;
 }

 @keyframes spin {
   0% { transform: rotate(0deg); }
   100% { transform: rotate(360deg); }
 }

 /* 错误提示 */
 .error-section {
   background: #fff2f0;
   border: 1px solid #ffccc7;
   border-radius: 8px;
   padding: 16px 20px;
   margin-top: 20px;
   display: flex;
   justify-content: space-between;
   align-items: center;
 }

 .error-message {
   color: #cf1322;
   margin: 0;
 }


 /* 响应式设计 */
 @media (max-width: 768px) {
   .ecpm-page {
     padding: 16px;
   }

   .form-row {
     flex-direction: column;
   }

   .form-item {
     min-width: auto;
   }

   .stats-grid {
     grid-template-columns: 1fr;
   }

   .table-header {
     flex-direction: column;
     align-items: flex-start;
     gap: 8px;
   }

   .data-table {
     font-size: 14px;
   }

   .data-table th,
   .data-table td {
     padding: 8px 12px;
   }

   .analysis-header {
     flex-direction: column;
     align-items: flex-start;
     gap: 8px;
   }

   .analysis-info {
     flex-direction: column;
     align-items: flex-start;
     gap: 4px;
   }

   .analysis-grid {
     grid-template-columns: 1fr;
   }

   .device-item, .city-item, .hour-item {
     flex-direction: column;
     align-items: flex-start;
     gap: 4px;
   }
 }

 /* 二维码样式 */
 .qr-code-cell {
   display: flex;
   align-items: center;
   justify-content: center;
 }

 .qr-code-image {
   width: 40px;
   height: 40px;
   cursor: pointer;
   border-radius: 4px;
   transition: transform 0.2s;
 }

 .qr-code-image:hover {
   transform: scale(1.1);
 }


 /* 二维码模态框 */
 .qr-modal .modal-content {
   max-width: 400px;
 }

 .qr-info {
   display: flex;
   gap: 20px;
   align-items: flex-start;
 }

 .qr-details {
   flex: 1;
 }

 .qr-details p {
   margin: 8px 0;
   font-size: 14px;
 }

 .qr-code-large {
   display: flex;
   justify-content: center;
   align-items: center;
   min-height: 150px;
 }

 .qr-code-large-image {
   width: 150px;
   height: 150px;
   border: 2px solid #e5e6eb;
   border-radius: 8px;
 }

 .qr-loading {
   color: #86909c;
   font-size: 14px;
 }

 .qr-actions {
   display: flex;
   gap: 12px;
   margin-top: 20px;
   justify-content: center;
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

 /* 绑定操作样式 */
 .bind-action-cell {
   display: flex;
   align-items: center;
   justify-content: center;
 }

 /* 用户名和应用名称列样式 */
 .username-cell,
 .app-name-cell {
   max-width: 150px;
   overflow: hidden;
   text-overflow: ellipsis;
   white-space: nowrap;
 }


 /* 流量主单元格样式 */
 .traffic-master-cell {
   display: flex;
   align-items: center;
   gap: 8px;
   justify-content: center;
 }

 .traffic-master-cell .form-input {
   flex: 1;
   min-width: 80px;
 }

 /* 流量主输入框样式 */
 .traffic-master-input-group {
   display: flex;
   align-items: center;
   gap: 6px;
   justify-content: center;
   margin-top: 8px;
 }

 .traffic-master-input-group .form-input {
   flex: 1;
   min-width: 90px;
   text-align: center;
   font-size: 12px;
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

 /* 绑定操作样式 */
 .bind-action-cell {
   display: flex;
   align-items: center;
   justify-content: center;
 }

 /* 用户名和应用名称列样式 */
 .username-cell,
 .app-name-cell {
   max-width: 150px;
   overflow: hidden;
   text-overflow: ellipsis;
   white-space: nowrap;
 }


 /* 流量主单元格样式 */
 .traffic-master-cell {
   display: flex;
   align-items: center;
   gap: 8px;
   justify-content: center;
 }

 .traffic-master-cell .form-input {
   flex: 1;
   min-width: 80px;
 }

 /* 流量主输入框样式 */
 .traffic-master-input-group {
   display: flex;
   align-items: center;
   gap: 6px;
   justify-content: center;
   margin-top: 8px;
 }

 .traffic-master-input-group .form-input {
   flex: 1;
   min-width: 90px;
   text-align: center;
   font-size: 12px;
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
