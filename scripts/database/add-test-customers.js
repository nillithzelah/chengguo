#!/usr/bin/env node

const { sequelize } = require('../../config/database');
const defineCustomerModel = require('../../models/Customer');
const defineUserModel = require('../../models/User');

async function addTestCustomers() {
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

    // 使用固定的销售选项：袁（ID: 1）和赵（ID: 2）
    const salesOptions = [
      { id: 1, name: '袁', username: 'yuan' },
      { id: 2, name: '赵', username: 'zhao' }
    ];

    console.log(`📊 使用固定的销售选项: ${salesOptions.map(s => s.name).join(', ')}`);

    // 测试客户数据
    const testCustomers = [
      {
        name: '北京科技有限公司',
        contact_person: '张经理',
        phone: '13800138001',
        email: 'zhang@beijing-tech.com',
        address: '北京市朝阳区建国门外大街1号',
        industry: '互联网',
        company_size: '50-100人',
        budget_range: '50万-100万',
        sales_id: salesOptions[0].id,
        game_count: 5,
        game_type: '休闲益智',
        payment_entity: '北京科技有限公司',
        amount: 75000.50,
        notes: '重点客户，需要重点跟进'
      },
      {
        name: '上海游戏工作室',
        contact_person: '李总监',
        phone: '13800138002',
        email: 'li@shanghai-games.com',
        address: '上海市浦东新区陆家嘴金融贸易区',
        industry: '游戏开发',
        company_size: '20-50人',
        budget_range: '20万-50万',
        sales_id: salesOptions.length > 1 ? salesOptions[1].id : salesOptions[0].id,
        game_count: 3,
        game_type: '动作冒险',
        payment_entity: '上海游戏工作室',
        amount: 35000.00,
        notes: '新客户，刚刚接触'
      },
      {
        name: '广州动漫有限公司',
        contact_person: '王总',
        phone: '13800138003',
        email: 'wang@guangzhou-anime.com',
        address: '广州市天河区珠江新城',
        industry: '动漫',
        company_size: '100-200人',
        budget_range: '100万以上',
        sales_id: salesOptions[0].id,
        game_count: 8,
        game_type: '动漫IP改编',
        payment_entity: '广州动漫有限公司',
        amount: 150000.75,
        notes: '大客户，长期合作'
      },
      {
        name: '深圳移动应用开发公司',
        contact_person: '陈经理',
        phone: '13800138004',
        email: 'chen@shenzhen-mobile.com',
        address: '深圳市南山区科技园',
        industry: '移动应用',
        company_size: '10-20人',
        budget_range: '10万-20万',
        sales_id: salesOptions.length > 1 ? salesOptions[1].id : salesOptions[0].id,
        game_count: 2,
        game_type: '工具应用',
        payment_entity: '深圳移动应用开发公司',
        amount: 12000.00,
        notes: '中小客户，稳定合作'
      },
      {
        name: '杭州电商平台',
        contact_person: '刘总监',
        phone: '13800138005',
        email: 'liu@hangzhou-ecommerce.com',
        address: '杭州市西湖区文三路',
        industry: '电商',
        company_size: '200人以上',
        budget_range: '200万以上',
        sales_id: salesOptions[0].id,
        game_count: 12,
        game_type: '电商平台游戏',
        payment_entity: '杭州电商平台',
        amount: 280000.25,
        notes: '超大客户，战略合作伙伴'
      }
    ];

    console.log('🔄 正在添加测试客户数据...');

    for (const customerData of testCustomers) {
      try {
        // 检查客户是否已存在
        const existingCustomer = await Customer.findOne({
          where: { name: customerData.name }
        });

        if (existingCustomer) {
          console.log(`⚠️ 客户 "${customerData.name}" 已存在，跳过`);
          continue;
        }

        // 创建客户
        const newCustomer = await Customer.create(customerData);
        console.log(`✅ 成功添加客户: ${newCustomer.name} (ID: ${newCustomer.id})`);

      } catch (error) {
        console.error(`❌ 添加客户 "${customerData.name}" 失败:`, error.message);
      }
    }

    // 统计添加的客户数量
    const totalCustomers = await Customer.count();
    console.log(`\n📊 当前数据库中共有 ${totalCustomers} 个客户`);

    console.log('✅ 测试客户数据添加完成');

  } catch (error) {
    console.error('❌ 添加测试客户数据失败:', error.message);
    console.error('错误详情:', error);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  addTestCustomers();
}

module.exports = addTestCustomers;