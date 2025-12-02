const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

// 定义User模型的函数
function defineUserModel(sequelize) {
  const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [3, 50]
    }
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  password_plain: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '明文密码，用于管理员查看'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  role: {
    type: DataTypes.ENUM('admin', 'internal_boss', 'internal_service', 'internal_user', 'internal_user_1', 'internal_user_2', 'internal_user_3', 'external_boss', 'external_service', 'external_user_1', 'external_user_2', 'external_user_3', 'programmer', 'steward'),
    defaultValue: 'external_user_1',
    allowNull: false
  },
  avatar: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  last_login_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: '创建者用户ID'
  },
  parent_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: '上级用户ID，用于建立用户层级关系'
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
  tableName: 'users',
  indexes: [
    {
      unique: true,
      fields: ['username']
    },
    {
      unique: true,
      fields: ['email']
    },
    {
      fields: ['role']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['created_by']
    },
    {
      fields: ['parent_id']
    }
  ]
});

// 实例方法：验证密码
User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password_hash);
};

// 实例方法：设置密码
User.prototype.setPassword = async function(password) {
  const saltRounds = 10;
  this.password_hash = await bcrypt.hash(password, saltRounds);
};

// 类方法：通过用户名查找用户
User.findByUsername = async function(username) {
  return await this.findOne({
    where: { username, is_active: true }
  });
};

// 类方法：通过邮箱查找用户
User.findByEmail = async function(email) {
  return await this.findOne({
    where: { email, is_active: true }
  });
};

// 类方法：创建用户
User.createUser = async function(userData) {
  const { password, ...userInfo } = userData;

  if (password) {
    // 先创建用户设置密码
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // 使用create方法直接创建用户，确保所有字段都被包含
    const user = await this.create({
      ...userInfo,
      password_hash,
      password_plain: password // 保存明文密码用于管理员查看
    });

    return user;
  } else {
    // 如果没有密码，直接创建
    return await this.create(userInfo);
  }
};

// 类方法：更新最后登录时间
User.updateLastLogin = async function(userId) {
  return await this.update(
    { last_login_at: new Date() },
    { where: { id: userId } }
  );
};

// 转换为前端格式的方法
User.prototype.toFrontendFormat = function() {
  const { password_hash, ...userData } = this.toJSON();
  return {
    ...userData,
    registrationDate: this.created_at ? this.created_at.toISOString().split('T')[0] : null,
    accountId: this.id.toString()
  };
};

  // 定义关联关系 - 移除重复的关联定义，避免与server.js中的冲突
  // 关联关系已在server.js中定义，这里不再重复定义

  return User;
}

module.exports = defineUserModel;