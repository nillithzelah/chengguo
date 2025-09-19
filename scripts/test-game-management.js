#!/usr/bin/env node

// 测试游戏管理功能的脚本
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

let authToken = null;

// 工具函数
const makeRequest = async (method, url, data = null, useAuth = true) => {
  const config = {
    method,
    url: `${BASE_URL}${url}`,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (useAuth && authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }

  if (data) {
    config.data = data;
  }

  try {
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    };
  }
};

// 测试用户登录
const testLogin = async () => {
  console.log('🔐 测试用户登录...');

  const loginData = {
    username: 'admin',
    password: 'admin123'
  };

  const result = await makeRequest('POST', '/api/user/login', loginData, false);

  if (result.success && result.data.code === 20000) {
    authToken = result.data.data.token;
    console.log('✅ 登录成功，获取到token');
    console.log(`👤 用户: ${result.data.data.userInfo.username} (${result.data.data.userInfo.role})`);
    return true;
  } else {
    console.log('❌ 登录失败:', result.data?.message || result.error);
    return false;
  }
};

// 测试获取游戏列表
const testGetGameList = async () => {
  console.log('\n🎮 测试获取游戏列表...');

  const result = await makeRequest('GET', '/api/game/list');

  if (result.success && result.data.code === 20000) {
    const games = result.data.data.games;
    console.log(`✅ 获取游戏列表成功，共 ${games.length} 个游戏`);

    games.forEach((game, index) => {
      console.log(`   ${index + 1}. ${game.name} (${game.appid}) - ${game.status}`);
      console.log(game);
      console.log(`      广告主ID: ${game.advertiser_id || '未设置'}`);
      console.log(`      广告ID: ${game.promotion_id || '未设置'}`);
    });

    return games;
  } else {
    console.log('❌ 获取游戏列表失败:', result.data?.message || result.error);
    return [];
  }
};

// 测试获取用户列表
const testGetUserList = async () => {
  console.log('\n👥 测试获取用户列表...');

  const result = await makeRequest('GET', '/api/user/basic-list');

  if (result.success && result.data.code === 20000) {
    const users = result.data.data.users;
    console.log(`✅ 获取用户列表成功，共 ${users.length} 个用户`);

    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name || user.username} (${user.username}) - ${user.role}`);
    });

    return users;
  } else {
    console.log('❌ 获取用户列表失败:', result.data?.message || result.error);
    return [];
  }
};

// 测试创建游戏
const testCreateGame = async () => {
  console.log('\n➕ 测试创建游戏...');

  const testGameData = {
    name: `测试游戏_${Date.now()}`,
    appid: `test_${Date.now()}`,
    appSecret: 'test_secret_123456789',
    description: '这是一个测试游戏',
    advertiser_id: '123456789',
    promotion_id: '987654321'
  };

  const result = await makeRequest('POST', '/api/game/create', testGameData);

  if (result.success && result.data.code === 20000) {
    console.log('✅ 创建游戏成功');
    console.log(`   游戏名称: ${result.data.data.game.name}`);
    console.log(`   App ID: ${result.data.data.game.appid}`);
    console.log(`   ID: ${result.data.data.id}`);
    return result.data.data;
  } else {
    console.log('❌ 创建游戏失败:', result.data?.message || result.error);
    return null;
  }
};

// 测试更新游戏
const testUpdateGame = async (game) => {
  console.log('\n✏️ 测试更新游戏...');

  const updateData = {
    name: `${game.name}_已更新`,
    description: `${game.description} (已更新)`
  };

  const result = await makeRequest('PUT', `/api/game/update/${game.id}`, updateData);

  if (result.success && result.data.code === 20000) {
    console.log('✅ 更新游戏成功');
    console.log(`   新名称: ${result.data.data.game.name}`);
    return true;
  } else {
    console.log('❌ 更新游戏失败:', result.data?.message || result.error);
    return false;
  }
};

// 测试分配游戏给用户
const testAssignGame = async (game, users) => {
  console.log('\n🔗 测试分配游戏给用户...');

  if (users.length === 0) {
    console.log('⚠️ 没有用户可以分配，跳过测试');
    return false;
  }

  const assignData = {
    userId: users[0].id,
    gameId: game.id,
    role: 'viewer'
  };

  const result = await makeRequest('POST', '/api/game/assign', assignData);

  if (result.success && result.data.code === 20000) {
    console.log('✅ 分配游戏成功');
    console.log(`   用户: ${users[0].name || users[0].username}`);
    console.log(`   游戏: ${game.name}`);
    console.log(`   权限: ${assignData.role}`);
    return true;
  } else {
    console.log('❌ 分配游戏失败:', result.data?.message || result.error);
    return false;
  }
};

// 测试获取用户游戏列表
const testGetUserGames = async (userId) => {
  console.log('\n📋 测试获取用户游戏列表...');

  const result = await makeRequest('GET', `/api/game/user-games/${userId}`);

  if (result.success && result.data.code === 20000) {
    const games = result.data.data.games;
    console.log(`✅ 获取用户游戏列表成功，共 ${games.length} 个游戏`);

    games.forEach((game, index) => {
      console.log(`   ${index + 1}. ${game.game.name} (${game.game.appid}) - 权限: ${game.role}`);
    });

    return games;
  } else {
    console.log('❌ 获取用户游戏列表失败:', result.data?.message || result.error);
    return [];
  }
};

// 测试获取游戏用户列表
const testGetGameUsers = async (gameId) => {
  console.log('\n👥 测试获取游戏用户列表...');

  const result = await makeRequest('GET', `/api/game/${gameId}/users`);

  if (result.success && result.data.code === 20000) {
    const users = result.data.data.users;
    console.log(`✅ 获取游戏用户列表成功，共 ${users.length} 个用户`);

    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.user.name || user.user.username} (${user.user.username}) - 权限: ${user.role}`);
    });

    return users;
  } else {
    console.log('❌ 获取游戏用户列表失败:', result.data?.message || result.error);
    return [];
  }
};

// 测试删除游戏
const testDeleteGame = async (game) => {
  console.log('\n🗑️ 测试删除游戏...');

  const result = await makeRequest('DELETE', `/api/game/delete/${game.id}`);

  if (result.success && result.data.code === 20000) {
    console.log('✅ 删除游戏成功');
    console.log(`   删除的游戏: ${game.name}`);
    console.log(`   删除的用户权限记录: ${result.data.data.deletedPermissions} 条`);
    return true;
  } else {
    console.log('❌ 删除游戏失败:', result.data?.message || result.error);
    return false;
  }
};

// 主测试函数
const runTests = async () => {
  console.log('🚀 开始测试游戏管理功能');
  console.log('='.repeat(50));

  try {
    // 1. 登录获取token
    const loginSuccess = await testLogin();
    if (!loginSuccess) {
      console.log('\n❌ 登录失败，无法继续测试');
      return;
    }

    // 2. 获取现有数据
    const existingGames = await testGetGameList();
    const existingUsers = await testGetUserList();

    if (existingGames.length === 0) {
      console.log('\n⚠️ 没有现有游戏数据，某些测试可能受限');
    }

    if (existingUsers.length === 0) {
      console.log('\n⚠️ 没有现有用户数据，某些测试可能受限');
    }

    // 3. 创建测试游戏
    const testGame = await testCreateGame();
    if (!testGame) {
      console.log('\n❌ 创建测试游戏失败，跳过后续测试');
      return;
    }

    // 4. 更新游戏
    await testUpdateGame(testGame);

    // 5. 分配游戏给用户
    if (existingUsers.length > 0) {
      await testAssignGame(testGame, existingUsers);
    }

    // 6. 获取用户游戏列表
    if (existingUsers.length > 0) {
      await testGetUserGames(existingUsers[0].id);
    }

    // 7. 获取游戏用户列表
    await testGetGameUsers(testGame.id);

    // 8. 删除测试游戏
    await testDeleteGame(testGame);

    // 9. 最终验证
    console.log('\n🔍 最终验证...');
    const finalGames = await testGetGameList();

    console.log('\n' + '='.repeat(50));
    console.log('🎉 游戏管理功能测试完成');
    console.log('📊 测试总结:');
    console.log(`   现有游戏数量: ${finalGames.length}`);
    console.log(`   现有用户数量: ${existingUsers.length}`);
    console.log('✅ 所有核心功能测试完成');

  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:', error.message);
  }
};

// 运行测试
if (require.main === module) {
  console.log('🧪 游戏管理功能测试脚本');
  console.log('================================');
  console.log('此脚本将测试游戏管理的各项功能:');
  console.log('  - 用户登录');
  console.log('  - 获取游戏列表');
  console.log('  - 获取用户列表');
  console.log('  - 创建游戏');
  console.log('  - 更新游戏');
  console.log('  - 分配游戏权限');
  console.log('  - 获取用户游戏');
  console.log('  - 获取游戏用户');
  console.log('  - 删除游戏');
  console.log('================================');

  runTests()
    .then(() => {
      console.log('\n✅ 测试脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ 测试脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { runTests };