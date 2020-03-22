
'use strict';

const request = require('async-request');

export function sleep(time) {
    return new Promise((res, rej) => {
        setTimeout(() => {
            res('OK')
        }, time);
    });
};

export async function requestDouban(page_limit, page_start) {
    const uri = `https://movie.douban.com/j/search_subjects?type=movie&tag=%E8%B1%86%E7%93%A3%E9%AB%98%E5%88%86&sort=time&page_limit=${page_limit}&page_start=${page_start}`
    let result = await request(uri);
    try {
        result = JSON.parse(result.body);
        return result.subjects || [];
    } catch (error) {
        console.log('DOUBAN FUNCTION ERROR: ', error);
    }
}