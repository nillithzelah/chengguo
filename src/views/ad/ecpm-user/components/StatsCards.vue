<template>
  <div class="stats-section" v-if="stats">
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">{{ stats.totalRecords }}</div>
        <div class="stat-label">总记录数</div>
      </div>

      <div class="stat-card">
        <div class="stat-value">¥{{ stats.totalRevenue }}</div>
        <div class="stat-label">总收益</div>
      </div>

      <div class="stat-card">
        <div class="stat-value">¥{{ trafficMasterAmount }}</div>
        <div class="stat-label">流量主</div>
        <!-- 只有管理员可以修改流量主金额 -->
        <div v-if="canEditTrafficMaster" class="traffic-master-input-group">
          <input
            v-model="manualAmount"
            type="number"
            placeholder="输入新金额"
            class="form-input form-input-small"
            @keyup.enter="updateTrafficMasterAmount"
          />
          <button
            @click="updateTrafficMasterAmount"
            class="btn btn-small btn-success"
            :disabled="!manualAmount || parseFloat(manualAmount) <= 0"
          >
            更新
          </button>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-value">¥{{ stats.totalEcpm }}</div>
        <div class="stat-label">总eCPM</div>
      </div>

      <div class="stat-card">
        <div class="stat-value">{{ stats.totalUsers }}</div>
        <div class="stat-label">活跃用户</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import useUserStore from '@/store/modules/user';

interface Stats {
  totalRecords: number;
  totalRevenue: string;
  totalEcpm: string;
  totalUsers: number;
}

interface Props {
  stats: Stats | null;
  trafficMasterAmount: string;
  userRole?: string;
}

interface Emits {
  'update-traffic-master': [amount: string];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const userStore = useUserStore();
const manualAmount = ref('');

// 计算是否可以编辑流量主金额
const canEditTrafficMaster = computed(() => {
  return userStore.userInfo?.role === 'admin';
});

// 更新流量主金额
const updateTrafficMasterAmount = () => {
  const amount = parseFloat(manualAmount.value);
  if (amount && amount > 0) {
    emit('update-traffic-master', amount.toString());
    manualAmount.value = '';
  }
};
</script>

<style scoped>
.stats-section {
  margin-bottom: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
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
  padding: 4px 8px;
}

.btn {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-success {
  background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: linear-gradient(135deg, #389e0d 0%, #237804 100%);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(82, 196, 26, 0.4);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .traffic-master-input-group {
    flex-direction: column;
    gap: 4px;
  }
}
</style>