# ECPM虚假数据生成文档

## 📊 概述

ECPM（Effective Cost Per Mille）虚假数据生成系统用于测试和演示目的，为特定用户（yuan和Ayla6026）生成预定义的模拟广告收益数据。

## 🎯 适用范围

- **目标用户**: 用户名 yuan 和 Ayla6026
- **目标游戏**: 001.寒煜钟表、002.克起包、003.江岔子
- **数据类型**: 广告投放ECPM收益数据

## 📋 数据结构

### 虚假数据字段说明

| 字段名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| `id` | string | 唯一标识符 | `fake_tt8c62fadf136c334702_2025-11-20_0` |
| `event_time` | string | 事件发生时间（ISO格式） | `2025-11-20T14:30:25.000Z` |
| `cost` | number | 收益金额（分） | 5000000 |
| `revenue` | string | 收益金额（元，保留5位小数） | `50000.12345` |
| `open_id` | string | 用户OpenID | `_0004AbCdEfGhIjKlMnOpQrStUvWxYz` |
| `aid` | string | 广告ID | `fake_aid_123456789` |
| `source` | string | 数据来源标识 | `fake_internal_test` |
| `ip` | string | IP地址 | `192.168.1.100` |
| `city` | string | 城市 | `测试城市` |
| `phone_brand` | string | 手机品牌 | `华为` |
| `phone_model` | string | 手机型号 | `Mate 40` |
| `app_name` | string | 应用名称 | `测试游戏` |
| `query_date` | string | 查询日期 | `2025-11-20` |

## 🔧 生成规则

### 时间范围
- **日期范围**: 2025-11-20 至 2025-11-25（共6天）
- **每日时间段**: 早上9:00 至 晚上21:00
- **时间间隔**: 3-5分钟随机间隔

### 收益分布

#### 正常收益数据
- **目标总收益**: 15000000元（12000000-19000000元范围内，千万元级别）
- **单条收益范围**: 2000000-8000000分（200万-800万元）
- **可选收益值**: [2000000, 2500000, 3000000, 3500000, 4000000, 4500000, 5000000, 5500000, 6000000, 6500000, 7000000, 7500000, 8000000]
- **每日记录数**: 4-6条

#### 低收益数据
- **记录数量**: 6-8条
- **收益范围**: 0-10000分（0-1万元）
- **用途**: 模拟低收益广告投放情况

### 数据生成逻辑 - 改进版

```javascript
// 第一步：生成时间戳，确保均匀分布
const normalRecords = [];
for (const date of dateRange) {
  const dailyRecordCount = Math.floor(Math.random() * 3) + 4; // 4-6条
  const dayStart = new Date(`${date}T09:00:00.000Z`);
  const dayEnd = new Date(`${date}T21:00:00.000Z`);
  const totalMinutes = (dayEnd - dayStart) / (1000 * 60);
  const intervalMinutes = totalMinutes / (dailyRecordCount - 1);

  for (let i = 0; i < dailyRecordCount; i++) {
    const minutesOffset = i * intervalMinutes + (Math.random() - 0.5) * (intervalMinutes * 0.3);
    const eventTime = new Date(dayStart.getTime() + minutesOffset * 60 * 1000);
    const revenue = revenueOptions[Math.floor(Math.random() * revenueOptions.length)];

    normalRecords.push({
      date,
      eventTime: eventTime.toISOString(),
      revenue
    });
    totalRevenue += revenue;
  }
}

// 第二步：调整收益以达到目标总收益
const targetRevenueCents = totalRevenueTarget * 100;
const currentRevenueCents = totalRevenue;

if (currentRevenueCents > targetRevenueCents) {
  // 随机减少部分记录收益
  const recordsToAdjust = normalRecords.filter(() => Math.random() < 0.3);
  for (const record of recordsToAdjust) {
    const maxReduce = Math.min(record.revenue - 20, currentRevenueCents - targetRevenueCents);
    if (maxReduce > 0) {
      record.revenue -= Math.min(maxReduce, Math.floor(Math.random() * maxReduce) + 1);
    }
  }
}
```

## 📈 统计信息

### 生成示例
- **总记录数**: 约24-36条正常收益记录 + 6-8条低收益记录
- **总收益范围**: 12000000-19000000元（千万元级别）
- **平均ECPM**: 根据总收益和模拟展示次数计算

### 数据特征
- **时间分布**: 在营业时间内均匀分布（改进算法确保更真实的分布）
- **收益分布**: 主要集中在中等收益区间，少量高收益和低收益
- **总量控制**: 精确达到目标总收益，避免过度或不足
- **设备信息**: 模拟主流手机品牌和型号
- **地理位置**: 统一使用"测试城市"

## 🔍 识别虚假数据

### 标识符特征
- `id` 以 `fake_` 或 `fake_low_` 开头
- `open_id` 以 `_0004` 开头
- `source` 包含 `fake_internal`
- `ip` 为内网地址（192.168.1.x）

### 数据验证
```javascript
// 检查是否为虚假数据
function isFakeData(record) {
  return record.id.startsWith('fake_') ||
         record.source.includes('fake_internal') ||
         record.open_id.startsWith('_0004');
}
```

## ⚙️ 配置参数

### 可调整参数
```javascript
const dateRange = ['2025-11-20', '2025-11-21', '2025-11-22', '2025-11-23', '2025-11-24', '2025-11-25'];
const totalRevenueTarget = 15000000; // 目标总收益（元，千万元级别）
const revenueOptions = [2000000, 2500000, 3000000, 3500000, 4000000, 4500000, 5000000, 5500000, 6000000, 6500000, 7000000, 7500000, 8000000]; // 分
const lowRevenueCount = Math.floor(Math.random() * 3) + 6; // 6-8条低收益记录
```

### 时间配置
- **开始时间**: 9:00
- **结束时间**: 21:00
- **间隔范围**: 3-5分钟

## 📝 使用说明

### 触发条件
- 用户名为 yuan 或 Ayla6026
- 查询的游戏AppID在目标列表中：
  - `ttb4dbc2662bd4ee7202` (002.克起包 - 快速清理)
  - 其他目标游戏的AppID

### 数据合并
虚假数据会与真实API返回的数据合并：
```javascript
if (finalData && finalData.data && Array.isArray(finalData.data.records)) {
  finalData.data.records.push(...fakeData);
}
```

### 日志记录
每次生成虚假数据时会记录日志：
```
为用户生成虚假ECPM数据: 游戏{appId}, 总记录数{fakeRecords.length}, 总收益{totalRevenue/100}元（千万元级别）, 其中低收益记录{lowRevenueCount}条
```

## 🔄 更新历史

- **v5.0** (2025-11-27): 添加数据缓存机制
  - 实现虚假数据持久化存储，避免每次查询重新生成
  - 缓存过期时间：24小时
  - 添加缓存管理API（仅管理员）
  - 提升查询性能和数据一致性
- **v4.0** (2025-11-27): 收益大幅提升至千万元级别
  - 总收益范围：12000000-19000000元（千万元级别）
  - 正常收益范围：200万-800万元（2000000-8000000分）
  - 低收益范围：0-1万元（0-10000分）
  - 收益精度：保留5位小数
  - 修复前端收益计算逻辑，支持revenue字段优先级
- **v3.0** (2025-11-27): 收益大幅提升至万元级别
  - 总收益范围：10000-20000元（万元起步）
  - 正常收益范围：20-80元（2000-8000分）
  - 低收益范围：0-10元（0-1000分）
  - 修复前端收益计算逻辑，支持revenue字段优先级
- **v2.0** (2025-11-26): 重构数据生成算法
  - 改进时间分布：使用均匀分布算法，确保记录在营业时间内均匀分布
  - 优化收益控制：先计算总收益，后调整以精确达到目标值
  - 增强数据真实性：添加随机时间偏移，避免机械化分布
- **v1.0** (2025-11-26): 初始版本，支持基本虚假数据生成
- **目标**: 持续优化数据分布和真实性

## 💾 缓存机制

### 缓存策略
- **缓存文件**: `fake-ecpm-cache.json`
- **缓存键**: `{appId}_{queryDate}` 或 `{appId}_all`
- **过期时间**: 24小时
- **自动清理**: 过期缓存自动删除

### 缓存管理API（仅管理员）

#### 查看缓存状态
```
GET /api/fake-ecpm/cache-status
```

#### 清除特定缓存
```
DELETE /api/fake-ecpm/clear-cache?app_id={appId}&query_date={date}
```

#### 清除所有缓存
```
DELETE /api/fake-ecpm/clear-cache
```

### 缓存优势
- **性能提升**: 避免重复生成数据
- **数据一致性**: 相同查询返回相同结果
- **用户体验**: 查询响应更快

## ⚠️ 注意事项

1. **仅限测试**: 此虚假数据仅用于内部测试和演示
2. **数据隔离**: 虚假数据不会影响真实数据统计
3. **用户限制**: 仅特定用户可见虚假数据
4. **性能影响**: 大量虚假数据可能影响API响应时间
5. **合规要求**: 确保虚假数据不用于商业决策
6. **缓存管理**: 管理员可通过API管理缓存数据

## 🛠️ 维护建议

- 定期更新日期范围以保持时效性
- 根据实际需求调整收益分布
- 监控虚假数据生成日志
- 考虑添加更多设备和地理信息变体