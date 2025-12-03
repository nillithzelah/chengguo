const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Customer = sequelize.define('Customer', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '客户ID'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '客户名称'
    },
    contact_person: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '联系人'
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '联系电话'
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '邮箱'
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '地址'
    },
    industry: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '行业'
    },
    company_size: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '公司规模'
    },
    budget_range: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '预算范围'
    },
    sales_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '销售ID'
    },
    game_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '游戏数量'
    },
    game_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '游戏类型'
    },
    payment_entity: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '收款主体'
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: '金额'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '备注'
    },
    signer_name: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '签署人姓名'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '创建时间'
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '更新时间'
    }
  }, {
    tableName: 'customers',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    comment: '客户表'
  });

  // 关联关系
  Customer.associate = (models) => {
    // 与用户表的关联（销售）
    Customer.belongsTo(models.User, {
      foreignKey: 'sales_id',
      as: 'salesUser',
      targetKey: 'id'
    });
  };

  // 前端格式化方法
  Customer.prototype.toFrontendFormat = function() {
    const customer = this.toJSON();

    // 获取销售名称：优先使用signer_name字段，如果没有则使用关联查询的结果
    let salesName = customer.signer_name;
    if (!salesName && customer.salesUser) {
      salesName = customer.salesUser.name || customer.salesUser.username;
    }

    return {
      id: customer.id,
      name: customer.name,
      contact_person: customer.contact_person,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      industry: customer.industry,
      company_size: customer.company_size,
      budget_range: customer.budget_range,
      sales_id: customer.sales_id,
      signer_name: salesName,
      sales_name: salesName, // 保留sales_name以防其他地方使用
      game_count: customer.game_count,
      game_type: customer.game_type,
      payment_entity: customer.payment_entity,
      amount: customer.amount,
      notes: customer.notes,
      created_at: customer.created_at,
      updated_at: customer.updated_at
    };
  };

  // 静态方法：根据名称查找客户
  Customer.findByName = async function(name) {
    return await this.findAll({
      where: {
        name: name
      }
    });
  };

  return Customer;
};