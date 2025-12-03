#!/usr/bin/env node

const { sequelize } = require('../../config/database');
const defineCustomerModel = require('../../models/Customer');

async function syncCustomersTable() {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    // 初始化Customer模型
    const Customer = defineCustomerModel(sequelize);

    // 强制同步customers表
    console.log('🔄 正在同步customers表...');
    await Customer.sync({ force: false, alter: true });
    console.log('✅ customers表同步完成');

    // 检查表结构
    const [customerColumns] = await sequelize.query("PRAGMA table_info(customers)");
    console.log('\nCustomers table columns:');
    customerColumns.forEach(col => {
      console.log(`  ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
    });

  } catch (error) {
    console.error('❌ 同步失败:', error.message);
    console.error('错误详情:', error);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  syncCustomersTable();
}