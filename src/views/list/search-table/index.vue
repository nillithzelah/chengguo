<template>
  <div class="container">
    <Breadcrumb :items="['menu.list', 'menu.list.searchTable']" />
    
    <!-- 网络诊断组件 -->
    <NetworkDiagnostic 
      :error="networkError" 
      @retry="handleRetryConnection"
      @switch-mode="handleSwitchMode"
    />
    
    <!-- API配置面板 -->
    <ApiConfig ref="apiConfigRef" v-if="isDev" />
    
    <a-card class="general-card" :title="$t('menu.list.searchTable')">
      <a-row>
        <a-col :flex="1">
          <a-form
            :model="formModel"
            :label-col-props="{ span: 6 }"
            :wrapper-col-props="{ span: 18 }"
            label-align="left"
          >
            <a-row :gutter="16">
              <a-col :span="8">
                <a-form-item field="ad_id" label="广告ID">
                  <a-input
                    v-model="formModel.ad_id"
                    placeholder="请输入广告ID"
                    allow-clear
                  />
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item field="ad_name" label="广告名称">
                  <a-input
                    v-model="formModel.ad_name"
                    placeholder="请输入广告名称"
                    allow-clear
                  />
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item field="app_name" label="应用名称">
                  <a-input
                    v-model="formModel.app_name"
                    placeholder="请输入应用名称"
                    allow-clear
                  />
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item field="ad_type" label="广告类型">
                  <a-select
                    v-model="formModel.ad_type"
                    :options="adTypeOptions"
                    placeholder="请选择广告类型"
                    allow-clear
                  />
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item field="platform" label="平台">
                  <a-select
                    v-model="formModel.platform"
                    :options="platformOptions"
                    placeholder="请选择平台"
                    allow-clear
                  />
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item field="status" label="状态">
                  field="status"
                  :label="$t('searchTable.form.status')"
                >
                  <a-select
                    v-model="formModel.status"
                    :options="statusOptions"
                    :placeholder="$t('searchTable.form.selectDefault')"
                  />
                </a-form-item>
              </a-col>
            </a-row>
          </a-form>
        </a-col>
        <a-divider style="height: 84px" direction="vertical" />
        <a-col :flex="'86px'" style="text-align: right">
          <a-space direction="vertical" :size="18">
            <a-button type="primary" @click="search">
              <template #icon>
                <icon-search />
              </template>
              {{ $t('searchTable.form.search') }}
            </a-button>
            <a-button @click="reset">
              <template #icon>
                <icon-refresh />
              </template>
              {{ $t('searchTable.form.reset') }}
            </a-button>
          </a-space>
        </a-col>
      </a-row>
      <a-divider style="margin-top: 0" />
      <a-row style="margin-bottom: 16px">
        <a-col :span="12">
          <a-space>
            <a-button type="primary">
              <template #icon>
                <icon-plus />
              </template>
              {{ $t('searchTable.operation.create') }}
            </a-button>
            <a-upload action="/">
              <template #upload-button>
                <a-button>
                  {{ $t('searchTable.operation.import') }}
                </a-button>
              </template>
            </a-upload>
          </a-space>
        </a-col>
        <a-col
          :span="12"
          style="display: flex; align-items: center; justify-content: end"
        >
          <a-button>
            <template #icon>
              <icon-download />
            </template>
            {{ $t('searchTable.operation.download') }}
          </a-button>
          <a-tooltip :content="$t('searchTable.actions.refresh')">
            <div class="action-icon" @click="search"
              ><icon-refresh size="18"
            /></div>
          </a-tooltip>
          <a-dropdown @select="handleSelectDensity">
            <a-tooltip :content="$t('searchTable.actions.density')">
              <div class="action-icon"><icon-line-height size="18" /></div>
            </a-tooltip>
            <template #content>
              <a-doption
                v-for="item in densityList"
                :key="item.value"
                :value="item.value"
                :class="{ active: item.value === size }"
              >
                <span>{{ item.name }}</span>
              </a-doption>
            </template>
          </a-dropdown>
          <a-tooltip :content="$t('searchTable.actions.columnSetting')">
            <a-popover
              trigger="click"
              position="bl"
              @popup-visible-change="popupVisibleChange"
            >
              <div class="action-icon"><icon-settings size="18" /></div>
              <template #content>
                <div id="tableSetting">
                  <div
                    v-for="(item, index) in showColumns"
                    :key="item.dataIndex"
                    class="setting"
                  >
                    <div style="margin-right: 4px; cursor: move">
                      <icon-drag-arrow />
                    </div>
                    <div>
                      <a-checkbox
                        v-model="item.checked"
                        @change="
                          handleChange($event, item as TableColumnData, index)
                        "
                      >
                      </a-checkbox>
                    </div>
                    <div class="title">
                      {{ item.title === '#' ? '序列号' : item.title }}
                    </div>
                  </div>
                </div>
              </template>
            </a-popover>
          </a-tooltip>
        </a-col>
      </a-row>
      <a-table
        row-key="id"
        :loading="loading"
        :pagination="pagination"
        :columns="(cloneColumns as TableColumnData[])"
        :data="renderData"
        :bordered="false"
        :size="size"
        @page-change="onPageChange"
      >
        <template #index="{ rowIndex }">
          {{ rowIndex + 1 + (pagination.current - 1) * pagination.pageSize }}
        </template>
        <template #adType="{ record }">
          <a-tag :color="{
            '信息流': 'blue',
            '激励视频': 'orange',
            '开屏广告': 'green',
            '插屏广告': 'purple',
            'Banner广告': 'cyan'
          }[record.ad_type] || 'gray'">
            {{ record.ad_type }}
          </a-tag>
        </template>
        <template #show="{ record }">
          {{ record.show.toLocaleString() }}
        </template>
        <template #click="{ record }">
          {{ record.click.toLocaleString() }}
        </template>
        <template #ctr="{ record }">
          {{ record.ctr }}%
        </template>
        <template #cost="{ record }">
          ¥{{ record.cost.toFixed(2) }}
        </template>
        <template #cpc="{ record }">
          ¥{{ record.cpc.toFixed(2) }}
        </template>
        <template #cpm="{ record }">
          ¥{{ record.cpm.toFixed(2) }}
        </template>
        <template #convert="{ record }">
          {{ record.convert.toLocaleString() }}
        </template>
        <template #convertCost="{ record }">
          ¥{{ record.convert_cost.toFixed(2) }}
        </template>
        <template #convertRate="{ record }">
          {{ record.convert_rate }}%
        </template>
        <template #revenue="{ record }">
          ¥{{ record.revenue.toFixed(2) }}
        </template>
        <template #roi="{ record }">
          {{ record.roi }}%
        </template>
        <template #status="{ record }">
          <a-tag :color="{
            '投放中': 'green',
            '已暂停': 'orange',
            '已结束': 'gray',
            '审核中': 'blue',
            '审核拒绝': 'red'
          }[record.status] || 'gray'">
            {{ record.status }}
          </a-tag>
        </template>
        <template #operations="{ record }">
          <a-space>
            <a-button v-permission="['admin']" type="text" size="small">
              {{ $t('searchTable.columns.operations.view') }}
            </a-button>
            <a-button v-permission="['admin']" type="text" size="small">
              {{ $t('searchTable.columns.operations.edit') }}
            </a-button>
            <a-button 
              v-if="record.status === 'active'" 
              v-permission="['admin']" 
              type="text" 
              size="small"
            >
              {{ $t('searchTable.columns.operations.pause') }}
            </a-button>
            <a-button 
              v-if="record.status === 'paused'" 
              v-permission="['admin']" 
              type="text" 
              size="small"
            >
              {{ $t('searchTable.columns.operations.resume') }}
            </a-button>
          </a-space>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script lang="ts" setup>
  import { computed, ref, watch, reactive, nextTick } from 'vue';
  import { useI18n } from 'vue-i18n';
  import useLoading from '@/hooks/loading';
  import { Pagination } from '@/types/global';
  import type { SelectOptionData } from '@arco-design/web-vue/es/select/interface';
  import type { TableColumnData } from '@arco-design/web-vue/es/table/interface';
  import cloneDeep from 'lodash/cloneDeep';
  import Sortable from 'sortablejs';
  import ApiConfig from '@/components/api-config/index.vue';
  import NetworkDiagnostic from '@/components/network-diagnostic.vue';

  // 定义搜索表格数据接口
  interface SearchTableRecord {
    id: number;
    ad_id: string;
    ad_name: string;
    app_name: string;
    ad_type: string;
    platform: string;
    date: string;
    show: number;
    click: number;
    ctr: number;
    cost: number;
    cpc: number;
    cpm: number;
    convert: number;
    convert_cost: number;
    convert_rate: number;
    revenue: number;
    roi: number;
    status: string;
    created_time: string;
    updated_time: string;
  }

  interface SearchTableParams {
    current: number;
    pageSize: number;
    ad_id?: string;
    ad_name?: string;
    app_name?: string;
    ad_type?: string;
    platform?: string;
    status?: string;
    dateRange?: string[];
  }

  type SizeProps = 'mini' | 'small' | 'medium' | 'large';
  type Column = TableColumnData & { checked?: true };

  // 开发环境检测
  const isDev = import.meta.env.DEV;

  const generateFormModel = () => {
    return {
      ad_id: '',
      ad_name: '',
      app_name: '',
      ad_type: '',
      platform: '',
      status: '',
    };
  };
  const { loading, setLoading } = useLoading(true);
  const { t } = useI18n();
  const renderData = ref<SearchTableRecord[]>([]);
  const formModel = ref(generateFormModel());
  const cloneColumns = ref<Column[]>([]);
  const showColumns = ref<Column[]>([]);
  const apiConfigRef = ref();
  const networkError = ref<Error | null>(null);

  const size = ref<SizeProps>('medium');

  const basePagination: Pagination = {
    current: 1,
    pageSize: 20,
  };
  const pagination = reactive({
    ...basePagination,
  });
  const densityList = computed(() => [
    {
      name: t('searchTable.size.mini'),
      value: 'mini',
    },
    {
      name: t('searchTable.size.small'),
      value: 'small',
    },
    {
      name: t('searchTable.size.medium'),
      value: 'medium',
    },
    {
      name: t('searchTable.size.large'),
      value: 'large',
    },
  ]);
  const columns = computed<TableColumnData[]>(() => [
    {
      title: '日期',
      dataIndex: 'date',
      width: 120,
      fixed: 'left',
    },
    {
      title: '广告ID',
      dataIndex: 'ad_id',
      width: 180,
      fixed: 'left',
    },
    {
      title: '广告名称',
      dataIndex: 'ad_name',
      width: 200,
      ellipsis: true,
      tooltip: true,
      fixed: 'left',
    },
    {
      title: '应用名称',
      dataIndex: 'app_name',
      width: 150,
      ellipsis: true,
      tooltip: true,
    },
    {
      title: '广告类型',
      dataIndex: 'ad_type',
      width: 120,
      slotName: 'adType',
    },
    {
      title: '投放平台',
      dataIndex: 'platform',
      width: 100,
    },
    {
      title: '展示数',
      dataIndex: 'show',
      width: 120,
      align: 'right',
      slotName: 'show',
    },
    {
      title: '点击数',
      dataIndex: 'click',
      width: 120,
      align: 'right',
      slotName: 'click',
    },
    {
      title: '点击率',
      dataIndex: 'ctr',
      width: 120,
      align: 'right',
      slotName: 'ctr',
    },
    {
      title: '消耗(元)',
      dataIndex: 'cost',
      width: 120,
      align: 'right',
      slotName: 'cost',
    },
    {
      title: 'CPC(元)',
      dataIndex: 'cpc',
      width: 120,
      align: 'right',
      slotName: 'cpc',
    },
    {
      title: 'CPM(元)',
      dataIndex: 'cpm',
      width: 120,
      align: 'right',
      slotName: 'cpm',
    },
    {
      title: '转化数',
      dataIndex: 'convert',
      width: 120,
      align: 'right',
      slotName: 'convert',
    },
    {
      title: '转化成本',
      dataIndex: 'convert_cost',
      width: 120,
      align: 'right',
      slotName: 'convertCost',
    },
    {
      title: '转化率',
      dataIndex: 'convert_rate',
      width: 120,
      align: 'right',
      slotName: 'convertRate',
    },
    {
      title: '收益(元)',
      dataIndex: 'revenue',
      width: 120,
      align: 'right',
      slotName: 'revenue',
    },
    {
      title: 'ROI',
      dataIndex: 'roi',
      width: 100,
      align: 'right',
      slotName: 'roi',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      fixed: 'right',
      slotName: 'status',
    },
    {
      title: '操作',
      dataIndex: 'operations',
      width: 120,
      fixed: 'right',
      slotName: 'operations',
    },
  ]);
  // 广告类型选项
  const adTypeOptions = computed<SelectOptionData[]>(() => [
    { label: '信息流', value: '信息流' },
    { label: '激励视频', value: '激励视频' },
    { label: '开屏广告', value: '开屏广告' },
    { label: '插屏广告', value: '插屏广告' },
    { label: 'Banner广告', value: 'Banner广告' },
  ]);

  // 平台选项
  const platformOptions = computed<SelectOptionData[]>(() => [
    { label: 'Android', value: 'Android' },
    { label: 'iOS', value: 'iOS' },
    { label: 'Web', value: 'Web' },
  ]);

  // 状态选项
  const statusOptions = computed<SelectOptionData[]>(() => [
    { label: '投放中', value: '投放中' },
    { label: '已暂停', value: '已暂停' },
    { label: '已结束', value: '已结束' },
    { label: '审核中', value: '审核中' },
    { label: '审核拒绝', value: '审核拒绝' },
  ]);

  // 日期范围
  const dateRange = ref();
  const fetchData = async (
    params: SearchTableParams = { current: 1, pageSize: 20 }
  ) => {
    setLoading(true);
    networkError.value = null; // 清除之前的错误
    try {
      // 模拟API调用 - 使用Mock数据
      const mockData = await new Promise<{ data: { list: SearchTableRecord[], total: number } }>((resolve) => {
        setTimeout(() => {
          // 这里可以调用实际的API，或者使用Mock数据
          // 暂时返回空数据，实际项目中需要实现数据获取逻辑
          resolve({
            data: {
              list: [],
              total: 0
            }
          });
        }, 500);
      });
      const { data } = mockData;
      renderData.value = data.list;
      pagination.current = params.current;
      pagination.total = data.total;
    } catch (err: any) {
      console.error('获取数据失败:', err);
      networkError.value = err; // 设置网络错误
      // 如果是网络错误，显示友好的错误信息
      if (err.message?.includes('Network Error')) {
        console.warn('🔄 检测到网络错误，系统已自动处理');
      }
    } finally {
      setLoading(false);
    }
  };

  // 处理重试连接
  const handleRetryConnection = () => {
    console.log('🔄 重试网络连接...');
    search();
  };

  // 处理模式切换
  const handleSwitchMode = (mode: 'mock' | 'real') => {
    console.log('🔧 切换数据模式:', mode);
    // 更新环境变量（仅影响当前会话）
    if (mode === 'mock') {
      // @ts-ignore
      import.meta.env.VITE_API_MODE = 'mock';
    } else {
      // @ts-ignore
      import.meta.env.VITE_API_MODE = 'real';
    }
    // 重新获取数据
    search();
  };

  const search = () => {
    const params: any = {
      ...basePagination,
      ...formModel.value,
    };
    
    // 添加日期范围参数
    if (dateRange.value && dateRange.value.length === 2) {
      params.dateRange = [
        dateRange.value[0].format('YYYY-MM-DD'),
        dateRange.value[1].format('YYYY-MM-DD'),
      ];
    }
    
    fetchData(params);
  };
  const onPageChange = (current: number) => {
    fetchData({ ...basePagination, current });
  };

  fetchData();
  const reset = () => {
    formModel.value = generateFormModel();
    search(); // 重置后立即查询
  };

  const handleSelectDensity = (
    val: string | number | Record<string, any> | undefined,
    e: Event
  ) => {
    size.value = val as SizeProps;
  };

  const handleChange = (
    checked: boolean | (string | boolean | number)[],
    column: Column,
    index: number
  ) => {
    if (!checked) {
      cloneColumns.value = showColumns.value.filter(
        (item) => item.dataIndex !== column.dataIndex
      );
    } else {
      cloneColumns.value.splice(index, 0, column);
    }
  };

  const exchangeArray = <T extends Array<any>>(
    array: T,
    beforeIdx: number,
    newIdx: number,
    isDeep = false
  ): T => {
    const newArray = isDeep ? cloneDeep(array) : array;
    if (beforeIdx > -1 && newIdx > -1) {
      // 先替换后面的，然后拿到替换的结果替换前面的
      newArray.splice(
        beforeIdx,
        1,
        newArray.splice(newIdx, 1, newArray[beforeIdx]).pop()
      );
    }
    return newArray;
  };

  const popupVisibleChange = (val: boolean) => {
    if (val) {
      nextTick(() => {
        const el = document.getElementById('tableSetting') as HTMLElement;
        const sortable = new Sortable(el, {
          onEnd(e: any) {
            const { oldIndex, newIndex } = e;
            exchangeArray(cloneColumns.value, oldIndex, newIndex);
            exchangeArray(showColumns.value, oldIndex, newIndex);
          },
        });
      });
    }
  };

  watch(
    () => columns.value,
    (val) => {
      cloneColumns.value = cloneDeep(val);
      cloneColumns.value.forEach((item, index) => {
        item.checked = true;
      });
      showColumns.value = cloneDeep(cloneColumns.value);
    },
    { deep: true, immediate: true }
  );
</script>

<script lang="ts">
  export default {
    name: 'SearchTable',
  };
</script>

<style scoped lang="less">
  .container {
    padding: 0 20px 20px 20px;
  }
  :deep(.arco-table-th) {
    &:last-child {
      .arco-table-th-item-title {
        margin-left: 16px;
      }
    }
  }
  .action-icon {
    margin-left: 12px;
    cursor: pointer;
  }
  .active {
    color: #0960bd;
    background-color: #e3f4fc;
  }
  .setting {
    display: flex;
    align-items: center;
    width: 200px;
    .title {
      margin-left: 12px;
      cursor: pointer;
    }
  }
  .circle {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #ff4d4f;
    margin-right: 4px;
    &.pass {
      background-color: #52c41a;
    }
    &.completed {
      background-color: #1890ff;
    }
    &.draft {
      background-color: #faad14;
    }
  }
</style>
