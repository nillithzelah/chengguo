const { Sequelize } = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

async function fixMissingEntity() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');

    // 定义Entity模型（简化版）
    const Entity = sequelize.define('Entity', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING(255), allowNull: false },
      programmer: { type: Sequelize.STRING(100), allowNull: true },
      manager: { type: Sequelize.STRING(100), allowNull: true },
      account_name: { type: Sequelize.STRING(255), allowNull: true },
      game_name: { type: Sequelize.STRING(255), allowNull: true },
      development_status: {
        type: Sequelize.ENUM('游戏创建', '基础/资质进行中', '基础/资质已提交', '创建流量主', '开发/提审进行中', '开发/提审已提交', '游戏备案进行中', '游戏备案已提交', 'ICP备案进行中', 'ICP备案已提交', '上线运营'),
        allowNull: true
      },
      assigned_user_id: { type: Sequelize.INTEGER, allowNull: true },
      is_limited_status: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW }
    }, {
      tableName: 'entities'
    });

    // 检查是否已经存在"海底探险家123"的entity记录
    const existingEntity = await Entity.findOne({
      where: { game_name: '海底探险家123' }
    });

    if (existingEntity) {
      console.log('✅ "海底探险家123" 游戏已经有对应的主体记录:', existingEntity.name);
      return;
    }

    // 创建新的entity记录
    const newEntity = await Entity.create({
      name: '测试主体', // 临时主体名称
      game_name: '海底探险家123',
      programmer: '测试程序员',
      manager: '测试管家',
      development_status: '游戏创建',
      is_limited_status: false
    });

    console.log('✅ 成功为"海底探险家123"游戏创建主体记录:', {
      id: newEntity.id,
      name: newEntity.name,
      game_name: newEntity.game_name
    });

  } catch (error) {
    console.error('修复失败:', error);
  } finally {
    await sequelize.close();
  }
}

fixMissingEntity();