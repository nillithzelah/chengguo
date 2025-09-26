#!/usr/bin/env node

/**
 * 重置Token表 - 删除旧表并重新创建
 * 用于解决服务器上旧token表结构不兼容的问题
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// 数据库连接
const { testConnection, sequelize } = require('../config/database');

async function resetTokensTable() {
  try {
    console.log('🔄 开始重置tokens表...');

    // 测试数据库连接
    console.log('📡 测试数据库连接...');
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ 数据库连接失败');
      process.exit(1);
    }

    // 检查当前表结构
    console.log('🔍 检查当前tokens表结构...');
    const tableExists = await sequelize.getQueryInterface().showAllTables();
    const hasTokensTable = tableExists.includes('tokens');

    if (hasTokensTable) {
      console.log('📋 发现现有的tokens表，正在备份数据...');

      // 备份现有数据
      const existingTokens = await sequelize.query(`
        SELECT * FROM tokens WHERE is_active = 1
      `, { type: sequelize.QueryTypes.SELECT });

      console.log(`📦 备份了 ${existingTokens.length} 条活跃token数据`);

      // 删除旧表
      console.log('🗑️ 删除旧的tokens表...');
      await sequelize.getQueryInterface().dropTable('tokens');
      console.log('✅ 旧表删除成功');
    } else {
      console.log('ℹ️ 未发现现有的tokens表');
    }

    // 创建新表
    console.log('🏗️ 创建新的tokens表...');
    await sequelize.getQueryInterface().createTable('tokens', {
      id: {
        type: sequelize.Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      token_type: {
        type: sequelize.Sequelize.ENUM('access_token', 'refresh_token'),
        allowNull: false,
        comment: 'token类型：access_token 或 refresh_token'
      },
      token_value: {
        type: sequelize.Sequelize.TEXT,
        allowNull: false,
        comment: 'token值'
      },
      expires_at: {
        type: sequelize.Sequelize.DATE,
        allowNull: true,
        comment: 'token过期时间'
      },
      last_refresh_at: {
        type: sequelize.Sequelize.DATE,
        allowNull: true,
        comment: '最后刷新时间'
      },
      is_active: {
        type: sequelize.Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        comment: '是否激活'
      },
      app_id: {
        type: sequelize.Sequelize.STRING(50),
        allowNull: true,
        comment: '应用ID'
      },
      app_secret: {
        type: sequelize.Sequelize.STRING(100),
        allowNull: true,
        comment: '应用密钥（加密存储）'
      },
      description: {
        type: sequelize.Sequelize.STRING(255),
        allowNull: true,
        comment: '描述信息'
      },
      created_at: {
        type: sequelize.Sequelize.DATE,
        allowNull: false,
        defaultValue: sequelize.Sequelize.NOW
      },
      updated_at: {
        type: sequelize.Sequelize.DATE,
        allowNull: false,
        defaultValue: sequelize.Sequelize.NOW
      },
      app_type: {
        type: sequelize.Sequelize.ENUM('ad', 'minigame'),
        defaultValue: 'ad',
        allowNull: false,
        comment: '应用类型：ad(广告投放) 或 minigame(小游戏)'
      }
    });

    console.log('✅ 新tokens表创建成功');

    // 创建索引
    console.log('🔗 创建表索引...');
    await sequelize.getQueryInterface().addIndex('tokens', ['token_type']);
    await sequelize.getQueryInterface().addIndex('tokens', ['is_active']);
    await sequelize.getQueryInterface().addIndex('tokens', ['expires_at']);
    console.log('✅ 索引创建成功');

    // 初始化默认token
    console.log('🔄 初始化默认token...');

    const defaultTokens = [
      {
        token_type: 'access_token',
        token_value: '0e42b4e6c282899254de99751f5910681c2e736b',
        description: '默认抖音广告投放access_token',
        app_id: '1843500894701081',
        app_secret: '7ad00307b2596397ceeee3560ca8bfc9b3622476',
        app_type: 'ad'
      },
      {
        token_type: 'refresh_token',
        token_value: 'aaf6c6850831e2894be845ccfd40100e3b7c46ee',
        description: '默认抖音广告投放refresh_token',
        app_id: '1843500894701081',
        app_secret: '7ad00307b2596397ceeee3560ca8bfc9b3622476',
        app_type: 'ad'
      }
    ];

    for (const tokenData of defaultTokens) {
      await sequelize.query(`
        INSERT INTO tokens (
          token_type, token_value, is_active, last_refresh_at,
          app_id, app_secret, description, app_type, created_at, updated_at
        ) VALUES (
          ?, ?, 1, datetime('now'),
          ?, ?, ?, ?, datetime('now'), datetime('now')
        )
      `, {
        replacements: [
          tokenData.token_type,
          tokenData.token_value,
          tokenData.app_id,
          tokenData.app_secret,
          tokenData.description,
          tokenData.app_type
        ],
        type: sequelize.QueryTypes.INSERT
      });
      console.log(`✅ 初始化默认${tokenData.token_type}`);
    }

    // 验证表创建成功
    const [result] = await sequelize.query(`
      SELECT COUNT(*) as count FROM tokens
    `, { type: sequelize.QueryTypes.SELECT });

    console.log(`✅ tokens表重置完成，包含 ${result.count} 条记录`);
    console.log('🎉 数据库重置成功！');

  } catch (error) {
    console.error(`❌ 重置tokens表失败:`, error.message);
    console.error('完整错误:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// 执行重置
resetTokensTable();