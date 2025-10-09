const { DataTypes } = require('sequelize');

// 定义Token模型的函数
function defineTokenModel(sequelize) {
  const Token = sequelize.define('Token', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    token_type: {
      type: DataTypes.ENUM('access_token', 'refresh_token'),
      allowNull: false,
      comment: 'token类型：access_token 或 refresh_token'
    },
    token_value: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'token值'
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'token过期时间'
    },
    last_refresh_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '最后刷新时间'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      comment: '是否激活'
    },
    app_id: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '应用ID'
    },
    app_secret: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '应用密钥（加密存储）'
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '描述信息'
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
    tableName: 'tokens',
    indexes: [
      {
        fields: ['token_type']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['expires_at']
      }
    ]
  });

  // 类方法：获取活跃的token
  Token.getActiveToken = async function(tokenType) {
    return await this.findOne({
      where: {
        token_type: tokenType,
        is_active: true
      },
      order: [['updated_at', 'DESC']]
    });
  };

  // 类方法：设置token
  Token.setToken = async function(tokenType, tokenValue, options = {}) {
    const {
      expiresAt,
      appId,
      appSecret,
      description
    } = options;

    // 先将其他同类型的token设为非活跃
    await this.update(
      { is_active: false },
      { where: { token_type: tokenType } }
    );

    // 创建新的活跃token
    return await this.create({
      token_type: tokenType,
      token_value: tokenValue,
      expires_at: expiresAt,
      last_refresh_at: new Date(),
      app_id: appId,
      app_secret: appSecret,
      description: description || `${tokenType} for Douyin API`,
      is_active: true
    });
  };

  // 类方法：更新token
  Token.updateToken = async function(tokenType, tokenValue, options = {}) {
    const { expiresAt } = options;

    const token = await this.getActiveToken(tokenType);
    if (token) {
      return await token.update({
        token_value: tokenValue,
        expires_at: expiresAt,
        last_refresh_at: new Date(),
        updated_at: new Date()
      });
    } else {
      // 如果没有活跃token，创建新的
      return await this.setToken(tokenType, tokenValue, options);
    }
  };

  // 类方法：初始化默认token（用于迁移）
  Token.initDefaultTokens = async function() {
    const defaultTokens = [
      {
        token_type: 'access_token',
        token_value: '0e42b4e6c282899254de99751f5910681c2e736b',
        description: '默认抖音access_token',
        app_id: '1843500894701081',
        app_secret: '7ad00307b2596397ceeee3560ca8bfc9b3622476'
      },
      {
        token_type: 'refresh_token',
        token_value: 'aaf6c6850831e2894be845ccfd40100e3b7c46ee',
        description: '默认抖音refresh_token',
        app_id: '1843500894701081',
        app_secret: '7ad00307b2596397ceeee3560ca8bfc9b3622476'
      }
    ];

    for (const tokenData of defaultTokens) {
      const existing = await this.getActiveToken(tokenData.token_type);
      if (!existing) {
        await this.setToken(tokenData.token_type, tokenData.token_value, {
          appId: tokenData.app_id,
          appSecret: tokenData.app_secret,
          description: tokenData.description
        });
        console.log(`✅ 初始化默认${tokenData.token_type}`);
      }
    }
  };

  // 转换为前端格式的方法（隐藏敏感信息）
  Token.prototype.toFrontendFormat = function() {
    const data = this.toJSON();
    return {
      id: data.id,
      token_type: data.token_type,
      description: data.description,
      app_id: data.app_id,
      last_refresh_at: data.last_refresh_at,
      expires_at: data.expires_at,
      is_active: data.is_active,
      created_at: data.created_at,
      updated_at: data.updated_at,
      // 显示完整token信息
      token_value: data.token_value,
      app_secret: data.app_secret ? '***' : null
    };
  };

  return Token;
}

module.exports = defineTokenModel;