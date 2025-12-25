const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

console.log('查询游戏ID 114的数据...');

db.get('SELECT id, name, appid, app_secret, description, status, validated FROM games WHERE id = 114', (err, row) => {
  if (err) {
    console.error('查询失败:', err);
  } else if (row) {
    console.log('游戏ID 114 的数据:');
    console.log('ID:', row.id);
    console.log('Name:', row.name);
    console.log('AppID:', row.appid);
    console.log('App Secret:', row.app_secret);
    console.log('Description:', row.description);
    console.log('Status:', row.status);
    console.log('Validated:', row.validated);
  } else {
    console.log('未找到ID为114的游戏');
  }
  db.close();
});