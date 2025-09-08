import Mock from 'mockjs';
import qs from 'query-string';
import setupMock, { successResponseWrap } from '@/utils/setup-mock';
import { GetParams } from '@/types/global';

const { Random } = Mock;

// 应用名称列表
const appNames = [
  '开心消消乐',
  '王者荣耀',
  '和平精英',
  '原神',
  '明日方舟',
  '阴阳师',
  '第五人格',
  '崩坏3',
  '狼人杀',
  '剑与远征',
  '三国志·战略版',
  '江南百景图',
  '最强蜗牛',
  '一念逍遥',
  '放置少女',
];

// 广告名称列表
const adNames = [
  '新用户注册活动',
  '限时特惠礼包',
  '首充双倍奖励',
  '节日限定皮肤',
  '新手成长礼包',
  'VIP专属福利',
  '限时折扣活动',
  '周末狂欢特惠',
  '新版本预告',
  '限时抽奖活动',
];

// 生成固定的mock数据
const generateMockData = () => {
  const list = [];
  const today = new Date();
  
  for (let i = 1; i <= 55; i++) {
    const adType = ['信息流', '激励视频', '开屏广告', '插屏广告', 'Banner广告'][Math.floor(Math.random() * 5)];
    const platform = ['Android', 'iOS', 'Web'][Math.floor(Math.random() * 3)];
    const status = ['投放中', '已暂停', '已结束', '审核中', '审核拒绝'][Math.floor(Math.random() * 5)];
    
    // 生成随机日期（最近30天）
    const date = new Date();
    date.setDate(today.getDate() - Math.floor(Math.random() * 30));
    const dateStr = date.toISOString().split('T')[0];
    
    // 生成随机数据
    const show = Math.floor(Math.random() * 100000) + 1000; // 1000-101000
    const click = Math.floor(show * (Math.random() * 0.1 + 0.01)); // 点击率1%-11%
    const ctr = parseFloat((click / show * 100).toFixed(2));
    const cost = parseFloat((Math.random() * 10000 + 100).toFixed(2)); // 100-10100
    const cpc = parseFloat((cost / click).toFixed(2));
    const cpm = parseFloat((cost / show * 1000).toFixed(2));
    const convert = Math.floor(click * (Math.random() * 0.2 + 0.1)); // 转化率10%-30%
    const convertCost = parseFloat((cost / convert).toFixed(2));
    const convertRate = parseFloat((convert / click * 100).toFixed(2));
    const revenue = parseFloat((cost * (Math.random() * 0.5 + 0.5)).toFixed(2)); // 收入的50%-100%
    const roi = parseFloat(((revenue / cost) * 100).toFixed(2));
    
    list.push({
      id: i,
      ad_id: `AD${(10000 + i).toString().substring(1)}`,
      ad_name: adNames[Math.floor(Math.random() * adNames.length)],
      app_name: appNames[Math.floor(Math.random() * appNames.length)],
      ad_type: adType,
      platform,
      date: dateStr,
      show,
      click,
      ctr,
      cost,
      cpc,
      cpm,
      convert,
      convert_cost: convertCost,
      convert_rate: convertRate,
      revenue,
      roi,
      status,
      created_time: dateStr,
      updated_time: dateStr,
    });
  }
  return list;
};

const data = { list: generateMockData() };

setupMock({
  setup() {
    // 查询搜索表格数据列表
    Mock.mock(new RegExp('/api/search-table/list'), (params: GetParams) => {
      const query = qs.parseUrl(params.url).query;
      const { current = 1, pageSize = 20, ad_id, ad_name, app_name, ad_type, platform, status, dateRange } = query;
      const p = Number(current);
      const ps = Number(pageSize);

      // 应用筛选条件
      let filteredList = [...data.list];

      // 广告ID筛选
      if (ad_id) {
        filteredList = filteredList.filter(item =>
          item.ad_id.toLowerCase().includes((ad_id as string).toLowerCase())
        );
      }

      // 广告名称筛选
      if (ad_name) {
        filteredList = filteredList.filter(item =>
          item.ad_name.includes(ad_name as string)
        );
      }

      // 应用名称筛选
      if (app_name) {
        filteredList = filteredList.filter(item =>
          item.app_name.includes(app_name as string)
        );
      }

      // 广告类型筛选
      if (ad_type) {
        filteredList = filteredList.filter(item => item.ad_type === ad_type);
      }

      // 平台筛选
      if (platform) {
        filteredList = filteredList.filter(item => item.platform === platform);
      }

      // 状态筛选
      if (status) {
        filteredList = filteredList.filter(item => item.status === status);
      }

      // 日期范围筛选
      if (dateRange && Array.isArray(dateRange) && dateRange.length === 2) {
        const [start, end] = dateRange;
        filteredList = filteredList.filter(item => {
          const itemDate = new Date(item.date).getTime();
          return itemDate >= new Date(start).getTime() &&
                 itemDate <= new Date(end).getTime();
        });
      }

      return successResponseWrap({
        list: filteredList.slice((p - 1) * ps, p * ps),
        total: filteredList.length,
      });
    });

    // 获取统计数据
    Mock.mock(new RegExp('/api/search-table/statistics'), () => {
      const totalAds = data.list.length;
      const totalBudget = data.list.reduce(
        (sum, item) => sum + item.cost,
        0
      );
      const avgCtr =
        data.list.reduce((sum, item) => sum + item.ctr, 0) / totalAds;
      const totalConversions = data.list.reduce(
        (sum, item) => sum + item.convert,
        0
      );

      return successResponseWrap({
        totalAds,
        totalBudget,
        avgCtr: Math.round(avgCtr * 100) / 100,
        totalConversions,
      });
    });
  },
});
