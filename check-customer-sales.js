#!/usr/bin/env node

const { sequelize } = require('./config/database');
const defineCustomerModel = require('./models/Customer');
const defineUserModel = require('./models/User');

async function checkCustomerSales() {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    // 初始化模型
    const Customer = defineCustomerModel(sequelize);
    const User = defineUserModel(sequelize);

    // 设置关联
    Customer.belongsTo(User, {
      foreignKey: 'sales_id',
      as: 'salesUser',
      targetKey: 'id'
    });

    console.log('\n🔍 检查销售用户数据...');
    const salesUsers = await User.findAll({
      where: {
        role: 'sales'
      },
      attributes: ['id', 'username', 'name', 'role']
    });

    console.log(`📊 找到 ${salesUsers.length} 个销售用户:`);
    salesUsers.forEach(user => {
      console.log(`  - ID: ${user.id}, 用户名: ${user.username}, 姓名: ${user.name}`);
    });

    console.log('\n🔍 检查所有用户数据...');
    const allUsers = await User.findAll({
      attributes: ['id', 'username', 'name', 'role']
    });

    console.log(`📊 总共 ${allUsers.length} 个用户:`);
    allUsers.forEach(user => {
      console.log(`  - ID: ${user.id}, 用户名: ${user.username}, 姓名: ${user.name}, 角色: ${user.role}`);
    });

    console.log('\n🔍 检查客户数据...');
    const customers = await Customer.findAll({
      include: [{
        model: User,
        as: 'salesUser',
        attributes: ['id', 'username', 'name'],
        required: false
      }]
    });

    console.log(`📊 找到 ${customers.length} 个客户:`);
    customers.forEach(customer => {
      const salesName = customer.salesUser ? (customer.salesUser.name || customer.salesUser.username) : '未关联';
      console.log(`  - 客户: ${customer.name}, sales_id: ${customer.sales_id}, 销售: ${salesName}`);
    });

    console.log('\n🔍 检查客户前端格式化结果...');
    customers.forEach(customer => {
      const formatted = customer.toFrontendFormat();
      console.log(`  - 客户: ${formatted.name}, sales_name: ${formatted.sales_name}, signer_name: ${formatted.signer_name}`);
    });

  } catch (error) {
    console.error('❌ 检查失败:', error.message);
    console.error('错误详情:', error);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  checkCustomerSales();
}

module.exports = checkCustomerSales;