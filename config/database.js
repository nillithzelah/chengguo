const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

// 数据库配置 - 使用SQLite作为默认数据库
const dbConfig = {
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', 'database.sqlite'),
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: true,
    paranoid: false
  }
};

// 如果环境变量指定使用PostgreSQL，则切换到PostgreSQL
if (process.env.DB_TYPE === 'postgres') {
  dbConfig.dialect = 'postgres';
  dbConfig.host = process.env.DB_HOST || 'localhost';
  dbConfig.port = process.env.DB_PORT || 5432;
  dbConfig.database = process.env.DB_NAME || 'chengguo_db';
  dbConfig.username = process.env.DB_USER || 'postgres';
  dbConfig.password = process.env.DB_PASSWORD || '';
  dbConfig.pool = {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  };
}

// 创建Sequelize实例
const sequelize = new Sequelize(dbConfig);

// 测试数据库连接
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    return false;
  }
};

// 同步数据库模型
const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log(`✅ 数据库${force ? '强制' : ''}同步成功`);
    return true;
  } catch (error) {
    console.error('❌ 数据库同步失败:', error.message);
    return false;
  }
};

// 导入模型定义函数
const defineUserModel = require('../models/User');
const defineGameModel = require('../models/Game');
const defineUserGameModel = require('../models/UserGame');
const defineTokenModel = require('../models/Token');
const defineEntityModel = require('../models/Entity');

// 注意：eCPM数据表已移除，采用实时查询策略
// 如需历史数据分析，可按需添加缓存或历史数据表

// 初始化模型
const User = defineUserModel(sequelize);
const Game = defineGameModel(sequelize);
const UserGame = defineUserGameModel(sequelize);
const Token = defineTokenModel(sequelize);
const Entity = defineEntityModel(sequelize);

// 定义模型关联关系
User.belongsToMany(Game, {
  through: UserGame,
  foreignKey: 'user_id',
  otherKey: 'game_id',
  as: 'games'
});

Game.belongsToMany(User, {
  through: UserGame,
  foreignKey: 'game_id',
  otherKey: 'user_id',
  as: 'users'
});

UserGame.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

UserGame.belongsTo(Game, {
  foreignKey: 'game_id',
  as: 'game'
});

UserGame.belongsTo(User, {
  foreignKey: 'assigned_by',
  as: 'assignedByUser'
});

module.exports = {
  sequelize,
  testConnection,
  syncDatabase,
  dbConfig
};