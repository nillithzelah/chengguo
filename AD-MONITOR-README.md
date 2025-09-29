# 巨量引擎广告监测系统文档

## 概述

本项目实现了标准的巨量引擎（字节跳动）广告监测系统，用于收集和跟踪广告投放效果数据。

## 核心组件

### 1. 广告监测端点

**路径**: `/openid/report`
**方法**: GET
**功能**: 接收巨量引擎广告平台的监测请求

**请求参数**:
- `promotionid`: 推广计划ID
- `mid1`: 监测参数1
- `imei`: 设备IMEI
- `oaid`: 设备OAID
- `androidid`: Android设备ID
- `idfa`: iOS设备ID
- `muid`: 设备MUID
- `os`: 操作系统 (0=Android, 1=iOS)
- `TIMESTAMP`: 时间戳
- `callback`: 回调参数

### 2. 日志系统

#### Nginx访问日志
**文件**: `/var/log/nginx/ad-monitor.access.log`
**用途**: 记录所有广告监测请求的HTTP访问日志

**日志格式** (标准Nginx格式):
```
IP地址 - - [时间] "GET /openid/report?参数 HTTP/1.1" 状态码 响应大小 "Referer" "User-Agent"
```

**日志轮转**:
- 每天轮转一次
- 保留52个历史文件 (最多52天)
- 历史文件自动压缩 (.gz)

**轮转逻辑说明**:
```
当前文件: access.log (当天日志)
第1天轮转: access.log → access.log.1 (昨天日志)
第2天轮转: access.log.1 → access.log.2, access.log → access.log.1
...
第52天轮转: access.log.51 → access.log.52, access.log → access.log.1
超过52个: 最旧的文件 (access.log.52) 被自动删除
```

**保留时间计算**:
- 每个历史文件代表一天的日志
- 52个历史文件 = 最多保留52天的日志历史
- 第53天时，最旧的日志文件会被删除

**文件命名示例**:
```
access.log          (当前日志)
access.log.1        (昨天)
access.log.2.gz     (前天，已压缩)
access.log.3.gz     (大前天，已压缩)
...
access.log.52.gz    (52天前，最后一个保留的文件)
```

#### 应用日志
**文件**: `/root/nohup.out`
**用途**: 记录应用级别的处理日志

**包含信息**:
- 收到巨量广告监测请求
- 请求头信息解析
- 监测数据转发结果
- 错误信息和调试信息

### 3. 数据转发

**目标API**: `https://analytics.oceanengine.com/api/v2/conversion`
**协议**: HTTP POST
**数据格式**: JSON

**转发数据结构**:
```json
{
  "event_type": "active",
  "context": {
    "ad": {
      "callback": "回调参数"
    },
    "device": {
      "platform": "ios|android",
      "idfa": "iOS设备ID (可选)",
      "imei": "设备IMEI (可选)",
      "oaid": "设备OAID (可选)",
      "android_id": "Android设备ID (可选)"
    }
  },
  "timestamp": 1640995200000
}
```

## 部署配置

### Nginx配置
```nginx
location /openid/report {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # 广告监测请求通常是GET请求，设置较短超时
    proxy_connect_timeout 30s;
    proxy_send_timeout 30s;
    proxy_read_timeout 30s;

    # 记录广告监测请求日志
    access_log /var/log/nginx/ad-monitor.access.log;
}
```

### 服务器要求

**最低配置**:
- CPU: 1核心
- 内存: 2GB (推荐4GB+)
- 磁盘: 20GB
- 网络: 稳定带宽

**推荐配置**:
- CPU: 2核心
- 内存: 4GB
- 磁盘: 50GB SSD
- Swap: 2GB

## 监控和维护

### 日志查看

**实时监控**:
```bash
# 监控Nginx广告日志
tail -f /var/log/nginx/ad-monitor.access.log

# 监控应用日志
tail -f /root/nohup.out | grep -E '巨量广告监测|监测数据'
```

**历史日志分析**:
```bash
# 查看昨天的日志
zcat /var/log/nginx/ad-monitor.access.log.1.gz | head -20

# 统计请求量
grep "GET /openid/report" /var/log/nginx/ad-monitor.access.log | wc -l

# 分析响应状态
grep "GET /openid/report" /var/log/nginx/ad-monitor.access.log | awk '{print $9}' | sort | uniq -c
```

### 性能监控

**关键指标**:
- 请求响应时间 (< 30秒)
- 成功转发率 (> 95%)
- 服务器资源使用率
- 日志文件大小增长

### 故障排查

**常见问题**:
1. **内存不足**: 增加Swap空间或升级服务器
2. **日志文件过大**: 配置logrotate压缩
3. **转发失败**: 检查网络连接和API密钥
4. **高CPU使用**: 优化Node.js应用或减少并发

## 安全考虑

- 请求参数验证
- IP白名单 (可选)
- HTTPS加密传输
- 日志敏感信息脱敏
- 定期日志清理

## 扩展功能

### 未来计划
- [ ] 数据统计面板
- [ ] 实时告警系统
- [ ] 多平台广告支持
- [ ] A/B测试框架
- [ ] 转化率分析

---

**维护人员**: 请定期检查日志文件大小和服务器资源使用情况，确保系统稳定运行。