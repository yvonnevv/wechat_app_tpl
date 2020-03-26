'use strict';

// 暂时不入库
const {
    requestDoubanList,
    requestDoubanInfo
} = require('../service/douban');

exports.recommend = async (tag) => {
    // 获取选取一个
    const num = Math.floor(Math.random() * 100);
    const subjects = await requestDoubanList({
        tag, page_start: num, page_limit: 1
    }) || [{}];
    const { id, title, rate } = subjects[0] || {};
    if (!id) return { retcode: 1 };
    const info = await requestDoubanInfo(id);
    const { countries, summary, genres } = info;
    const tagText = `${countries.join(' / ')} / ${genres.join(' / ')}`;
    const titleText = `【豆瓣${rate}】${title}`
    
    return {
        retcode: 0,
        titleText,
        tagText,
        summary: summary.substring(0, summary.length - 3)
    };
}