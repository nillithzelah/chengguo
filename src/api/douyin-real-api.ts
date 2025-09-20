import axios, { AxiosInstance } from 'axios';
// 定义抖音游戏广告相关类型（内联定义，避免外部依赖）
interface DouyinGameAdRecord {
  id: string;
  adId: string;
  gameName: string;
  gameCategory: 'action' | 'strategy' | 'puzzle' | 'casual' | 'role-playing' | 'simulation';
  adType: 'banner' | 'interstitial' | 'rewarded' | 'native';
  platform: 'android' | 'ios' | 'web';
  targetAudience: 'children' | 'teen' | 'adult' | 'senior';
  dailyBudget: number;
  ctr: number;
  cpm: number;
  conversions: number;
  status: 'active' | 'paused' | 'completed' | 'draft';
  createdTime: string;
  lastModified: string;
}

interface DouyinGameAdParams {
  current: number;
  pageSize: number;
  adId?: string;
  gameName?: string;
  status?: string;
  advertiserId?: string;
  createdTime?: string[];
}

interface DouyinGameAdListRes {
  list: DouyinGameAdRecord[];
  total: number;
}
import { douyinApiService as oceanEngineService } from './douyin-service';

// 抖音API响应格式
interface DouyinApiResponse<T> {
  code: number;
  message: string;
  data: T;
  request_id: string;
}

// 抖音广告数据原始格式
interface DouyinRawAdData {
  advertiser_id: string;
  campaign_id: string;
  campaign_name: string;
  ad_id: string;
  ad_name: string;
  creative_id: string;
  creative_name: string;
  delivery_range: string;
  audience_gender: string;
  budget: number;
  ctr: number;
  cpm: number;
  conversion: number;
  status: string;
  create_time: string;
  modify_time: string;
}

class DouyinAdService {
  private appKey: string;
  private appSecret: string;

  constructor() {
    this.appKey = import.meta.env.VITE_DOUYIN_APP_KEY || '';
    this.appSecret = import.meta.env.VITE_DOUYIN_APP_SECRET || '';

    // 初始化服务
    this.initialize();
  }

  private async initialize() {
    try {
      // 预加载token
      await oceanEngineService.getEcpmData({ mp_id: 'tt8c62fadf136c334702' }).catch(() => {
        console.warn('预加载OceanEngine服务失败，将在首次请求时重试');
      });
    } catch (error) {
      console.error('初始化OceanEngine服务失败:', error);
    }
  }

  // 转换抖音数据格式为我们的格式
  private transformDouyinData(rawData: DouyinRawAdData[]): DouyinGameAdRecord[] {
    return rawData.map(item => ({
      id: item.ad_id,
      adId: item.ad_id,
      gameName: item.ad_name,
      gameCategory: this.inferGameCategory(item.ad_name),
      adType: this.inferAdType(item.creative_name),
      platform: this.inferPlatform(item.delivery_range),
      targetAudience: this.inferTargetAudience(item.audience_gender),
      dailyBudget: item.budget,
      ctr: item.ctr,
      cpm: item.cpm,
      conversions: item.conversion,
      status: this.mapStatus(item.status),
      createdTime: item.create_time,
      lastModified: item.modify_time,
    }));
  }

  // 推断游戏类型
  private inferGameCategory(gameName: string): DouyinGameAdRecord['gameCategory'] {
    const categories = {
      action: ['射击', '格斗', '动作', '冒险'],
      strategy: ['策略', '战争', '塔防', '三国'],
      puzzle: ['消除', '益智', '解谜', '数独'],
      casual: ['休闲', '放置', '模拟', '经营'],
      'role-playing': ['RPG', '角色', '仙侠', '魔幻'],
      simulation: ['模拟', '养成', '经营', '建造'],
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => gameName.includes(keyword))) {
        return category as DouyinGameAdRecord['gameCategory'];
      }
    }
    return 'casual';
  }

  // 推断广告类型
  private inferAdType(creativeName: string): DouyinGameAdRecord['adType'] {
    if (creativeName.includes('横幅') || creativeName.includes('banner')) return 'banner';
    if (creativeName.includes('插屏') || creativeName.includes('interstitial')) return 'interstitial';
    if (creativeName.includes('激励') || creativeName.includes('reward')) return 'rewarded';
    return 'native';
  }

  // 推断投放平台
  private inferPlatform(deliveryRange: string): DouyinGameAdRecord['platform'] {
    if (deliveryRange.includes('Android')) return 'android';
    if (deliveryRange.includes('iOS')) return 'ios';
    if (deliveryRange.includes('Web')) return 'web';
    return 'android';
  }

  // 推断目标受众
  private inferTargetAudience(gender: string): DouyinGameAdRecord['targetAudience'] {
    // 这里可以根据更多维度判断，目前简化处理
    return 'adult';
  }

  // 状态映射
  private mapStatus(status: string): DouyinGameAdRecord['status'] {
    const statusMap: Record<string, DouyinGameAdRecord['status']> = {
      'ENABLE': 'active',
      'DISABLE': 'paused',
      'DELETE': 'completed',
      'AUDIT': 'draft',
    };
    return statusMap[status] || 'draft';
  }

  // 后备Mock数据（当真实API不可用时）
  private getFallbackMockData(): Promise<{ data: DouyinGameAdListRes }> {
    const mockList: DouyinGameAdRecord[] = [
      {
        id: '1',
        adId: 'DY202001',
        gameName: '王者荣耀',
        gameCategory: 'action',
        adType: 'banner',
        platform: 'android',
        targetAudience: 'adult',
        dailyBudget: 5000,
        ctr: 3.2,
        cpm: 25.5,
        conversions: 120,
        status: 'active',
        createdTime: '2024-01-15',
        lastModified: '2024-01-20',
      },
      // ... 更多模拟数据
    ];

    return Promise.resolve({
      data: {
        list: mockList,
        total: mockList.length,
      },
    });
  }

  // 获取广告列表
  async getAdList(params: DouyinGameAdParams): Promise<DouyinGameAdListRes> {
    try {
      const response = await oceanEngineService.getEcpmData({
        mp_id: params.advertiserId || 'tt8c62fadf136c334702',
        page_no: params.current || 1,
        page_size: params.pageSize || 20,
      });

      const transformedList = this.transformDouyinData(response.list || []);
      
      return {
        list: transformedList,
        total: response.page_info?.total_number || 0,
      };
    } catch (error) {
      console.error('获取抖音广告数据失败:', error);
      
      // 返回后备Mock数据
      console.warn('使用后备Mock数据');
      const fallback = await this.getFallbackMockData();
      return fallback.data;
    }
  }

  // 构建筛选条件
  private buildFiltering(params: DouyinGameAdParams): any {
    const filtering: any = {};

    if (params.adId) {
      filtering.ad_ids = [params.adId];
    }

    if (params.gameName) {
      filtering.ad_name = params.gameName;
    }

    if (params.status) {
      const statusMap = {
        'active': 'ENABLE',
        'paused': 'DISABLE',
        'completed': 'DELETE',
        'draft': 'AUDIT',
      };
      filtering.status = statusMap[params.status];
    }

    if (params.createdTime && params.createdTime.length === 2) {
      filtering.create_time_start = params.createdTime[0];
      filtering.create_time_end = params.createdTime[1];
    }

    return filtering;
  }

  // 获取广告统计数据
  async getAdStatistics(advertiserId: string) {
    try {
      const response = await oceanEngineService.getAppStats(advertiserId || 'tt8c62fadf136c334702');

      return {
        totalAds: response.total_ads || 0,
        totalBudget: response.cost || 0,
        avgCtr: response.ctr || 0,
        totalConversions: response.convert || 0,
      };
    } catch (error) {
      console.error('获取统计数据失败:', error);
      // 返回模拟数据作为后备
      return {
        totalAds: 0,
        totalBudget: 0,
        avgCtr: 0,
        totalConversions: 0,
      };
    }
  }
}

export const douyinAdService = new DouyinAdService();