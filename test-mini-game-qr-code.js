#!/usr/bin/env node

/**
 * 测试脚本：抖音小程序游戏二维码创建API
 * 测试端点：/api/douyin/mini-game/create-qr-code
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 配置
const BASE_URL = 'http://localhost:3000'; // 根据实际服务器地址修改
const TEST_APP_ID = 'tt8c62fadf136c334702'; // 使用实际的测试App ID
const TEST_APP_SECRET = '7ad00307b2596397ceeee3560ca8bfc9b3622476'; // 使用实际的测试App Secret
const TEST_ACCESS_TOKEN = "0801121847473333625745307941764b2b3139474d4b782f2f513d3d"

// 测试用例 - 只使用固定的access_token，不获取新的token
const testCases = [
  {
    name: '使用固定Access Token创建二维码',
    params: {
      access_token: TEST_ACCESS_TOKEN,
      appname: 'douyin',
      path: 'pages/index/index',
      width: 430
    }
  },
  {
    name: '创建头条平台二维码',
    params: {
      access_token: TEST_ACCESS_TOKEN,
      appname: 'toutiao',
      path: 'pages/game/game',
      width: 280
    }
  },
  {
    name: '创建抖音平台二维码',
    params: {
      access_token: TEST_ACCESS_TOKEN,
      appname: 'douyin',
      path: 'pages/index/index',
      width: 430
    }
  },
  {
    name: '创建透明背景二维码',
    params: {
      access_token: TEST_ACCESS_TOKEN,
      appname: 'douyin',
      path: '',
      width: 640,
      is_hyaline: true
    }
  },
  {
    name: '自定义颜色二维码',
    params: {
      access_token: TEST_ACCESS_TOKEN,
      appname: 'douyin',
      path: 'pages/test/test',
      width: 500,
      auto_color: false,
      line_color: { r: 255, g: 0, b: 0 } // 红色
    }
  }
];

// 工具函数：保存二维码图片
function saveQrCodeImage(buffer, filename) {
  const outputDir = path.join(__dirname, 'test-output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filePath = path.join(outputDir, filename);
  fs.writeFileSync(filePath, buffer);
  console.log(`✅ 二维码图片已保存: ${filePath}`);
  return filePath;
}

// 工具函数：格式化响应
function formatResponse(response) {
  if (response.data && typeof response.data === 'object') {
    return JSON.stringify(response.data, null, 2);
  }
  // 如果是Buffer，尝试转换为可读的中文字符串
  if (Buffer.isBuffer(response.data)) {
    try {
      return response.data.toString('utf8');
    } catch (e) {
      return response.data;
    }
  }
  return response.data;
}

// 主测试函数
async function runTest(testCase) {
  console.log(`\n🧪 开始测试: ${testCase.name}`);
  console.log('📋 请求参数:', JSON.stringify(testCase.params, null, 2));

  try {
    const response = await axios.post(
      `${BASE_URL}/api/douyin/mini-game/create-qr-code`,
      testCase.params,
      {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer' // 重要：设置为arraybuffer以处理可能的二进制响应
      }
    );

    console.log(`📥 响应状态: ${response.status}`);
    console.log(`📋 响应头 Content-Type: ${response.headers['content-type']}`);

    // 检查是否是PNG图像响应
    if (response.headers['content-type'] && response.headers['content-type'].includes('image/png')) {
      console.log('🖼️ 检测到PNG图像响应');

      // 生成文件名
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `qr-code-${testCase.name.replace(/[^a-zA-Z0-9]/g, '-')}-${timestamp}.png`;

      // 保存图片
      const filePath = saveQrCodeImage(response.data, filename);

      console.log('✅ 测试通过：成功生成二维码图片');
      return {
        success: true,
        type: 'image',
        filePath: filePath,
        size: response.data.length
      };

    } else {
      // JSON响应
      let responseData;
      try {
        responseData = JSON.parse(Buffer.from(response.data).toString('utf8'));
        console.log('📄 JSON响应内容:');
        console.log(formatResponse({ data: responseData }));

        if (responseData.code === 0) {
          console.log('✅ 测试通过：API返回成功');
          return {
            success: true,
            type: 'json',
            data: responseData
          };
        } else {
          console.log('❌ 测试失败：API返回错误');
          return {
            success: false,
            type: 'json',
            error: responseData.message || '未知错误',
            data: responseData
          };
        }

      } catch (parseError) {
        console.log('❌ 解析响应失败:', parseError.message);
        console.log('📄 原始响应:', Buffer.from(response.data).toString('utf8'));
        return {
          success: false,
          type: 'unknown',
          error: '响应格式错误',
          raw: Buffer.from(response.data).toString('utf8')
        };
      }
    }

  } catch (error) {
    console.log('❌ 测试失败：网络请求错误');

    if (error.response) {
      console.log(`📄 错误状态: ${error.response.status}`);
      console.log(`📋 错误响应:`, formatResponse(error.response));

      // 尝试解析错误响应中的中文消息
      try {
        const errorText = Buffer.from(error.response.data).toString('utf8');
        const errorJson = JSON.parse(errorText);
        console.log('📋 解析后的错误信息:');
        console.log(`   错误: ${errorJson.error || '未知错误'}`);
        console.log(`   消息: ${errorJson.message || '无消息'}`);
        if (errorJson.details) {
          console.log(`   详情:`, errorJson.details);
        }
      } catch (parseError) {
        console.log('❌ 无法解析错误响应');
      }
    } else {
      console.log(`💥 错误信息: ${error.message}`);
    }

    return {
      success: false,
      error: error.message,
      status: error.response?.status
    };
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('🚀 开始运行抖音小程序游戏二维码创建API测试');
  console.log('=' .repeat(60));

  const results = [];

  for (const testCase of testCases) {
    const result = await runTest(testCase);
    results.push({
      name: testCase.name,
      ...result
    });

    // 测试间隔
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // 输出测试总结
  console.log('\n' + '=' .repeat(60));
  console.log('📊 测试总结:');

  const passed = results.filter(r => r.success).length;
  const total = results.length;

  console.log(`✅ 通过: ${passed}/${total}`);
  console.log(`❌ 失败: ${total - passed}/${total}`);

  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${index + 1}. ${result.name}`);
    if (!result.success && result.error) {
      console.log(`   错误: ${result.error}`);
    }
    if (result.type === 'image' && result.filePath) {
      console.log(`   图片: ${result.filePath}`);
    }
  });

  console.log('\n🎉 测试完成！');

  // 如果有失败的测试，退出码为1
  if (passed < total) {
    process.exit(1);
  }
}

// 检查服务器是否运行
async function checkServer() {
  try {
    console.log('🔍 检查服务器状态...');
    const response = await axios.get(`${BASE_URL}/api/health`, { timeout: 5000 });
    console.log('✅ 服务器运行正常');
    return true;
  } catch (error) {
    console.log('❌ 服务器未运行或无法访问');
    console.log('💡 请确保服务器已启动并监听正确的端口');
    return false;
  }
}

// 主函数
async function main() {
  // 检查服务器状态
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log('❌ 退出测试：服务器不可用');
    process.exit(1);
  }

  // 检查配置
  if (TEST_ACCESS_TOKEN === 'your_valid_access_token_here') {
    console.log('⚠️ 警告：请在脚本中配置有效的TEST_ACCESS_TOKEN');
    console.log('   测试将使用固定的access_token进行二维码创建');
    console.log('   当前测试会失败，请先设置有效的token');
  }

  // 运行测试
  await runAllTests();
}

// 运行主函数
if (require.main === module) {
  main().catch(error => {
    console.error('💥 测试脚本执行失败:', error);
    process.exit(1);
  });
}

module.exports = { runTest, runAllTests };