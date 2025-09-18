// 创建用户设备表
const { sequelize } = require('../config/database');

async function createUserDevicesTable() {
  try {
    console.log('📡 连接数据库...');
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    // 创建user_devices表的SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS user_devices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        device_id VARCHAR(100) NOT NULL,
        device_brand VARCHAR(50),
        device_model VARCHAR(100),
        friendly_model VARCHAR(100),
        platform VARCHAR(50),
        browser_name VARCHAR(50),
        browser_version VARCHAR(50),
        os_name VARCHAR(50),
        os_version VARCHAR(50),
        device_type TEXT CHECK(device_type IN ('mobile', 'tablet', 'desktop')),
        screen_width INTEGER,
        screen_height INTEGER,
        screen_pixel_ratio DECIMAL(3,2),
        viewport_width INTEGER,
        viewport_height INTEGER,
        language VARCHAR(10),
        timezone VARCHAR(50),
        user_agent TEXT,
        ip_address VARCHAR(45),
        is_current_device BOOLEAN DEFAULT FALSE NOT NULL,
        last_login_at DATETIME,
        login_count INTEGER DEFAULT 1 NOT NULL,
        environment TEXT CHECK(environment IN ('web_browser', 'mobile_app', 'mini_program')) DEFAULT 'web_browser' NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,

        -- 外键约束
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

        -- 唯一约束
        UNIQUE(user_id, device_id)
      );
    `;

    // 创建索引的SQL
    const createIndexSQLs = [
      `CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);`,
      `CREATE INDEX IF NOT EXISTS idx_user_devices_device_id ON user_devices(device_id);`,
      `CREATE INDEX IF NOT EXISTS idx_user_devices_device_brand ON user_devices(device_brand);`,
      `CREATE INDEX IF NOT EXISTS idx_user_devices_device_type ON user_devices(device_type);`,
      `CREATE INDEX IF NOT EXISTS idx_user_devices_last_login_at ON user_devices(last_login_at);`,
      `CREATE INDEX IF NOT EXISTS idx_user_devices_is_current_device ON user_devices(is_current_device);`
    ];

    console.log('🏗️ 创建user_devices表...');
    await sequelize.query(createTableSQL);
    console.log('✅ user_devices表创建成功');

    // 创建索引
    console.log('🏗️ 创建索引...');
    for (const indexSQL of createIndexSQLs) {
      try {
        await sequelize.query(indexSQL);
        console.log('✅ 索引创建成功:', indexSQL.split(' ON ')[1].split('(')[0]);
      } catch (indexError) {
        console.warn('⚠️ 索引创建失败:', indexError.message);
      }
    }
    console.log('✅ 索引创建完成');

    // 检查表是否创建成功
    const [results] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table' AND name='user_devices'");
    if (results.length > 0) {
      console.log('✅ 确认user_devices表存在');
    } else {
      console.log('❌ user_devices表创建失败');
    }

  } catch (error) {
    console.error('❌ 创建表失败:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('📡 数据库连接已关闭');
  }
}

// 运行脚本
if (require.main === module) {
  createUserDevicesTable()
    .then(() => {
      console.log('🎉 脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = createUserDevicesTable;