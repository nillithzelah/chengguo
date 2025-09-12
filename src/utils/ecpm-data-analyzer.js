// eCPM数据分析工具
// 从eCPM数据明细中提取和分析观看广告的用户信息

export class ECPMDataAnalyzer {

  constructor() {
    this.rawData = [];
    this.analyzedData = null;
  }

  // 设置原始数据
  setData(data) {
    if (!Array.isArray(data)) {
      throw new Error('数据必须是数组格式');
    }
    this.rawData = data;
    this.analyzedData = null; // 重置分析结果
    console.log(`📊 已加载 ${data.length} 条eCPM数据记录`);
  }

  // 分析所有数据
  analyzeAll() {
    if (this.rawData.length === 0) {
      throw new Error('没有数据可分析，请先调用setData设置数据');
    }

    console.log('🔍 开始分析eCPM数据...');

    this.analyzedData = {
      summary: this.generateSummary(),
      userAnalysis: this.analyzeUsers(),
      deviceAnalysis: this.analyzeDevices(),
      locationAnalysis: this.analyzeLocations(),
      timeAnalysis: this.analyzeTimePatterns(),
      revenueAnalysis: this.analyzeRevenue()
    };

    console.log('✅ 数据分析完成');
    return this.analyzedData;
  }

  // 生成数据摘要
  generateSummary() {
    const totalRecords = this.rawData.length;
    const totalRevenue = this.rawData.reduce((sum, item) => sum + (item.revenue || 0), 0);
    const uniqueUsers = new Set(this.rawData.map(item => item.open_id)).size;
    const uniqueIPs = new Set(this.rawData.filter(item => item.ip && item.ip !== '0.0.0.0').map(item => item.ip)).size;
    const uniqueCities = new Set(this.rawData.filter(item => item.city && item.city !== '未知城市').map(item => item.city)).size;

    return {
      totalRecords,
      totalRevenue: totalRevenue.toFixed(2),
      uniqueUsers,
      uniqueIPs,
      uniqueCities,
      avgRevenuePerUser: uniqueUsers > 0 ? (totalRevenue / uniqueUsers).toFixed(2) : '0.00',
      avgRevenuePerRecord: totalRecords > 0 ? (totalRevenue / totalRecords).toFixed(2) : '0.00'
    };
  }

  // 分析用户信息
  analyzeUsers() {
    const userStats = {};
    const userActivity = {};

    this.rawData.forEach(item => {
      const userId = item.open_id;
      const username = item.username || '未知用户';

      // 用户统计
      if (!userStats[userId]) {
        userStats[userId] = {
          userId,
          username,
          totalRevenue: 0,
          recordCount: 0,
          firstSeen: item.event_time,
          lastSeen: item.event_time,
          devices: new Set(),
          ips: new Set(),
          cities: new Set()
        };
      }

      const user = userStats[userId];
      user.totalRevenue += item.revenue || 0;
      user.recordCount += 1;
      user.lastSeen = item.event_time;

      // 收集用户设备信息
      if (item.phone_brand && item.phone_brand !== '未知品牌') {
        user.devices.add(`${item.phone_brand} ${item.phone_model || ''}`.trim());
      }
      if (item.ip && item.ip !== '0.0.0.0') {
        user.ips.add(item.ip);
      }
      if (item.city && item.city !== '未知城市') {
        user.cities.add(item.city);
      }

      // 用户活跃度分析
      const date = item.event_time ? item.event_time.split(' ')[0] : 'unknown';
      if (!userActivity[date]) {
        userActivity[date] = {};
      }
      if (!userActivity[date][userId]) {
        userActivity[date][userId] = 0;
      }
      userActivity[date][userId] += 1;
    });

    // 转换Set为数组
    Object.values(userStats).forEach(user => {
      user.devices = Array.from(user.devices);
      user.ips = Array.from(user.ips);
      user.cities = Array.from(user.cities);
    });

    // 计算用户活跃度统计
    const dailyActiveUsers = Object.keys(userActivity).map(date => ({
      date,
      activeUsers: Object.keys(userActivity[date]).length,
      totalActivities: Object.values(userActivity[date]).reduce((sum, count) => sum + count, 0)
    }));

    return {
      userStats: Object.values(userStats),
      dailyActiveUsers,
      topUsers: Object.values(userStats)
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 10)
    };
  }

  // 分析设备信息
  analyzeDevices() {
    const brandStats = {};
    const modelStats = {};
    const deviceCombinations = {};

    this.rawData.forEach(item => {
      const brand = item.phone_brand || '未知品牌';
      const model = item.phone_model || '未知型号';
      const combination = `${brand} ${model}`.trim();

      // 品牌统计
      if (!brandStats[brand]) {
        brandStats[brand] = { brand, count: 0, revenue: 0 };
      }
      brandStats[brand].count += 1;
      brandStats[brand].revenue += item.revenue || 0;

      // 型号统计
      if (!modelStats[model]) {
        modelStats[model] = { model, count: 0, revenue: 0 };
      }
      modelStats[model].count += 1;
      modelStats[model].revenue += item.revenue || 0;

      // 设备组合统计
      if (!deviceCombinations[combination]) {
        deviceCombinations[combination] = { combination, count: 0, revenue: 0 };
      }
      deviceCombinations[combination].count += 1;
      deviceCombinations[combination].revenue += item.revenue || 0;
    });

    return {
      brandStats: Object.values(brandStats).sort((a, b) => b.count - a.count),
      modelStats: Object.values(modelStats).sort((a, b) => b.count - a.count),
      deviceCombinations: Object.values(deviceCombinations).sort((a, b) => b.count - a.count),
      topBrands: Object.values(brandStats).sort((a, b) => b.revenue - a.revenue).slice(0, 5),
      topModels: Object.values(modelStats).sort((a, b) => b.revenue - a.revenue).slice(0, 5)
    };
  }

  // 分析地理位置信息
  analyzeLocations() {
    const cityStats = {};
    const ipStats = {};

    this.rawData.forEach(item => {
      // 城市统计
      const city = item.city || '未知城市';
      if (!cityStats[city]) {
        cityStats[city] = { city, count: 0, revenue: 0, users: new Set() };
      }
      cityStats[city].count += 1;
      cityStats[city].revenue += item.revenue || 0;
      cityStats[city].users.add(item.open_id);

      // IP统计
      const ip = item.ip || '未知IP';
      if (ip !== '0.0.0.0' && ip !== '未知IP') {
        if (!ipStats[ip]) {
          ipStats[ip] = { ip, count: 0, revenue: 0, city: city, users: new Set() };
        }
        ipStats[ip].count += 1;
        ipStats[ip].revenue += item.revenue || 0;
        ipStats[ip].users.add(item.open_id);
      }
    });

    // 转换Set为数组长度
    Object.values(cityStats).forEach(city => {
      city.uniqueUsers = city.users.size;
      delete city.users;
    });

    Object.values(ipStats).forEach(ip => {
      ip.uniqueUsers = ip.users.size;
      delete ip.users;
    });

    return {
      cityStats: Object.values(cityStats).sort((a, b) => b.count - a.count),
      ipStats: Object.values(ipStats).sort((a, b) => b.count - a.count),
      topCities: Object.values(cityStats).sort((a, b) => b.revenue - a.revenue).slice(0, 10),
      topIPs: Object.values(ipStats).sort((a, b) => b.revenue - a.revenue).slice(0, 10)
    };
  }

  // 分析时间模式
  analyzeTimePatterns() {
    const hourlyStats = {};
    const dailyStats = {};
    const weeklyStats = {};

    this.rawData.forEach(item => {
      if (!item.event_time) return;

      const date = new Date(item.event_time);
      const hour = date.getHours();
      const day = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();

      // 小时统计
      if (!hourlyStats[hour]) {
        hourlyStats[hour] = { hour, count: 0, revenue: 0 };
      }
      hourlyStats[hour].count += 1;
      hourlyStats[hour].revenue += item.revenue || 0;

      // 每日统计
      if (!dailyStats[day]) {
        dailyStats[day] = { date: day, count: 0, revenue: 0, users: new Set() };
      }
      dailyStats[day].count += 1;
      dailyStats[day].revenue += item.revenue || 0;
      dailyStats[day].users.add(item.open_id);

      // 每周统计
      if (!weeklyStats[dayOfWeek]) {
        weeklyStats[dayOfWeek] = {
          dayOfWeek,
          dayName: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][dayOfWeek],
          count: 0,
          revenue: 0
        };
      }
      weeklyStats[dayOfWeek].count += 1;
      weeklyStats[dayOfWeek].revenue += item.revenue || 0;
    });

    // 转换用户Set为数量
    Object.values(dailyStats).forEach(day => {
      day.uniqueUsers = day.users.size;
      delete day.users;
    });

    return {
      hourlyStats: Object.values(hourlyStats).sort((a, b) => a.hour - b.hour),
      dailyStats: Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date)),
      weeklyStats: Object.values(weeklyStats).sort((a, b) => a.dayOfWeek - b.dayOfWeek),
      peakHours: Object.values(hourlyStats).sort((a, b) => b.count - a.count).slice(0, 3),
      peakDays: Object.values(weeklyStats).sort((a, b) => b.count - a.count).slice(0, 3)
    };
  }

  // 分析收益数据
  analyzeRevenue() {
    const revenueStats = {
      total: 0,
      average: 0,
      median: 0,
      max: 0,
      min: Infinity,
      distribution: {}
    };

    const revenues = this.rawData.map(item => item.revenue || 0).filter(r => r > 0);

    if (revenues.length > 0) {
      revenueStats.total = revenues.reduce((sum, r) => sum + r, 0);
      revenueStats.average = revenueStats.total / revenues.length;
      revenueStats.max = Math.max(...revenues);
      revenueStats.min = Math.min(...revenues);

      // 计算中位数
      revenues.sort((a, b) => a - b);
      const mid = Math.floor(revenues.length / 2);
      revenueStats.median = revenues.length % 2 === 0
        ? (revenues[mid - 1] + revenues[mid]) / 2
        : revenues[mid];

      // 收益分布
      const ranges = [
        { min: 0, max: 1, label: '0-1元' },
        { min: 1, max: 5, label: '1-5元' },
        { min: 5, max: 10, label: '5-10元' },
        { min: 10, max: 50, label: '10-50元' },
        { min: 50, max: Infinity, label: '50元以上' }
      ];

      ranges.forEach(range => {
        revenueStats.distribution[range.label] = revenues.filter(r =>
          r >= range.min && r < range.max
        ).length;
      });
    }

    return revenueStats;
  }

  // 获取分析结果
  getAnalysisResult() {
    if (!this.analyzedData) {
      throw new Error('请先调用analyzeAll()方法进行数据分析');
    }
    return this.analyzedData;
  }

  // 导出分析报告
  exportReport() {
    if (!this.analyzedData) {
      throw new Error('请先调用analyzeAll()方法进行数据分析');
    }

    const report = {
      generatedAt: new Date().toISOString(),
      dataSummary: this.analyzedData.summary,
      keyFindings: this.generateKeyFindings(),
      recommendations: this.generateRecommendations(),
      rawAnalysis: this.analyzedData
    };

    return report;
  }

  // 生成关键发现
  generateKeyFindings() {
    if (!this.analyzedData) return [];

    const findings = [];
    const { summary, userAnalysis, deviceAnalysis, locationAnalysis, timeAnalysis } = this.analyzedData;

    // 用户洞察
    if (summary.uniqueUsers > 0) {
      findings.push(`📊 共识别出 ${summary.uniqueUsers} 个独立用户`);
      findings.push(`💰 平均每个用户贡献收益 ¥${summary.avgRevenuePerUser}`);
    }

    // 设备洞察
    if (deviceAnalysis.topBrands.length > 0) {
      const topBrand = deviceAnalysis.topBrands[0];
      findings.push(`📱 最受欢迎的手机品牌：${topBrand.brand} (${topBrand.count} 次使用)`);
    }

    // 地理洞察
    if (locationAnalysis.topCities.length > 0) {
      const topCity = locationAnalysis.topCities[0];
      findings.push(`📍 用户最集中的城市：${topCity.city} (${topCity.count} 次访问)`);
    }

    // 时间洞察
    if (timeAnalysis.peakHours.length > 0) {
      const peakHour = timeAnalysis.peakHours[0];
      findings.push(`⏰ 用户最活跃的时间：${peakHour.hour}点 (${peakHour.count} 次活动)`);
    }

    return findings;
  }

  // 生成建议
  generateRecommendations() {
    if (!this.analyzedData) return [];

    const recommendations = [];
    const { deviceAnalysis, locationAnalysis, timeAnalysis } = this.analyzedData;

    // 设备优化建议
    if (deviceAnalysis.topBrands.length > 0) {
      recommendations.push(`🎯 针对${deviceAnalysis.topBrands[0].brand}用户优化广告展示效果`);
    }

    // 地理 targeting 建议
    if (locationAnalysis.topCities.length > 0) {
      recommendations.push(`📍 在${locationAnalysis.topCities[0].city}加大广告投放力度`);
    }

    // 时间投放建议
    if (timeAnalysis.peakHours.length > 0) {
      recommendations.push(`⏰ 在${timeAnalysis.peakHours[0].hour}点增加广告曝光`);
    }

    return recommendations;
  }

  // 清除数据
  clearData() {
    this.rawData = [];
    this.analyzedData = null;
  }
}

// 导出单例实例
export const ecpmDataAnalyzer = new ECPMDataAnalyzer();