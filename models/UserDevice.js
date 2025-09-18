const { DataTypes } = require('sequelize');

// 定义UserDevice模型的函数
function defineUserDeviceModel(sequelize) {
  const UserDevice = sequelize.define('UserDevice', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: '用户ID'
    },
    device_id: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '设备唯一标识'
    },
    device_brand: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '设备品牌'
    },
    device_model: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '设备型号'
    },
    friendly_model: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '友好型号名称'
    },
    platform: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '平台'
    },
    browser_name: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '浏览器名称'
    },
    browser_version: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '浏览器版本'
    },
    os_name: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '操作系统名称'
    },
    os_version: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '操作系统版本'
    },
    device_type: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '设备类型'
    },
    screen_width: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '屏幕宽度'
    },
    screen_height: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '屏幕高度'
    },
    screen_pixel_ratio: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      comment: '屏幕像素比'
    },
    viewport_width: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '视窗宽度'
    },
    viewport_height: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '视窗高度'
    },
    language: {
      type: DataTypes.STRING(10),
      allowNull: true,
      comment: '语言'
    },
    timezone: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '时区'
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'User-Agent字符串'
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: 'IP地址'
    },
    is_current_device: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: '是否为当前使用的设备'
    },
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '最后登录时间'
    },
    login_count: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false,
      comment: '登录次数'
    },
    environment: {
      type: DataTypes.STRING(20),
      defaultValue: 'web_browser',
      allowNull: false,
      comment: '运行环境'
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
    tableName: 'user_devices',
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'device_id'],
        comment: '用户设备唯一索引'
      },
      {
        fields: ['user_id'],
        comment: '用户ID索引'
      },
      {
        fields: ['device_id'],
        comment: '设备ID索引'
      },
      {
        fields: ['device_brand'],
        comment: '设备品牌索引'
      },
      {
        fields: ['device_type'],
        comment: '设备类型索引'
      },
      {
        fields: ['last_login_at'],
        comment: '最后登录时间索引'
      },
      {
        fields: ['is_current_device'],
        comment: '当前设备索引'
      }
    ]
  });

  // 类方法：查找或创建用户设备
  UserDevice.findOrCreateDevice = async function(userId, deviceInfo) {
    const { deviceId, ...deviceData } = deviceInfo;

    // 只保留模型中定义的字段
    const allowedFields = [
      'device_brand', 'device_model', 'friendly_model', 'platform',
      'browser_name', 'browser_version', 'os_name', 'os_version',
      'device_type', 'screen_width', 'screen_height', 'screen_pixel_ratio',
      'viewport_width', 'viewport_height', 'language', 'timezone',
      'user_agent', 'ip_address', 'environment'
    ];

    const filteredDeviceData = {};
    for (const field of allowedFields) {
      if (deviceData[field] !== undefined) {
        filteredDeviceData[field] = deviceData[field];
      }
    }

    const [device, created] = await this.findOrCreate({
      where: {
        user_id: userId,
        device_id: deviceId
      },
      defaults: {
        user_id: userId,
        device_id: deviceId,
        ...filteredDeviceData,
        last_login_at: new Date(),
        login_count: 1
      }
    });

    if (!created) {
      // 更新现有设备信息和登录统计
      await device.update({
        ...filteredDeviceData,
        last_login_at: new Date(),
        login_count: device.login_count + 1,
        updated_at: new Date()
      });
    }

    return device;
  };

  // 类方法：设置当前设备
  UserDevice.setCurrentDevice = async function(userId, deviceId) {
    // 先将该用户的所有设备设为非当前设备
    await this.update(
      { is_current_device: false },
      { where: { user_id: userId } }
    );

    // 将指定设备设为当前设备
    await this.update(
      { is_current_device: true },
      { where: { user_id: userId, device_id: deviceId } }
    );
  };

  // 类方法：获取用户的所有设备
  UserDevice.getUserDevices = async function(userId) {
    return await this.findAll({
      where: { user_id: userId },
      order: [['last_login_at', 'DESC']]
    });
  };

  // 类方法：获取用户的当前设备
  UserDevice.getCurrentDevice = async function(userId) {
    return await this.findOne({
      where: {
        user_id: userId,
        is_current_device: true
      }
    });
  };

  // 类方法：清理旧设备记录（保留最近的N个设备）
  UserDevice.cleanupOldDevices = async function(userId, keepCount = 10) {
    const devices = await this.findAll({
      where: { user_id: userId },
      order: [['last_login_at', 'DESC']],
      offset: keepCount
    });

    if (devices.length > 0) {
      const deviceIds = devices.map(d => d.id);
      await this.destroy({
        where: { id: deviceIds }
      });
      console.log(`清理了用户 ${userId} 的 ${devices.length} 个旧设备记录`);
    }
  };

  return UserDevice;
}

module.exports = defineUserDeviceModel;