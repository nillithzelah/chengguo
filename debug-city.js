// 调试城市获取功能的代码
// 可以在浏览器控制台中运行

async function debugCityFetching() {
  console.log('🔍 开始调试城市获取...');

  // 1. 测试IP获取
  console.log('1. 测试IP获取...');
  try {
    const ipResponse = await fetch('https://api.ipify.org?format=json');
    const ipData = await ipResponse.json();
    console.log('✅ IP获取成功:', ipData);
  } catch (error) {
    console.error('❌ IP获取失败:', error);
  }

  // 2. 测试城市API - ip-api.com
  console.log('\n2. 测试 ip-api.com...');
  try {
    const cityResponse1 = await fetch('http://ip-api.com/json/');
    const cityData1 = await cityResponse1.json();
    console.log('✅ ip-api.com 响应:', cityData1);
    console.log('城市字段解析:', {
      city: cityData1.city,
      regionName: cityData1.regionName,
      country: cityData1.country
    });
  } catch (error) {
    console.error('❌ ip-api.com 失败:', error);
  }

  // 3. 测试城市API - ipapi.co
  console.log('\n3. 测试 ipapi.co...');
  try {
    const cityResponse2 = await fetch('https://ipapi.co/json/');
    const cityData2 = await cityResponse2.json();
    console.log('✅ ipapi.co 响应:', cityData2);
    console.log('城市字段解析:', {
      city: cityData2.city,
      region: cityData2.region,
      country_name: cityData2.country_name
    });
  } catch (error) {
    console.error('❌ ipapi.co 失败:', error);
  }

  // 4. 模拟代码中的城市解析逻辑
  console.log('\n4. 测试城市解析逻辑...');

  const mockData1 = {"status":"success","country":"China","countryCode":"CN","region":"GD","regionName":"Guangdong","city":"Shenzhen","zip":"","lat":22.5455,"lon":114.0683,"timezone":"Asia/Shanghai","isp":"Addresses CNNIC","org":"Aliyun Computing Co., LTD","as":"AS37963 Hangzhou Alibaba Advertising Co.,Ltd.","query":"47.115.94.203"};
  const mockData2 = {"ip":"47.115.94.203","network":"47.115.0.0/16","version":"IPv4","city":"Shenzhen","region":"Guangdong","region_code":"GD","country":"CN","country_name":"China","country_code":"CN","country_code_iso3":"CHN","country_capital":"Beijing","country_tld":".cn","continent_code":"AS","in_eu":false,"postal":"518000","latitude":22.5333,"longitude":114.1333,"timezone":"Asia/Shanghai","utc_offset":"+0800","country_calling_code":"+86","currency":"CNY","currency_name":"Yuan Renminbi","languages":"zh-CN,yue,wuu,dta,ug,za","country_area":9596961,"country_population":1411778724,"asn":"AS37963","org":"Hangzhou Alibaba Advertising Co.,Ltd."};

  // 测试解析函数
  function getCityFromIpApi(data) {
    return data.city || data.regionName;
  }

  function getCityFromIpApiCo(data) {
    return data.city || data.region || data.country_name;
  }

  console.log('ip-api.com 解析结果:', getCityFromIpApi(mockData1));
  console.log('ipapi.co 解析结果:', getCityFromIpApiCo(mockData2));

  console.log('\n🔍 调试完成');
}

// 在浏览器控制台中运行
debugCityFetching();

// 也可以直接调用
window.debugCityFetching = debugCityFetching;