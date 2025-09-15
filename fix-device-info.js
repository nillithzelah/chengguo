// 修复设备信息获取的备用方案
// 可以添加到前端项目中作为备选API

// 备用IP获取服务
const backupIpServices = [
  'https://api.myip.com',  // 备选
  'https://ip.seeip.org/jsonip',  // 备选
  'https://api.ip.sb/jsonip',  // 备选
];

// 备用地理位置服务
const backupGeoServices = [
  {
    name: 'ipinfo.io',
    url: 'https://ipinfo.io/json',
    getCity: (data) => data.city
  },
  {
    name: 'ipapi.com',
    url: 'https://ipapi.com/json/',
    getCity: (data) => data.city
  },
  {
    name: 'freegeoip.app',
    url: 'https://freegeoip.app/json/',
    getCity: (data) => data.city
  }
];

// 可以在浏览器控制台中测试这些API
console.log('备用IP服务:', backupIpServices);
console.log('备用地理位置服务:', backupGeoServices);

// 测试函数
async function testBackupApis() {
  console.log('🧪 测试备用API...');

  // 测试IP服务
  for (const service of backupIpServices) {
    try {
      console.log(`测试 ${service}...`);
      const response = await fetch(service);
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${service}:`, data);
      } else {
        console.log(`❌ ${service}: HTTP ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${service}:`, error.message);
    }
  }

  // 测试地理位置服务
  for (const service of backupGeoServices) {
    try {
      console.log(`测试 ${service.name}...`);
      const response = await fetch(service.url);
      if (response.ok) {
        const data = await response.json();
        const city = service.getCity(data);
        console.log(`✅ ${service.name}: 城市=${city}`, data);
      } else {
        console.log(`❌ ${service.name}: HTTP ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${service.name}:`, error.message);
    }
  }
}

// 在浏览器控制台中运行: testBackupApis()
window.testBackupApis = testBackupApis;