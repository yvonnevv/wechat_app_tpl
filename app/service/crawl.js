'use strict';

const superagent= require('superagent');
const cheerio = require('cheerio');

const { UA, URL } = require('./config');
const userAgent = UA[Math.floor(Math.random() * UA.length)];

async function __crawlContent(url) {
    const docs = await superagent
        .get(url)
        .set({
            'User-Agent': userAgent
        });
    return docs.text;
}

function __parseName(name) {
    const nameArr = name.split('][');
    const descIdx = isNaN(+nameArr[1]) ? 1 : 2;
    const nowName = (descIdx - 1) ? `${nameArr[0]}][${nameArr[1]}]` : `${nameArr[0]}]`

    return {
        desc: nameArr[descIdx],
        name: nowName
    }
}

export async function startCrawl(keyword) {
    const wrapperUrl = `${URL}${encodeURIComponent(keyword)}`
    const shareLinks = [];
    const docs = await __crawlContent(wrapperUrl);
    const $ = cheerio.load(docs);
    // 有无找到
    const isEmpty = $('h2:contains("未找到")');
    if (isEmpty.length) return shareLinks;
    // 判断一下是否为内页
    const shareNode = $('p:contains("密码：LXXH")');
    if (shareNode.length) {
        const fullName = $('h1.entry-title').text();
        const { name, desc } = __parseName(fullName);
        const shareLink = shareNode.find('a').attr('href');
        shareLinks.push({shareLink, name, desc});
        return shareLinks;
    } else {
        const articles = $('article.post');
        let urls = [];
        articles.each((index, article) => {
            const link = $(article).find($('.entry-title a'));
            const linkText = link.text();
            const linkUrl = link.attr('href');
            const { name, desc } = __parseName(linkText);
            const reg = new RegExp(keyword);
            // 要获取实际的shareLink还需进入一层
            // 完全不包含keyword的直接剔除
            if (reg.test(name)) urls.push({
                name,
                desc,
                linkUrl
            });
        });

        // 如果大于4个更精确地选取
        if (urls.length > 4) {
            urls = urls.filter(({name}) => {
                return !name.indexOf(`[${keyword}`) || !name.indexOf(keyword);
            });
        };

        await Promise.all(urls.map(async ({linkUrl, name, desc}) => {
            const iDocs = await __crawlContent(linkUrl);
            const $_i = cheerio.load(iDocs);
            const shareNode = $_i('p:contains("密码：LXXH")');
            const shareNodeArr = new Array(shareNode.length).fill(1);
            shareNodeArr.forEach((item, idx) => {
                const shareLink = shareNode.eq(idx).find('a').attr('href');
                shareLinks.push({shareLink, name, desc});
            });
        }));

        return shareLinks;
    }
}

