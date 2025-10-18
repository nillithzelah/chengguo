const { sequelize } = require('../config/database');

// 添加 entity_name 字段到 games 表
async function addEntityNameField() {
  try {
    console.log('📡 连接数据库...');
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    console.log('🔄 添加 entity_name 字段到 games 表...');

    // 使用原始 SQL 添加字段 (SQLite 不支持 COMMENT 语法)
    await sequelize.query(`
      ALTER TABLE games ADD COLUMN entity_name VARCHAR(255) DEFAULT NULL;
    `);

    console.log('✅ 成功添加 entity_name 字段到 games 表');

    // 验证字段是否添加成功
    const [results] = await sequelize.query(`
      PRAGMA table_info(games);
    `);

    const entityNameField = results.find(field => field.name === 'entity_name');
    if (entityNameField) {
      console.log('✅ 字段验证成功:', entityNameField);
    } else {
      console.log('❌ 字段验证失败');
    }

  } catch (error) {
    console.error('❌ 添加字段失败:', error.message);
    process.exit(1);
  }
}

// 执行迁移
addEntityNameField().then(() => {
  console.log('🎉 迁移完成');
  process.exit(0);
}).catch(error => {
  console.error('❌ 迁移失败:', error);
  process.exit(1);
});