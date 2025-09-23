const { DataTypes } = require('sequelize');

// 定义ConversionEvent模型的函数
function defineConversionEventModel(sequelize) {
  const ConversionEvent = sequelize.define('ConversionEvent', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    // 回调参数
    callback: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '点击事件回调参数'
    },
    // 事件类型
    event_type: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '事件类型代码'
    },
    event_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '事件类型名称'
    },
    // 设备信息
    idfa: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'iOS设备IDFA'
    },
    imei: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Android设备IMEI的MD5摘要'
    },
    oaid: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Android Q版本的OAID'
    },
    oaid_md5: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Android Q版本的OAID的MD5摘要'
    },
    muid: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '设备唯一标识（Android: IMEI MD5, iOS: IDFA）'
    },
    os: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '操作系统类型 (0: Android, 1: iOS)'
    },
    caid1: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '中国广告协会互联网广告标识（最新版本）'
    },
    caid2: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '中国广告协会互联网广告标识（老版本）'
    },
    // 可选参数
    conv_time: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: '转化发生时间（UTC时间戳）'
    },
    match_type: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '归因方式 (0:点击 1:展示 2:有效播放归因)'
    },
    outer_event_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '外部事件ID，用于去重'
    },
    outer_event_identity: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '外部事件身份标识'
    },
    source: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '数据来源'
    },
    props: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '自定义属性（JSON字符串）'
    },
    // 处理状态
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'success', 'failed'),
      defaultValue: 'pending',
      allowNull: false,
      comment: '处理状态'
    },
    processing_time: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '处理耗时（毫秒）'
    },
    // 回调响应
    callback_response: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '字节跳动回调API响应（JSON字符串）'
    },
    callback_status: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '字节跳动回调API响应状态码'
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '错误信息'
    },
    // 请求信息
    request_method: {
      type: DataTypes.ENUM('GET', 'POST'),
      allowNull: false,
      comment: '请求方法'
    },
    request_ip: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: '请求IP地址'
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '用户代理字符串'
    },
    // 时间戳
    received_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '接收时间'
    },
    processed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '处理完成时间'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'conversion_events',
    indexes: [
      {
        fields: ['callback'],
        comment: '回调参数索引'
      },
      {
        fields: ['event_type'],
        comment: '事件类型索引'
      },
      {
        fields: ['status'],
        comment: '处理状态索引'
      },
      {
        fields: ['received_at'],
        comment: '接收时间索引'
      },
      {
        fields: ['outer_event_id'],
        comment: '外部事件ID索引，用于去重'
      },
      {
        fields: ['imei'],
        comment: 'IMEI索引'
      },
      {
        fields: ['idfa'],
        comment: 'IDFA索引'
      },
      {
        fields: ['oaid'],
        comment: 'OAID索引'
      },
      {
        fields: ['muid'],
        comment: 'MUID索引'
      }
    ],
    comment: '转化事件记录表'
  });

  // 类方法：创建转化事件记录
  ConversionEvent.createEvent = async function(eventData) {
    return await this.create(eventData);
  };

  // 类方法：通过回调参数查找事件
  ConversionEvent.findByCallback = async function(callback) {
    return await this.findOne({
      where: { callback }
    });
  };

  // 类方法：通过外部事件ID查找事件（去重）
  ConversionEvent.findByOuterEventId = async function(outerEventId) {
    return await this.findOne({
      where: { outer_event_id: outerEventId }
    });
  };

  // 类方法：更新事件状态
  ConversionEvent.updateStatus = async function(id, status, additionalData = {}) {
    return await this.update(
      {
        status,
        processed_at: new Date(),
        ...additionalData
      },
      { where: { id } }
    );
  };

  // 类方法：获取事件统计
  ConversionEvent.getStats = async function(startDate, endDate) {
    const whereCondition = {};
    if (startDate && endDate) {
      whereCondition.received_at = {
        [sequelize.Sequelize.Op.between]: [startDate, endDate]
      };
    }

    const stats = await this.findAll({
      where: whereCondition,
      attributes: [
        'event_type',
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['event_type', 'status'],
      raw: true
    });

    return stats;
  };

  // 转换为前端格式的方法
  ConversionEvent.prototype.toFrontendFormat = function() {
    const data = this.toJSON();

    // 解析props JSON字符串
    if (data.props) {
      try {
        data.props = JSON.parse(data.props);
      } catch (e) {
        data.props = null;
      }
    }

    // 解析回调响应 JSON字符串
    if (data.callback_response) {
      try {
        data.callback_response = JSON.parse(data.callback_response);
      } catch (e) {
        data.callback_response = null;
      }
    }

    return data;
  };

  return ConversionEvent;
}

module.exports = defineConversionEventModel;