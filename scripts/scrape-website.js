const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

const url = 'http://qgames.qingningyule.cn/';

async function scrape() {
    let browser;
    try {
        console.log('Launching browser...');
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
        });
        const page = await browser.newPage();

        console.log('Navigating to webpage...');
        await page.goto(url, { waitUntil: 'networkidle2' });

        // 等待页面加载完成，可能需要额外等待动态内容
        await new Promise(resolve => setTimeout(resolve, 5000));

        // 获取渲染后的HTML
        const html = await page.content();

        // 创建输出目录
        const outputDir = path.join(__dirname, '..', 'scraped-data');
        await fs.ensureDir(outputDir);

        // 清理HTML，移除外部链接并创建独立的HTML
        const $ = cheerio.load(html);

        // 移除所有外部script和link标签
        $('script[src]').remove();
        $('link[rel="stylesheet"]').remove();
        $('link[rel="preload"]').remove();

        // 添加基础样式
        const basicStyles = `
        <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #000; color: #fff; }
        .game-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; }
        .game-card { border: 1px solid #333; padding: 10px; border-radius: 8px; background: #111; }
        .game-title { font-size: 14px; margin-top: 10px; text-align: center; }
        </style>
        `;

        // 提取主要内容
        const mainContent = $('main').html() || $('body').html();

        // 创建独立的HTML
        const cleanHtml = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>GameCenter - 游戏中心 (离线版本)</title>
    ${basicStyles}
</head>
<body>
    <h1 style="text-align: center; margin-bottom: 30px;">游戏中心</h1>
    <div class="game-grid">
        ${$('h3').map((i, el) => `<div class="game-card"><div class="game-title">${$(el).text()}</div></div>`).get().join('')}
    </div>
</body>
</html>`;

        // 保存清理后的HTML结构
        await fs.writeFile(path.join(outputDir, 'structure.html'), cleanHtml);
        console.log('HTML structure saved.');

        // 提取游戏信息（名称和图片URL）
        const games = await page.evaluate(() => {
            const gameCards = document.querySelectorAll('.group.overflow-hidden');
            return Array.from(gameCards).map(card => {
                const img = card.querySelector('img');
                const title = card.querySelector('h3');
                return {
                    name: title ? title.textContent.trim() : 'unknown',
                    imgSrc: img ? img.src : null
                };
            }).filter(game => game.imgSrc);
        });

        console.log(`Found ${games.length} games with images. Downloading...`);
        for (let i = 0; i < games.length; i++) {
            const { name, imgSrc } = games[i];
            try {
                const imgResponse = await axios.get(imgSrc, { responseType: 'arraybuffer' });
                // 清理文件名，移除特殊字符
                const cleanName = name.replace(/[/\\?%*:|"<>]/g, '_');
                const imgName = `${cleanName}.png`;
                await fs.writeFile(path.join(outputDir, imgName), imgResponse.data);
                console.log(`Downloaded: ${imgName}`);
            } catch (imgError) {
                console.error(`Failed to download ${name}:`, imgError.message);
            }
        }

        console.log('Scraping completed. Data saved to scraped-data/');
    } catch (error) {
        console.error('Error scraping:', error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

scrape();