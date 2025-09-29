const { DataTypes } = require('sequelize');

// 定义UserOpenId模型的函数
function defineUserOpenIdModel(sequelize) {
  const UserOpenId = sequelize.define('UserOpenId', {
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
    open_id: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '抖音OpenID'
    },
    bound_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '绑定时间'
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
    tableName: 'user_openids',
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'open_id'],
        name: 'unique_user_openid'
      },
      {
        fields: ['open_id'],
        name: 'idx_open_id'
      },
      {
        fields: ['user_id'],
        name: 'idx_user_id'
      }
    ]
  });

  // 类方法：通过open_id查找用户
  UserOpenId.findByOpenId = async function(openId) {
    return await this.findOne({
      where: { open_id: openId },
      include: [{
        model: sequelize.models.User,
        as: 'user',
        attributes: ['id', 'username', 'name', 'role']
      }]
    });
  };

  // 类方法：通过user_id查找所有绑定的open_id
  UserOpenId.findByUserId = async function(userId) {
    return await this.findAll({
      where: { user_id: userId },
      order: [['bound_at', 'DESC']]
    });
  };

  // 类方法：绑定用户和open_id
  UserOpenId.bindUserOpenId = async function(userId, openId) {
    // 检查是否已经绑定
    const existing = await this.findOne({
      where: { user_id: userId, open_id: openId }
    });

    if (existing) {
      throw new Error('该用户已绑定此OpenID');
    }

    // 检查open_id是否已被其他用户绑定
    const existingOpenId = await this.findOne({
      where: { open_id: openId }
    });

    if (existingOpenId) {
      throw new Error('此OpenID已被其他用户绑定');
    }

    return await this.create({
      user_id: userId,
      open_id: openId,
      bound_at: new Date()
    });
  };

  // 类方法：解绑用户和open_id
  UserOpenId.unbindUserOpenId = async function(userId, openId) {
    const result = await this.destroy({
      where: { user_id: userId, open_id: openId }
    });

    if (result === 0) {
      throw new Error('未找到对应的绑定关系');
    }

    return result;
  };

  return UserOpenId;
}

module.exports = defineUserOpenIdModel;