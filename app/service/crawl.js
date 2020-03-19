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

export async function startCrawl(keyword) {
    const wrapperUrl = `${URL}${encodeURIComponent(keyword)}`
    const shareLinks = [];
    const docs = await __crawlContent(wrapperUrl);
    const $ = cheerio.load(docs);
    // 有无找到
    const isEmpty = $('h2:contains("未找到")');
    if (isEmpty) return shareLinks;
    // 判断一下是否为内页
    const shareNode = $('p:contains("密码：LXXH")');
    if (shareNode.length) {
        const name = $('h1.entry-title').text();
        const shareLink = shareNode.find('a').attr('href');
        shareLinks.push({shareLink, name});
    } else {
        const articles = $('article.post');
        const urls = [];
        articles.each((index, article) => {
            const link = $(article).find($('.entry-title a'));
            const linkText = link.text();
            const linkUrl = link.attr('href');
            const reg = new RegExp(keyword);
            // 要获取实际的shareLink还需进入一层
            // 完全不包含keyword的直接剔除
            if (reg.test(linkText)) urls.push({
                name: linkText,
                linkUrl
            });
            // 如果大于4个更精确地选取
            if (urls.length > 4) {
                urls = urls.filter(({name}) => {
                    return !name.indexOf(keyword);
                });
            };
        });

        await Promise.all(urls.map(async ({linkUrl, name}) => {
            const iDocs = await __crawlContent(linkUrl);
            const $_i = cheerio.load(iDocs);
            const shareNode = $_i('p:contains("密码：LXXH")');
            const shareLink = shareNode.find('a').attr('href');
            shareLinks.push({shareLink, name});
        }))

        return shareLinks;
    }
}

