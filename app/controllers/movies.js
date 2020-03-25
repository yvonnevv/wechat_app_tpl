'use strict';

const mongoose =  require('mongoose');
const Movies = mongoose.model('Movies');
const { startCrawl, __crawlContent } = require('../service/crawl');
const {
    verify,
    shorturlinfo,
    sharelist,
    transfer,
    rename,
    newshare,
    dirlist,
    nowfsid,
    generatePWD
} = require('../service/baidupan');
const { WECHAT_CONFIG, URL } = require('../service/config');
const { replaceName, appName } = WECHAT_CONFIG;
const { requestDouban, sleep } = require('../service/douban');

async function __deleteMovie(name) {
    await Movies.remove({ name });
}

function __addUserSearch(name, keyword) {
    Movies.updateMany({ name }, { $push: { userSearch: keyword } }, { multi: true }).exec();
}

function __addMovie({
    name = '',
    shareUrl = '',
    password = '',
    keyword = ''
}) {
    const newMovie = new Movies({
        name,
        shareUrl,
        password,
        keyword
    });
    newMovie.save();
}

/**
 * 转存
 * @param {*} crawlShareLinks 
 * @param {*} userSearch 
 */
async function transferAndSave(crawlShareLinks, userSearch) {
    const sharefilelist = [], renamelist = [];

    // 转存前期工作
    await Promise.all(crawlShareLinks.map(async ({
        shareLink, name, desc, pwd: iPwd = 'LXXH'
    }) => {
        // 短链
        if (!shareLink) return;
        const surlArr = shareLink.split('/s/');
        const surl = surlArr[1];
        const shortSurl = surl.substring(1);
        const verifyResult = await verify({
            pwd: iPwd,
            surl: shortSurl
        });

        const { randsk } = verifyResult;
        const shareInfoResult = await shorturlinfo({
            shorturl: surl, spd: randsk
        });

        const { shareid, uk } = shareInfoResult;
        const sharelistResult = await sharelist({shareid, shorturl: shortSurl, sekey: randsk});
        const { errno: sErron, list = {} } = sharelistResult;
        if (sErron) return;
        const { fs_id, server_filename } = list[0];
        // 要依次转存
        await transfer({ shareid, from: uk, sekey: randsk, fsidlist: JSON.stringify([fs_id]) });
        // 获取转存后的文件fsid
        let nowlistResult = await nowfsid(encodeURIComponent(server_filename));
        let { errno, list: nowList = [{}] } = nowlistResult;
        // 获取重试逻辑
        if (errno) {
            let splitIdx = ~server_filename.indexOf('[ 微信公众号') 
                ? server_filename.indexOf('[ 微信公众号')
                : server_filename.indexOf('[微信公众号');
            splitIdx = ~splitIdx ? splitIdx : server_filename.length;
            let parse_name = server_filename.substring(0, splitIdx);
            nowlistResult = await nowfsid(encodeURIComponent(parse_name));
            nowList = nowlistResult.list || [{}];
        };
        const { fs_id: cur_fs_id, path: fs_path } =  nowList[0] || {};
        const pwd = generatePWD();
        let shareResult = await newshare({fid_list: JSON.stringify([cur_fs_id]), pwd});
        const { shorturl } = shareResult;
        const movie = {
            name,
            shareUrl: shorturl,
            password: pwd,
            keyword: desc,
            userSearch: [userSearch || name]
        };
        renamelist.push({fs_id: cur_fs_id, fs_path, server_filename});
        sharefilelist.push(movie);
        __addMovie(movie);
    }));

    return { sharefilelist, renamelist };
}

/**
 * 重命名
 * @param {*} renamelist 
 */
async function renameFile(renamelist) {
    // 要获取内部文件
    const innerFilelist = [];
    await Promise.all(renamelist.map(async (file = {}) => {
        let f_dir = file.fs_path;
        let n_name = file.server_filename.replace(replaceName, appName);
        let list_f_dir = f_dir.replace(replaceName, appName);
        const renameResult = await rename({
            filelist: JSON.stringify([{
                path: f_dir,
                newname: n_name
            }])
        });
        const { errno } = renameResult;
        // 加入重命名重试逻辑
        if (errno) {
            n_name = n_name.replace('微信公众号', 'wx公众号');
            list_f_dir = list_f_dir.replace('微信公众号', 'wx公众号');
            await rename({
                filelist: JSON.stringify([{
                    path: f_dir,
                    newname: n_name
                }])
            });
        }
        // 拿里面的文件
        const dirInfo = await dirlist(encodeURIComponent(list_f_dir));
        const { errno: dErrno, list } = dirInfo;
        if (!dErrno) {
            list.forEach(item => {
                const { path, server_filename } = item;
                innerFilelist.push({
                    path,
                    newname: server_filename.replace(replaceName, appName)
                });
            });
        }
    }));

    rename({
        filelist: JSON.stringify(innerFilelist)
    });
}

/**
 * 主逻辑
 * @param {*} ctx 
 * @param {*} userMes 
 */
async function getMovie(ctx, userMes) {
    const keyword = userMes || ctx.request.query.keyword;
    const wordReg = new RegExp(keyword, 'i')
    let localMovies = await Movies.find({
        $or: [
            { name: wordReg },
            { userSearch: { $in: [keyword] } }
        ]
    }).exec() || [];

    if (!localMovies.length) {
        const shareLinks = await startCrawl(keyword);
        if (shareLinks.length) {
            // 查询一下数据库有没有
            const { name } = shareLinks[0];
            localMovies = await Movies.find({  
                name
            }).exec() || [];
            if (!localMovies.length) {
                const { sharefilelist, renamelist } = await transferAndSave(shareLinks, keyword);
                localMovies = sharefilelist;
                renameFile(renamelist);
            } else {
                __addUserSearch(name, keyword);
            }
        };
    };

    console.log(`!!!!! 获取${keyword}成功 !!!!!`);
    
    return {
        retcode: 0,
        localMovies
    };
}

/**
 * 手动插入数据（postman）
 * @param {*} ctx 
 */
exports.customInsert = async (ctx) => {
    const { insertDoc = [] } = ctx.request.body;
    const { sharefilelist, renamelist } = await transferAndSave(insertDoc);
    console.log('sharefilelist==', sharefilelist);
    
    renameFile(renamelist);
    return {
        retcode: 0,
        localMovies: sharefilelist
    }
}

exports.autoGetMoives = async (ctx) => {
    const { tag, sort = 'recommend', page_limit = 100, page_start = 0 } = ctx.query;
    const result = await requestDouban({
        tag, sort, page_limit, page_start
    });  
    for (let i = 0; i < result.length; i++) {
        let { title } = result[i];
        title = title.split('：')[0];
        console.log(`----- 准备获取${title} -----`);
        getMovie(ctx, title);
        if (i === result.length - 1) {
            console.log(`$$$$$ 任务完成 $$$$$`)
        }
        await sleep(50000);     
    };
}

exports.testRename = async (ctx) => {
    const { keyword } = ctx.query;
    const listResult = await nowfsid(encodeURIComponent(keyword));
    console.log('listResult', listResult);
}

exports.testIp = async (ctx) => {
    // 测试ip可用性
    const { keyword } = ctx.query;
    const docs = await __crawlContent(`${URL}?s=${encodeURIComponent(keyword)}`);
    console.log('docs==', docs);
}

exports.getMovie = getMovie;