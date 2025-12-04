const { testConnection, sequelize } = require('./config/database');
const defineTokenModel = require('./models/Token');
const Token = defineTokenModel(sequelize);

async function updateServerTokens() {
  try {
    console.log('📡 连接数据库...');
    await testConnection();
    console.log('✅ 数据库连接成功');

    // 更新access_token
    console.log('🔄 更新access_token...');
    await sequelize.query(`
      UPDATE tokens
      SET token_value = 'c5161d51689a070563626c38f1ead560b34fb836',
          expires_at = datetime('now', '+2 hours'),
          updated_at = datetime('now')
      WHERE token_type = 'access_token'
    `);

    // 更新refresh_token
    console.log('🔄 更新refresh_token...');
    await sequelize.query(`
      UPDATE tokens
      SET token_value = 'f3fc26ddd8371c4307db3b0d892cac9a51076472',
          expires_at = datetime('now', '+30 days'),
          updated_at = datetime('now')
      WHERE token_type = 'refresh_token'
    `);

    console.log('✅ Token更新成功');

    // 验证更新结果
    const [results] = await sequelize.query('SELECT token_type, token_value, expires_at FROM tokens WHERE token_type IN ("access_token", "refresh_token")');

    console.log('📋 更新后的token:');
    results.forEach(token => {
      console.log(`  ${token.token_type}: ${token.token_value.substring(0, 20)}... (过期: ${token.expires_at})`);
    });

  } catch (error) {
    console.error('❌ Token更新失败:', error.message);
  } finally {
    process.exit(0);
  }
}

updateServerTokens();