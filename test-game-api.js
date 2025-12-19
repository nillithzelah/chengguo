const fetch = require('node-fetch');

async function testGameAPI() {
  try {
    // 首先登录获取token
    const loginResponse = await fetch('http://localhost:3000/api/user/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin', // 或者其他用户名
        password: 'admin123' // 或者其他密码
      })
    });

    const loginResult = await loginResponse.json();
    console.log('登录结果:', loginResult);

    if (!loginResult.data || !loginResult.data.token) {
      console.error('登录失败');
      return;
    }

    const token = loginResult.data.token;

    // 测试游戏列表API
    const gameResponse = await fetch('http://localhost:3000/api/game/list', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const gameResult = await gameResponse.json();
    console.log('游戏列表API响应:');
    console.log('状态码:', gameResponse.status);
    console.log('响应数据:', JSON.stringify(gameResult, null, 2));

    if (gameResult.code === 20000 && gameResult.data && gameResult.data.games) {
      console.log(`成功获取 ${gameResult.data.games.length} 个游戏`);
      gameResult.data.games.forEach((game, index) => {
        console.log(`${index + 1}. ${game.name} (ID: ${game.id}, AppID: ${game.appid})`);
        console.log(`   app_secret: ${game.app_secret ? '存在' : '不存在'}`);
        console.log(`   entity_name: ${game.entity_name || '无'}`);
      });
    } else {
      console.log('获取游戏列表失败:', gameResult.message);
    }

  } catch (error) {
    console.error('测试失败:', error);
  }
}

testGameAPI();