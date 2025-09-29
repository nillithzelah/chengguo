#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

console.log('🔍 检查服务器tokens表状态...\n');

const dbPath = path.join(__dirname, '..', 'database.sqlite');

try {
  const sqlite3 = require('sqlite3').verbose();
  const db = new sqlite3.Database(dbPath);

  // 检查tokens表是否存在
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='tokens'", (err, row) => {
    if (err) {
      console.error('❌ 检查tokens表失败:', err);
      db.close();
      return;
    }

    if (!row) {
      console.log('❌ tokens表不存在');
      console.log('💡 请先运行: node scripts/init-db.js');
      db.close();
      return;
    }

    console.log('✅ tokens表存在');

    // 检查表结构
    db.all("PRAGMA table_info(tokens)", (err, columns) => {
      if (err) {
        console.error('❌ 获取表结构失败:', err);
        db.close();
        return;
      }

      console.log('\n📋 tokens表结构:');
      columns.forEach(col => {
        console.log(`  ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : 'NULL'}`);
      });

      // 检查是否有数据
      db.all("SELECT COUNT(*) as count FROM tokens", (err, rows) => {
        if (err) {
          console.error('❌ 查询数据数量失败:', err);
          db.close();
          return;
        }

        const count = rows[0].count;
        console.log(`\n📊 tokens表数据: ${count} 条记录`);

        if (count === 0) {
          console.log('⚠️  tokens表为空，没有任何token记录');
          console.log('💡 请先运行: node scripts/init-db.js');
          db.close();
          return;
        }

        // 查询所有token记录
        db.all(`
          SELECT id, platform, appid, token_type, is_active, expires_at, last_updated, createdAt, updatedAt
          FROM tokens
          ORDER BY id DESC
        `, (err, tokens) => {
          if (err) {
            console.error('❌ 查询token记录失败:', err);
            db.close();
            return;
          }

          console.log('\n📋 token记录详情:');
          tokens.forEach((token, index) => {
            const isExpired = token.expires_at && new Date(token.expires_at) <= new Date();
            const isActive = token.is_active === 1;

            console.log(`${index + 1}. ${token.platform} - ${token.token_type} (${token.appid})`);
            console.log(`   状态: ${isActive ? '✅ 激活' : '❌ 非激活'}`);
            console.log(`   过期: ${token.expires_at ? (isExpired ? '❌ 已过期' : '✅ 未过期') : '⚠️ 无过期时间'}`);
            console.log(`   更新时间: ${token.last_updated || token.updatedAt}`);
            console.log('');
          });

          // 检查是否有有效的access_token
          const validAccessTokens = tokens.filter(token =>
            token.token_type === 'access_token' &&
            token.is_active === 1 &&
            (!token.expires_at || new Date(token.expires_at) > new Date())
          );

          console.log(`🔍 有效access_token数量: ${validAccessTokens.length}`);

          if (validAccessTokens.length === 0) {
            console.log('⚠️  没有有效的access_token，这可能是广告预览二维码API失败的原因');
            console.log('💡 建议:');
            console.log('   1. 检查tokens数据是否正确导入');
            console.log('   2. 运行: node scripts/init-db.js');
            console.log('   3. 或者在前端配置正确的环境变量');
          } else {
            console.log('✅ 存在有效的access_token');
            validAccessTokens.forEach(token => {
              console.log(`   - ${token.platform}: ${token.appid}`);
            });
          }

          db.close();
          console.log('\n🎉 tokens表检查完成');
        });
      });
    });
  });

} catch (error) {
  console.error('❌ 检查失败:', error.message);
}