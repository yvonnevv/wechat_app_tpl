
'use strict';

const request = require('async-request');
const {
    ACCESS_TOKEN,
    PAN_API,
    LETTERS
} = require('./config');

/**
 * 获取分享长密码 即randsk
 * @param surl /s/1后的
 */
export async function verify({surl, pwd}) {
    const uri = `${PAN_API['verify']}?access_token=${ACCESS_TOKEN}&surl=${surl}`;
    const options = {
        method: 'POST',
        data: {
            pwd
        },
        headers: {
            referer: 'pan.baidu.com'
        }
    };
    let result = await request(uri, options);
    try {
        result = JSON.parse(result.body);
        return result;
    } catch (error) {
        console.log('VERIFY FUNCTION ERROR: ', error);
    }
}

/**
 * 获取本次分享id和uk
 */
export async function shorturlinfo({shorturl, spd}) {
    const uri = `${PAN_API['shorturlinfo']}?access_token=${ACCESS_TOKEN}&shorturl=${shorturl}&spd=${spd}`;
    let result = await request(uri);
    try {
        result = JSON.parse(result.body);
        return result;
    } catch (error) {
        console.log('SHORTURL FUNCTION ERROR: ', error);
    }
}

/**
 * 获取分享列表
 * @param shorturl /s/1后的
 */
export async function sharelist({shareid, shorturl, sekey}) {
    const uri = `${PAN_API['list']}?shareid=${shareid}&shorturl=${shorturl}&sekey=${sekey}&root=1`;
    let result = await request(uri);
    try {
        result = JSON.parse(result.body);
        return result;
    } catch (error) {
        console.log('SHARELIST FUNCTION ERROR: ', error);
    }
}

/**
 * 分享文件转存
 */
export async function transfer({shareid, from, sekey, fsidlist}) {
    const uri = `${PAN_API['transfer']}?access_token=${ACCESS_TOKEN}&shareid=${shareid}&from=${from}&sekey=${sekey}`;
    const options = {
        method: 'POST',
        data: {
            path: '/fortune',
            fsidlist
        },
        headers: {
            referer: 'pan.baidu.com'
        }
    };
    let result = await request(uri, options);
    try {
        result = JSON.parse(result.body);
        return result;
    } catch (error) {
        console.log('TRANSFER FUNCTION ERROR: ', error);
    }
}

/**
 * 保存之后重命名(外部&内部)
 */
export async function rename({ filelist }) {
    const uri = `${PAN_API['rename']}?access_token=${ACCESS_TOKEN}&method=filemanager&opera=rename`;
    const options = {
        method: 'POST',
        data: {
            async: 0, // 0同步 2异步
            filelist
        },
        headers: {
            referer: 'pan.baidu.com'
        }
    };
    let result = await request(uri, options);
    try {
        result = JSON.parse(result.body);
        return result;
    } catch (error) {
        console.log('RENAME FUNCTION ERROR: ', error);
    }
}

/**
 * 查看文件夹fsid
 * @param {*} dir 
 */
export async function nowfsid(key) {
    const uri = `${PAN_API['search']}&access_token=${ACCESS_TOKEN}&dir=/fortune&key=${key}`;
    let result = await request(uri);
    try {
        result = JSON.parse(result.body);
        return result;
    } catch (error) {
        console.log('NOWFSID FUNCTION ERROR: ', error);
    }
}

/**
 * 递归获取文件列表
 * @param {*} dir 
 */

/**
 * 查看列表
 * @param {*} param0 
 */
export async function dirlist(dir) {
    const uri = `${PAN_API['filelist']}&access_token=${ACCESS_TOKEN}&dir=${dir}`;
    let result = await request(uri);
    try {
        result = JSON.parse(result.body);
        return result;
    } catch (error) {
        console.log('DIRLIST FUNCTION ERROR: ', error);
    }
}

/**
 * 创建新的分享7天
 */
export async function newshare({
    fid_list = [],
    pwd
}) {
    const uri = `${PAN_API['share']}?access_token=${ACCESS_TOKEN}`;
    const options = {
        method: 'POST',
        data: {
            fid_list,
            schannel: 4,
            channel_list: JSON.stringify([]),
            period: 7,
            pwd
        },
        headers: {
            referer: 'pan.baidu.com'
        }
    };
    let result = await request(uri, options);
    try {
        result = JSON.parse(result.body);
        return result;
    } catch (error) {
        console.log('SHARE FUNCTION ERROR: ', error);
    }
}

export function generatePWD() {
    let pwd = '';
    Array(4).fill(0).forEach(() => {
        const randomLetter = Math.floor(Math.random() * LETTERS.length);
        pwd += LETTERS[randomLetter];
    });
    return pwd
}



