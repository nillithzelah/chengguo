// 更新游戏广告ID的脚本
const { sequelize } = require('../config/database');

async function updateAdIds() {
  try {
    console.log('📡 连接数据库...');
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    console.log('🔄 更新神仙游游戏的广告ID...');

    // 更新神仙游游戏的广告ID
    const [result] = await sequelize.query(
      `UPDATE games SET advertiser_id = '1843320456982026', promotion_id = '7550558554752532523' WHERE appid = 'tt8513f3ae1a1ce1af02'`
    );

    console.log('✅ 更新完成，受影响的行数:', result);

    // 验证更新结果
    const [games] = await sequelize.query(
      `SELECT id, appid, name, advertiser_id, promotion_id FROM games WHERE appid = 'tt8513f3ae1a1ce1af02'`
    );

    console.log('📋 更新后的数据:');
    console.table(games);

  } catch (error) {
    console.error('❌ 更新失败:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('📡 数据库连接已关闭');
  }
}

// 运行脚本
if (require.main === module) {
  console.log('🚀 更新游戏广告ID脚本');
  console.log('================================');
  updateAdIds()
    .then(() => {
      console.log('🎉 脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = updateAdIds;