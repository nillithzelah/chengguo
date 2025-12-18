const { Sequelize } = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite',
  logging: false
});

async function checkTableStructure() {
  try {
    console.log('📋 检查entities表结构...');

    const [result] = await sequelize.query('PRAGMA table_info(entities)');
    console.log('Entities table structure:');
    result.forEach(col => {
      console.log(`  ${col.name}: ${col.type}`);
    });

    console.log('\n📋 检查一些示例数据...');
    const [entities] = await sequelize.query('SELECT * FROM entities LIMIT 3');
    console.log('Sample entities:');
    entities.forEach(entity => {
      console.log(`  ${JSON.stringify(entity)}`);
    });

  } catch (error) {
    console.error('检查失败:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkTableStructure();