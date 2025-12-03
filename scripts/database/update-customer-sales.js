const { testConnection, sequelize } = require('../../config/database');
const defineUserModel = require('../../models/User');
const defineCustomerModel = require('../../models/Customer');

// 初始化模型
const User = defineUserModel(sequelize);
const Customer = defineCustomerModel(sequelize);

// 定义模型关联关系
Customer.belongsTo(User, {
  foreignKey: 'sales_id',
  as: 'salesUser',
  targetKey: 'id'
});

async function updateCustomerSales() {
  try {
    console.log('🔄 开始修复客户销售ID...');

    // 测试数据库连接
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ 数据库连接失败');
      process.exit(1);
    }

    // 获取所有销售用户
    const salesUsers = await User.findAll({
      where: {
        role: 'sales',
        is_active: true
      },
      attributes: ['id', 'username', 'name']
    });

    console.log('📋 找到的销售用户:');
    salesUsers.forEach(user => {
      console.log(`  ID: ${user.id}, 用户名: ${user.username}, 姓名: ${user.name}`);
    });

    // 创建映射：根据用户名匹配
    const salesMap = {};
    salesUsers.forEach(user => {
      if (user.username.includes('袁') || user.name === '袁') {
        salesMap['yuan'] = user.id;
        salesMap['袁'] = user.id;
      }
      if (user.username.includes('赵') || user.name === '赵') {
        salesMap['zhao'] = user.id;
        salesMap['赵'] = user.id;
      }
    });

    console.log('🔗 销售ID映射:');
    Object.entries(salesMap).forEach(([key, value]) => {
      console.log(`  ${key} -> ${value}`);
    });

    // 获取所有客户
    const customers = await Customer.findAll({
      attributes: ['id', 'name', 'sales_id']
    });

    console.log(`📊 找到 ${customers.length} 个客户`);

    let updatedCount = 0;

    // 更新每个客户的sales_id
    for (const customer of customers) {
      let newSalesId = null;

      if (customer.sales_id === 1) {
        newSalesId = salesMap['袁'] || salesMap['yuan'];
        console.log(`🔄 更新客户 "${customer.name}" (ID: ${customer.id}): sales_id 1 -> ${newSalesId} (袁)`);
      } else if (customer.sales_id === 2) {
        newSalesId = salesMap['赵'] || salesMap['zhao'];
        console.log(`🔄 更新客户 "${customer.name}" (ID: ${customer.id}): sales_id 2 -> ${newSalesId} (赵)`);
      }

      if (newSalesId !== null) {
        await customer.update({ sales_id: newSalesId });
        updatedCount++;
      }
    }

    console.log(`✅ 修复完成，共更新了 ${updatedCount} 个客户的销售ID`);

    // 验证修复结果
    console.log('🔍 验证修复结果...');
    const updatedCustomers = await Customer.findAll({
      where: {
        sales_id: {
          [sequelize.Sequelize.Op.in]: [1, 2]
        }
      },
      attributes: ['id', 'name', 'sales_id']
    });

    if (updatedCustomers.length === 0) {
      console.log('✅ 验证通过：没有客户使用错误的销售ID (1或2)');
    } else {
      console.log('⚠️ 警告：仍有客户使用错误的销售ID:');
      updatedCustomers.forEach(customer => {
        console.log(`  客户 "${customer.name}" (ID: ${customer.id}) 仍使用 sales_id: ${customer.sales_id}`);
      });
    }

    // 显示修复后的客户统计
    const finalCustomers = await Customer.findAll({
      include: [{
        model: User,
        as: 'salesUser',
        attributes: ['id', 'username', 'name'],
        required: false
      }],
      attributes: ['id', 'name', 'sales_id']
    });

    console.log('📈 修复后的客户销售分配统计:');
    const salesStats = {};
    finalCustomers.forEach(customer => {
      const salesName = customer.salesUser ? (customer.salesUser.name || customer.salesUser.username) : '未分配';
      salesStats[salesName] = (salesStats[salesName] || 0) + 1;
    });

    Object.entries(salesStats).forEach(([salesName, count]) => {
      console.log(`  ${salesName}: ${count} 个客户`);
    });

  } catch (error) {
    console.error('❌ 修复客户销售ID时发生错误:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// 运行修复脚本
updateCustomerSales();