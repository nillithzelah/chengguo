const { sequelize } = require('../../config/database');
const defineCustomerModel = require('../../models/Customer');
const defineUserModel = require('../../models/User');

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

    // 获取前5个客户及其销售信息
    const customers = await Customer.findAll({
      limit: 5,
      include: [{
        model: User,
        as: 'salesUser',
        attributes: ['id', 'username', 'name'],
        required: false
      }],
      order: [['created_at', 'DESC']]
    });

    console.log('📋 客户销售信息检查:');
    customers.forEach(customer => {
      const salesInfo = customer.salesUser ?
        `${customer.salesUser.name} (${customer.salesUser.username})` :
        '未分配';

      console.log(`   - ${customer.name}: ${salesInfo}`);
    });

    // 获取销售选项
    const salesUsers = await User.findAll({
      where: { role: 'sales', is_active: true },
      attributes: ['id', 'username', 'name'],
      order: [['username', 'ASC']]
    });

    console.log('\n📊 销售用户列表:');
    salesUsers.forEach(user => {
      console.log(`   - ID: ${user.id}, 姓名: ${user.name}, 用户名: ${user.username}`);
    });

    console.log('✅ 检查完成');

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