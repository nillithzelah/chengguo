#!/usr/bin/env node

/**
 * 游戏添加助手 - 自动化版本
 * 用法:
 *   node add-game.js                           # 交互式添加
 *   node add-game.js --auto "游戏名称" "分类"   # 自动添加（从图片文件名生成）
 *   node add-game.js --scan                    # 扫描images目录，自动添加新图片
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 解析命令行参数
const args = process.argv.slice(2);
const isAutoMode = args.includes('--auto');
const isScanMode = args.includes('--scan');

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

// 获取images目录中的图片文件
function getImageFiles() {
    const imagesDir = path.join(__dirname, 'images');
    if (!fs.existsSync(imagesDir)) {
        return [];
    }

    return fs.readdirSync(imagesDir)
        .filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.png', '.jpg', '.jpeg', '.webp', '.mp4', '.webm', '.ogg', '.avi', '.mov', '.m4v'].includes(ext);
        })
        .map(file => ({
            filename: file,
            name: path.parse(file).name,
            ext: path.extname(file).toLowerCase(),
            path: path.join(imagesDir, file)
        }));
}

// 从文件名生成游戏ID
function generateGameId(gameName, existingIds) {
    let baseId = gameName.toLowerCase()
        .replace(/[^\w\u4e00-\u9fa5]/g, '') // 只保留字母、数字、中文
        .substring(0, 20); // 限制长度

    let id = baseId;
    let counter = 1;

    while (existingIds.includes(id)) {
        id = `${baseId}${counter}`;
        counter++;
    }

    return id;
}

// 智能分类游戏
function categorizeGame(gameName) {
    const name = gameName.toLowerCase();

    if (name.includes('消除') || name.includes('连连看') || name.includes('2048') ||
        name.includes('找茬') || name.includes('答题') || name.includes('清理') ||
        name.includes('合成') || name.includes('萌') || name.includes('益智')) {
        return '益智';
    }

    if (name.includes('冒险') || name.includes('传奇') || name.includes('神话') ||
        name.includes('仙侠') || name.includes('神') || name.includes('游') ||
        name.includes('农场') || name.includes('农村') || name.includes('森林')) {
        return '冒险';
    }

    if (name.includes('赛车') || name.includes('坦克') || name.includes('塔防') ||
        name.includes('策略') || name.includes('竞技') || name.includes('狂飙') ||
        name.includes('冲刺') || name.includes('杀') || name.includes('动作')) {
        return '动作';
    }

    if (name.includes('策略') || name.includes('塔防') || name.includes('银河') ||
        name.includes('世界') || name.includes('一箱') || name.includes('2048')) {
        return '策略';
    }

    return '益智'; // 默认分类
}

// 扫描模式：自动添加新图片
async function scanAndAddGames() {
    console.log('🔍 扫描模式：自动检测新游戏图片');
    console.log('================================');

    try {
        // 读取现有的games.json
        const gamesPath = path.join(__dirname, 'games.json');
        let gamesData = { games: [], categories: ["全部", "益智", "冒险", "动作", "策略"] };

        if (fs.existsSync(gamesPath)) {
            const data = fs.readFileSync(gamesPath, 'utf8');
            gamesData = JSON.parse(data);
        }

        const existingIds = gamesData.games.map(game => game.id);
        const existingPreviews = gamesData.games.map(game => game.preview);
        const imageFiles = getImageFiles();

        console.log(`📁 发现 ${imageFiles.length} 个图片文件`);

        let addedCount = 0;

        for (const imageFile of imageFiles) {
            // 检查是否已经存在
            const previewPath = `images/${imageFile.filename}`;
            if (existingPreviews.includes(previewPath)) {
                console.log(`⏭️  跳过已存在的图片: ${imageFile.filename}`);
                continue;
            }

            // 生成游戏ID
            const gameId = generateGameId(imageFile.name, existingIds);
            const gameName = imageFile.name;
            const gameCategory = categorizeGame(gameName);

            // 创建游戏对象
            const newGame = {
                id: gameId,
                name: gameName,
                preview: previewPath,
                url: `games/${gameId}/index.html`,
                category: gameCategory,
                enabled: true
            };

            // 添加到游戏列表
            gamesData.games.push(newGame);
            existingIds.push(gameId);
            existingPreviews.push(previewPath);

            console.log(`✅ 添加游戏: ${gameName} (ID: ${gameId}, 分类: ${gameCategory})`);
            addedCount++;
        }

        if (addedCount > 0) {
            // 写入文件
            fs.writeFileSync(gamesPath, JSON.stringify(gamesData, null, 2), 'utf8');
            console.log(`\n🎉 成功添加 ${addedCount} 个新游戏！`);
            console.log('\n📝 接下来你需要:');
            console.log('1. 启动服务器测试: npx http-server -p 8000');
            console.log('2. 访问网站查看新游戏: http://127.0.0.1:8000');
        } else {
            console.log('\n📋 没有发现新的游戏图片，所有图片都已添加到游戏列表中。');
        }

    } catch (error) {
        console.error('❌ 扫描添加失败:', error.message);
    }
}

// 自动模式：从命令行参数添加
async function autoAddGame(gameName, category) {
    console.log('🤖 自动模式：快速添加游戏');
    console.log('========================');

    try {
        // 读取现有的games.json
        const gamesPath = path.join(__dirname, 'games.json');
        let gamesData = { games: [], categories: ["全部", "益智", "冒险", "动作", "策略"] };

        if (fs.existsSync(gamesPath)) {
            const data = fs.readFileSync(gamesPath, 'utf8');
            gamesData = JSON.parse(data);
        }

        const existingIds = gamesData.games.map(game => game.id);
        const gameId = generateGameId(gameName, existingIds);
        const gameCategory = category || categorizeGame(gameName);

        // 检查图片是否存在
        const imageFiles = getImageFiles();
        const imageFile = imageFiles.find(img => img.name === gameName);

        let previewPath;
        if (imageFile) {
            previewPath = `images/${imageFile.filename}`;
            console.log(`🖼️  找到匹配的图片: ${imageFile.filename}`);
        } else {
            previewPath = `https://via.placeholder.com/300x150?text=${encodeURIComponent(gameName)}`;
            console.log(`⚠️  未找到图片，使用占位符: ${previewPath}`);
        }

        // 创建游戏对象
        const newGame = {
            id: gameId,
            name: gameName,
            preview: previewPath,
            url: `games/${gameId}/index.html`,
            category: gameCategory,
            enabled: true
        };

        // 添加到游戏列表
        gamesData.games.push(newGame);

        // 写入文件
        fs.writeFileSync(gamesPath, JSON.stringify(gamesData, null, 2), 'utf8');

        console.log('\n✅ 游戏添加成功！');
        console.log(`📁 游戏ID: ${gameId}`);
        console.log(`🎮 游戏名称: ${gameName}`);
        console.log(`🖼️ 预览图片: ${previewPath}`);
        console.log(`📂 游戏路径: games/${gameId}/`);
        console.log(`🏷️  分类: ${gameCategory}`);

        if (!imageFile) {
            console.log('\n💡 提示: 请将游戏预览图片放到 images/ 目录下，命名为相应的文件名');
        }

    } catch (error) {
        console.error('❌ 自动添加失败:', error.message);
    }
}

// 交互式添加（原有功能）
async function interactiveAddGame() {
    console.log('🎮 游戏添加助手 - 交互模式');
    console.log('==========================');

    try {
        // 读取现有的games.json
        const gamesPath = path.join(__dirname, 'games.json');
        let gamesData = { games: [], categories: ["全部", "益智", "冒险", "动作", "策略"] };

        if (fs.existsSync(gamesPath)) {
            const data = fs.readFileSync(gamesPath, 'utf8');
            gamesData = JSON.parse(data);
        }

        // 显示可用的图片
        const imageFiles = getImageFiles();
        if (imageFiles.length > 0) {
            console.log('\n📸 可用的图片文件:');
            imageFiles.forEach((img, index) => {
                console.log(`  ${index + 1}. ${img.filename}`);
            });
            console.log('');
        }

        // 获取游戏信息
        const gameId = await askQuestion('游戏ID (用于文件夹名，直接回车自动生成): ');
        const gameName = await askQuestion('游戏名称 (显示在网站上): ');

        if (!gameName.trim()) {
            console.log('❌ 游戏名称不能为空');
            rl.close();
            return;
        }

        const existingIds = gamesData.games.map(game => game.id);
        const finalGameId = gameId.trim() || generateGameId(gameName, existingIds);

        // 查找匹配的图片
        const matchedImage = imageFiles.find(img => img.name === gameName);
        const defaultPreview = `https://via.placeholder.com/300x150?text=${encodeURIComponent(gameName)}`;
        const gamePreview = matchedImage ? `images/${matchedImage.filename}` : defaultPreview;

        const gameDescription = await askQuestion('游戏简介 (可留空): ') || '';
        const gameCategory = await askQuestion('游戏分类 (益智/冒险/动作/策略，直接回车自动分类): ') || categorizeGame(gameName);

        // 创建游戏对象
        const newGame = {
            id: finalGameId,
            name: gameName,
            preview: gamePreview,
            url: `games/${finalGameId}/index.html`,
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

        // 写入文件
        fs.writeFileSync(gamesPath, JSON.stringify(gamesData, null, 2), 'utf8');

        console.log('\n✅ 游戏添加成功！');
        console.log(`📁 游戏ID: ${finalGameId}`);
        console.log(`🎮 游戏名称: ${gameName}`);
        console.log(`🖼️ 预览图片: ${gamePreview}`);
        console.log(`📂 游戏路径: games/${finalGameId}/`);
        console.log(`🏷️  分类: ${gameCategory}`);

        if (matchedImage) {
            console.log('🖼️  已自动匹配到图片文件');
        } else {
            console.log('\n💡 提示: 请将游戏预览图片放到 images/ 目录下，命名为相应的文件名');
        }

        console.log('\n📝 下一步:');
        console.log('1. 启动服务器测试: npx http-server -p 8000');
        console.log('2. 访问网站: http://127.0.0.1:8000');

    } catch (error) {
        console.error('❌ 添加游戏失败:', error.message);
    } finally {
        rl.close();
    }
}

// 主函数
async function main() {
    if (isScanMode) {
        await scanAndAddGames();
    } else if (isAutoMode) {
        const gameName = args[args.indexOf('--auto') + 1];
        const category = args[args.indexOf('--auto') + 2];

        if (!gameName) {
            console.log('❌ 请提供游戏名称: node add-game.js --auto "游戏名称" [分类]');
            process.exit(1);
        }

        await autoAddGame(gameName, category);
    } else {
        await interactiveAddGame();
    }
}

// 检查是否直接运行此脚本
if (require.main === module) {
    main();
}

module.exports = { addGame: interactiveAddGame, autoAddGame, scanAndAddGames };