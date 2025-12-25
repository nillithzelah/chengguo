const axios = require('axios');

// 测试entity update API
async function testEntityUpdate() {
  try {
    // 首先登录获取token
    console.log('正在登录...');
    const loginResponse = await axios.post('https://ecpm.game985.vip/api/user/login', {
      username: 'nillithzelah',
      password: 'Admin123!'
    });

    const token = loginResponse.data.data.token;
    console.log('登录成功，token:', token.substring(0, 20) + '...');

    // 尝试更新entity 119
    console.log('正在更新entity 119...');
    const updateResponse = await axios.put('https://ecpm.game985.vip/api/entity/update/119', {
      name: 'W09.任鹏XY',
      programmer: '张',
      manager: '测试管理者'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('更新成功:', updateResponse.data);

  } catch (error) {
    console.error('请求失败:');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('响应数据:', error.response.data);
      console.error('响应头:', error.response.headers);
    } else if (error.request) {
      console.error('请求错误:', error.request);
    } else {
      console.error('错误信息:', error.message);
    }
  }
}

testEntityUpdate();