// Node.js 18+ 支持内置fetch，不需要额外安装

async function testRemoteGameUpdate() {
  try {
    console.log('🔐 正在登录远程服务器获取token...');

    // 登录获取token
    const loginResponse = await fetch('https://ecpm.game985.vip/api/user/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'Admin123!'
      })
    });

    const loginResult = await loginResponse.json();
    console.log('登录响应:', {
      status: loginResponse.status,
      code: loginResult.code,
      message: loginResult.message
    });

    if (!loginResult.data || !loginResult.data.token) {
      console.error('❌ 登录失败，无法获取token');
      return;
    }

    const token = loginResult.data.token;
    console.log('✅ 成功获取token');

    // 获取游戏列表，找到一个游戏来测试更新
    console.log('📋 获取游戏列表...');
    const gameListResponse = await fetch('https://ecpm.game985.vip/api/game/list', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const gameListResult = await gameListResponse.json();
    console.log('游戏列表响应状态:', gameListResponse.status);

    if (gameListResult.code !== 20000 || !gameListResult.data?.games?.length) {
      console.error('❌ 获取游戏列表失败:', gameListResult.message);
      return;
    }

    const firstGame = gameListResult.data.games[0];
    console.log('🎮 选择第一个游戏进行测试:', {
      id: firstGame.id,
      name: firstGame.name,
      appid: firstGame.appid,
      current_app_secret: firstGame.app_secret ? '存在' : '不存在'
    });

    // 测试更新游戏API
    console.log('🔄 测试更新游戏API...');

    const testAppSecret = 'test_app_secret_' + Date.now(); // 生成测试用的App Secret

    const updateResponse = await fetch(`https://ecpm.game985.vip/api/game/update/${firstGame.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: firstGame.name,
        appid: firstGame.appid,
        appSecret: testAppSecret,
        description: firstGame.description || '测试更新'
      })
    });

    const updateResult = await updateResponse.json();
    console.log('更新游戏API响应:', {
      status: updateResponse.status,
      code: updateResult.code,
      message: updateResult.message
    });

    if (updateResult.code === 20000) {
      console.log('✅ 更新游戏成功');

      // 再次获取游戏列表，验证app_secret是否已更新
      console.log('🔍 验证更新结果...');
      const verifyResponse = await fetch('https://ecpm.game985.vip/api/game/list', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const verifyResult = await verifyResponse.json();

      if (verifyResult.code === 20000 && verifyResult.data?.games) {
        const updatedGame = verifyResult.data.games.find(g => g.id === firstGame.id);

        if (updatedGame) {
          console.log('📊 更新后的游戏信息:', {
            id: updatedGame.id,
            name: updatedGame.name,
            appid: updatedGame.appid,
            app_secret: updatedGame.app_secret,
            app_secret_matches: updatedGame.app_secret === testAppSecret
          });

          if (updatedGame.app_secret === testAppSecret) {
            console.log('🎉 成功！app_secret字段已正确更新');
          } else {
            console.log('❌ 失败！app_secret字段更新不正确');
            console.log('期望值:', testAppSecret);
            console.log('实际值:', updatedGame.app_secret);
          }
        } else {
          console.log('❌ 找不到更新后的游戏');
        }
      } else {
        console.log('❌ 验证更新结果失败:', verifyResult.message);
      }

    } else {
      console.log('❌ 更新游戏失败:', updateResult.message);
    }

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
    console.error('错误详情:', error);
  }
}

testRemoteGameUpdate();