const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite',
  logging: console.log
});

async function createConversionTable() {
  try {
    console.log('🚀 开始创建转化事件表...');

    // 定义转化事件模型（只用于创建表）
    const ConversionEvent = sequelize.define('ConversionEvent', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      // 回调参数
      callback: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: '点击事件回调参数'
      },
      // 事件类型
      event_type: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '事件类型代码'
      },
      event_name: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: '事件类型名称'
      },
      // 设备信息
      idfa: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'iOS设备IDFA'
      },
      imei: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Android设备IMEI的MD5摘要'
      },
      oaid: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Android Q版本的OAID'
      },
      oaid_md5: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Android Q版本的OAID的MD5摘要'
      },
      muid: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: '设备唯一标识（Android: IMEI MD5, iOS: IDFA）'
      },
      os: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: '操作系统类型 (0: Android, 1: iOS)'
      },
      caid1: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: '中国广告协会互联网广告标识（最新版本）'
      },
      caid2: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: '中国广告协会互联网广告标识（老版本）'
      },
      android_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Android设备ID'
      },
      idfv: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'iOS设备IDFV'
      },
      // 可选参数
      conv_time: {
        type: Sequelize.BIGINT,
        allowNull: true,
        comment: '转化发生时间（UTC时间戳）'
      },
      match_type: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: '归因方式 (0:点击 1:展示 2:有效播放归因)'
      },
      outer_event_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: '外部事件ID，用于去重'
      },
      outer_event_identity: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '外部事件身份标识'
      },
      source: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: '数据来源'
      },
      props: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '自定义属性（JSON字符串）'
      },
      // 处理状态
      status: {
        type: Sequelize.ENUM('pending', 'processing', 'success', 'failed'),
        defaultValue: 'pending',
        allowNull: false,
        comment: '处理状态'
      },
      processing_time: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: '处理耗时（毫秒）'
      },
      // 回调响应
      callback_response: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '字节跳动回调API响应（JSON字符串）'
      },
      callback_status: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: '字节跳动回调API响应状态码'
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '错误信息'
      },
      // 请求信息
      request_method: {
        type: Sequelize.ENUM('GET', 'POST'),
        allowNull: false,
        comment: '请求方法'
      },
      request_ip: {
        type: Sequelize.STRING(45),
        allowNull: true,
        comment: '请求IP地址'
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '用户代理字符串'
      },
      // 时间戳
      received_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        comment: '接收时间'
      },
      processed_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: '处理完成时间'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
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
        },
        {
          fields: ['android_id'],
          comment: 'Android ID索引'
        },
        {
          fields: ['idfv'],
          comment: 'IDFV索引'
        }
      ],
      comment: '转化事件记录表'
    });

    // 同步表结构（只创建不存在的表）
    await ConversionEvent.sync();

    console.log('✅ 转化事件表创建成功！');

    // 验证表是否创建成功
    const [tables] = await sequelize.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='conversion_events'"
    );

    if (tables.length > 0) {
      console.log('✅ 转化事件表验证成功！');
    } else {
      console.log('❌ 转化事件表创建失败！');
    }

  } catch (error) {
    console.error('❌ 创建转化事件表失败:', error);
  } finally {
    await sequelize.close();
  }
}

createConversionTable();