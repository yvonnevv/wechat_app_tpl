
'use strict';

const request = require('async-request');

export function sleep(time) {
    return new Promise((res, rej) => {
        setTimeout(() => {
            res('OK')
        }, time);
    });
};

export async function requestDouban({
    tag, sort, page_start, page_limit
}) { 
    const uri = `https://movie.douban.com/j/search_subjects?type=movie&tag=${encodeURIComponent(tag)}&sort=${sort}&page_limit=${page_limit}&page_start=${page_start}`
    let result = await request(uri);
    try {
        result = JSON.parse(result.body);
        return result.subjects || [];
    } catch (error) {
        console.log('DOUBAN FUNCTION ERROR: ', error);
    }
}