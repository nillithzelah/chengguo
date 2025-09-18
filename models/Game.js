const { DataTypes } = require('sequelize');

// 定义Game模型的函数
function defineGameModel(sequelize) {
  const Game = sequelize.define('Game', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  appid: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  appSecret: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended'),
    defaultValue: 'active',
    allowNull: false
  },
  validated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  validatedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  advertiser_id: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '广告主ID，用于广告预览二维码'
  },
  promotion_id: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '广告ID，用于广告预览二维码'
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
  tableName: 'games',
  indexes: [
    {
      unique: true,
      fields: ['appid']
    },
    {
      fields: ['status']
    },
    {
      fields: ['validated']
    }
  ]
});

// 类方法：通过App ID查找游戏
Game.findByAppId = async function(appid) {
  return await this.findOne({
    where: { appid, status: 'active' }
  });
};

// 类方法：获取所有活跃游戏
Game.getActiveGames = async function() {
  return await this.findAll({
    where: { status: 'active' },
    order: [['created_at', 'DESC']]
  });
};

// 类方法：验证游戏配置
Game.validateGameConfig = async function(appid, appSecret) {
  // 这里可以添加实际的验证逻辑
  // 例如调用抖音API验证应用配置
  return {
    success: true,
    message: '游戏配置验证成功'
  };
};

// 转换为前端格式的方法
Game.prototype.toFrontendFormat = function() {
  const { appSecret, ...gameData } = this.toJSON();
  return {
    ...gameData,
    // 不返回appSecret给前端
  };
};

  return Game;
}

module.exports = defineGameModel;