const { DataTypes } = require('sequelize');

// 定义UserGame模型的函数
function defineUserGameModel(sequelize) {
  const UserGame = sequelize.define('UserGame', {
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
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  game_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'games',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  role: {
    type: DataTypes.ENUM('owner', 'viewer', 'editor'),
    defaultValue: 'viewer',
    allowNull: false
  },
  permissions: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: '用户对游戏的具体权限设置'
  },
  assignedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  assignedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: '分配权限的用户ID'
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
  tableName: 'user_games',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'game_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['game_id']
    },
    {
      fields: ['role']
    }
  ]
});

// 类方法：为用户分配游戏权限
UserGame.assignGameToUser = async function(userId, gameId, role = 'viewer', assignedBy) {
  // 首先检查是否已存在记录
  const existingRecord = await this.findOne({
    where: { user_id: userId, game_id: gameId }
  });

  if (existingRecord) {
    // 如果存在，更新记录
    return await existingRecord.update({
      role,
      assignedBy: assignedBy,
      assignedAt: new Date(),
      updated_at: new Date()
    });
  } else {
    // 如果不存在，创建新记录
    return await this.create({
      user_id: userId,
      game_id: gameId,
      role,
      assignedBy: assignedBy,
      assignedAt: new Date()
    });
  }
};

// 类方法：移除用户的游戏权限
UserGame.removeUserFromGame = async function(userId, gameId) {
  return await this.destroy({
    where: { user_id: userId, game_id: gameId }
  });
};

// 类方法：获取用户的所有游戏
UserGame.getUserGames = async function(userId) {
  return await this.findAll({
    where: { user_id: userId },
    include: [{
      model: require('./Game'),
      as: 'game',
      where: { status: 'active' }
    }],
    order: [['assigned_at', 'DESC']]
  });
};

// 类方法：获取游戏的所有用户
UserGame.getGameUsers = async function(gameId) {
  return await this.findAll({
    where: { game_id: gameId },
    include: [{
      model: require('./User'),
      as: 'user',
      where: { is_active: true }
    }],
    order: [['assigned_at', 'DESC']]
  });
};

// 类方法：检查用户是否有游戏权限
UserGame.checkUserGamePermission = async function(userId, gameId, requiredRole = null) {
  const userGame = await this.findOne({
    where: { user_id: userId, game_id: gameId }
  });

  if (!userGame) {
    return false;
  }

  if (requiredRole) {
    const roleHierarchy = { viewer: 1, editor: 2, owner: 3 };
    return roleHierarchy[userGame.role] >= roleHierarchy[requiredRole];
  }

  return true;
};

// 类方法：更新用户游戏权限
UserGame.updateUserGameRole = async function(userId, gameId, newRole) {
  return await this.update(
    { role: newRole, updated_at: new Date() },
    { where: { user_id: userId, game_id: gameId } }
  );
};

  return UserGame;
}

module.exports = defineUserGameModel;