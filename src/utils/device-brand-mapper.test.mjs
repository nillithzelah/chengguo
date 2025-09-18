// 设备品牌映射测试
import { deviceBrandMapper, parseDeviceBrand, parseDeviceInfo } from './device-brand-mapper.js';

// 测试用例
const testCases = [
  // 荣耀手机测试
  { model: 'wv', expected: '荣耀' },
  { model: 'WV-123', expected: '荣耀' },
  { model: 'honor-50', expected: '荣耀' },
  { model: 'HONOR Magic5', expected: '荣耀' },

  // 华为手机测试
  { model: 'hw-123', expected: '华为' },
  { model: 'HUAWEI Mate 50', expected: '华为' },
  { model: 'kirin-9000', expected: '华为' },

  // 小米手机测试
  { model: 'MI 12', expected: '小米' },
  { model: 'Redmi K40', expected: '小米' },
  { model: 'Xiaomi 13', expected: '小米' },

  // 其他品牌测试
  { model: 'iPhone 14', expected: 'Apple' },
  { model: 'SM-G998B', expected: 'Samsung' },
  { model: 'PEEM00', expected: 'OPPO' },
  { model: 'V2056A', expected: 'vivo' },

  // 未知设备测试
  { model: 'unknown-device', expected: '未知品牌' },
  { model: '', expected: '未知品牌' },
  { model: null, expected: '未知品牌' }
];

console.log('🧪 开始测试设备品牌映射功能...\n');

// 运行测试
let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  const result = parseDeviceBrand(testCase.model);
  const success = result === testCase.expected;

  if (success) {
    passed++;
    console.log(`✅ 测试 ${index + 1}: "${testCase.model}" -> "${result}"`);
  } else {
    failed++;
    console.log(`❌ 测试 ${index + 1}: "${testCase.model}" -> 期望"${testCase.expected}"，实际"${result}"`);
  }
});

// 测试详细信息解析
console.log('\n📋 测试详细信息解析:');
const detailTestCases = ['wv', 'iPhone 14', 'MI 12', 'unknown'];

detailTestCases.forEach(model => {
  const info = parseDeviceInfo(model);
  console.log(`"${model}" -> 品牌: ${info.brand}, 友好型号: ${info.friendlyModel}, 识别: ${info.isRecognized}`);
});

// 测试结果统计
console.log(`\n📊 测试结果: 通过 ${passed} 个，失败 ${failed} 个`);

if (failed === 0) {
  console.log('🎉 所有测试通过！设备品牌映射功能正常工作。');
} else {
  console.log('⚠️ 部分测试失败，请检查映射逻辑。');
}

// 导出测试结果
export const testResults = {
  total: testCases.length,
  passed,
  failed,
  successRate: (passed / testCases.length * 100).toFixed(1) + '%'
};