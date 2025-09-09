const bcrypt = require('bcrypt');
const { testConnection } = require('./config/database');
const User = require('./models/User');

async function testPasswords() {
  console.log('🔐 测试密码验证...');

  try {
    // 测试数据库连接
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ 数据库连接失败');
      return;
    }

    // 获取所有用户
    const users = await User.findAll({
      attributes: ['id', 'username', 'password_hash', 'name']
    });

    console.log('📊 数据库中的用户:');
    for (const user of users) {
      console.log(`  ${user.username}: ${user.password_hash ? user.password_hash.substring(0, 20) + '...' : 'NULL'}`);
    }

    // 测试密码验证
    console.log('\n🔍 测试密码验证:');

    const testCases = [
      { username: 'admin', password: 'admin123' },
      { username: 'user', password: 'user123' },
      { username: '111', password: '111' }
    ];

    for (const testCase of testCases) {
      const user = await User.findByUsername(testCase.username);
      if (user) {
        console.log(`\n测试 ${testCase.username} / ${testCase.password}:`);
        console.log(`  用户存在: ✅`);
        console.log(`  密码哈希: ${user.password_hash ? '存在' : 'NULL'}`);

        if (user.password_hash) {
          const isValid = await user.validatePassword(testCase.password);
          console.log(`  密码验证: ${isValid ? '✅ 成功' : '❌ 失败'}`);

          // 手动验证bcrypt
          const manualCheck = await bcrypt.compare(testCase.password, user.password_hash);
          console.log(`  手动验证: ${manualCheck ? '✅ 成功' : '❌ 失败'}`);
        }
      } else {
        console.log(`\n测试 ${testCase.username}: 用户不存在 ❌`);
      }
    }

  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testPasswords();