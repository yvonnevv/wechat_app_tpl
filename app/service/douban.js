
'use strict';

const { DOUBAN } = require('./config');
const request = require('async-request');
const { list, info, apiKey, tags } = DOUBAN;

export function sleep(time) {
    return new Promise((res, rej) => {
        setTimeout(() => {
            res('OK')
        }, time);
    });
};

export async function requestDoubanList({
    tag, page_start, page_limit
}) {
    let parseTag = tags.filter(item => {
        const reg = new RegExp(tag);
        return reg.test(item)
    })
    parseTag = parseTag.length ? parseTag[0] : tags[0];
    const uri = `${list}&tag=${encodeURIComponent(parseTag)}&sort=recommend&page_limit=${page_limit}&page_start=${page_start}`
    let result = await request(uri);
    try {
        result = JSON.parse(result.body);
        return result.subjects || [];
    } catch (error) {
        console.log('DOUBAN LIST FUNCTION ERROR: ', error);
    }
}

export async function requestDoubanInfo(id) {
    const uri = `${info}/${id}?apikey=${apiKey}`;
    let result = await request(uri);
    try {
        result = JSON.parse(result.body);
        return result;
    } catch (error) {
        console.log('DOUBAN INFO FUNCTION ERROR: ', error);
    }
}