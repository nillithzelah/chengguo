const { DataTypes } = require('sequelize');

// 定义Entity模型的函数
function defineEntityModel(sequelize) {
  const Entity = sequelize.define('Entity', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255]
      },
      comment: '主体名称'
    },
    programmer: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        len: [0, 100]
      },
      comment: '程序员姓名'
    },
    account_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '账号名'
    },
    game_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '游戏名称'
    },
    development_status: {
      type: DataTypes.ENUM('游戏创建', '基础/资质', '开发/提审', '游戏备案', 'ICP备案', '上线运营'),
      allowNull: true,
      comment: '开发状态'
    },
    assigned_user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '分配的用户ID'
    },
    development_status_updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '开发状态更新时间'
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
    tableName: 'entities',
    indexes: [
      {
        fields: ['name']
      },
      {
        fields: ['programmer']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['updated_at']
      }
    ]
  });

  // 类方法：通过名称查找主体
  Entity.findByName = async function(name) {
    return await this.findOne({
      where: { name }
    });
  };

  // 类方法：通过程序员查找主体
  Entity.findByProgrammer = async function(programmer) {
    return await this.findAll({
      where: { programmer }
    });
  };

  // 类方法：通过状态查找主体
  Entity.findByStatus = async function(status) {
    return await this.findAll({
      where: { development_status: status }
    });
  };

  // 转换为前端格式的方法
  Entity.prototype.toFrontendFormat = function() {
    return {
      id: this.id,
      name: this.name,
      programmer: this.programmer,
      account_name: this.account_name,
      game_name: this.game_name,
      development_status: this.development_status,
      assigned_user_id: this.assigned_user_id,
      development_status_updated_at: this.development_status_updated_at ? this.development_status_updated_at.toISOString() : null,
      created_at: this.created_at ? this.created_at.toISOString() : null,
      updated_at: this.updated_at ? this.updated_at.toISOString() : null,
      assigned_user_name: this.assignedUser ? (this.assignedUser.name || this.assignedUser.username) : '未分配'
    };
  };

  return Entity;
}

module.exports = defineEntityModel;