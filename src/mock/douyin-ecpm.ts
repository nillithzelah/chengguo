// Mock eCPM 数据 (扩展自现有，添加来源、IP、城市、手机品牌、手机型号)
import Mock from 'mockjs';

const Random = Mock.Random;

const generateRecord = (index) => {
  return {
    id: index,
    event_time: Random.datetime(),
    event_name: Random.pick(['ad_show', 'ad_click', 'ad_close', 'ad_detail']),
    open_id: 'open_id_' + Random.id(),
    aid: 'aid_' + Random.id(),
    cost: Random.integer(100, 10000),
    source: Random.pick(['douyin', 'toutiao', 'wechat']),
    username: '用户' + Random.integer(1000, 9999),
    ip: Random.ip(),
    city: Random.city(true),
    phone_brand: Random.pick(['Apple', 'Samsung', '华为', '荣耀', '小米', 'OPPO', 'vivo']),
    phone_model: Random.pick(['iPhone 14', 'Galaxy S22', 'Mate 40', 'Mi 12', 'Find X5', 'Y75'])
  };
};

export default {
  'GET /api/douyin/ecpm': (req, res) => {
    const records = Mock.mock({
      'data|50': [{
        ...generateRecord(),
        revenue: 0  // 后端计算
      }]
    }).data;

    res.json({
      code: 0,
      message: 'success',
      data: {
        records,
        total: 50,
        page_no: 1,
        page_size: 50
      }
    });
  }
};