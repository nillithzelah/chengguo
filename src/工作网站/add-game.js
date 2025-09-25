#!/usr/bin/env node

/**
 * 游戏添加助手
 * 用法: node add-game.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

async function addGame() {
    console.log('🎮 游戏添加助手');
    console.log('================');

    try {
        // 读取现有的games.json
        const gamesPath = path.join(__dirname, 'games.json');
        let gamesData = { games: [], categories: ["全部", "益智", "冒险", "动作", "策略"] };

        if (fs.existsSync(gamesPath)) {
            const data = fs.readFileSync(gamesPath, 'utf8');
            gamesData = JSON.parse(data);
        }

        // 获取游戏信息
        const gameId = await askQuestion('游戏ID (用于文件夹名): ');
        const gameName = await askQuestion('游戏名称 (显示在网站上): ');
        const gamePreview = await askQuestion('预览图片路径 (可留空使用默认): ') || `https://via.placeholder.com/300x150?text=${encodeURIComponent(gameName)}`;
        const gameDescription = await askQuestion('游戏简介 (可留空): ') || '';
        const gameCategory = await askQuestion('游戏分类 (益智/冒险/动作/策略): ') || '益智';

        // 创建游戏对象
        const newGame = {
            id: gameId,
            name: gameName,
            preview: gamePreview,
            url: `games/${gameId}/index.html`,
            description: gameDescription || undefined,
            category: gameCategory,
            enabled: true
        };

        // 移除description如果为空
        if (!newGame.description) {
            delete newGame.description;
        }

        // 添加到游戏列表
        gamesData.games.push(newGame);

        // 创建游戏预览图片占位符
        const previewPath = path.join(__dirname, 'images', `${gameId}-preview.jpg`);
        const previewContent = `这是${gameName}的预览图片占位符文件。
请将你的实际游戏预览图片重命名为 ${gameId}-preview.jpg 并替换此文件。

推荐规格：
- 尺寸：300x200px 或 400x250px
- 格式：JPG, PNG, 或 WebP
- 文件大小：建议小于 100KB

这个图片会显示在游戏卡片的预览区域。`;

        // 确保images文件夹存在
        const imagesDir = path.join(__dirname, 'images');
        if (!fs.existsSync(imagesDir)) {
            fs.mkdirSync(imagesDir);
        }

        fs.writeFileSync(previewPath, previewContent, 'utf8');

        // 写入文件
        fs.writeFileSync(gamesPath, JSON.stringify(gamesData, null, 2), 'utf8');

        console.log('\n✅ 游戏添加成功！');
        console.log(`📁 游戏ID: ${gameId}`);
        console.log(`🎮 游戏名称: ${gameName}`);
        console.log(`🖼️ 预览图片: images/${gameId}-preview.jpg`);
        console.log(`📂 游戏路径: games/${gameId}/`);
        console.log('\n📝 下一步:');
        console.log(`1. 创建文件夹: games/${gameId}/`);
        console.log('2. 将你的Cocos游戏文件复制到该文件夹');
        console.log(`3. 替换预览图片: images/${gameId}-preview.jpg`);
        console.log('4. 启动服务器测试: npx http-server -p 8000');
        console.log('5. 访问网站: http://127.0.0.1:8000');

    } catch (error) {
        console.error('❌ 添加游戏失败:', error.message);
    } finally {
        rl.close();
    }
}

// 检查是否直接运行此脚本
if (require.main === module) {
    addGame();
}

module.exports = { addGame };