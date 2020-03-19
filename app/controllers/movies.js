'use strict';

const mongoose =  require('mongoose');
const Movies = mongoose.model('Movies');

const { startCrawl } = require('../service/crawl');
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
const { WECHAT_CONFIG } = require('../service/config');
const { replaceName, appName } = WECHAT_CONFIG;

async function __deleteMovie(name) {
    await Movies.remove({ name });
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

async function transferAndSave(crawlShareLinks) {
    const sharefilelist = [], renamelist = [];

    // 转存前期工作
    await Promise.all(crawlShareLinks.map(async ({
        shareLink, name, desc
    }) => {
        // 短链
        const surlArr = shareLink.split('/s/');
        const surl = surlArr[1];
        const shortSurl = surl.substring(1);
        const verifyResult = await verify({
            pwd: 'LXXH',
            surl: shortSurl
        });

        const { randsk } = verifyResult;
        const shareInfoResult = await shorturlinfo({
            shorturl: surl, spd: randsk
        });

        const { shareid, uk } = shareInfoResult;
        const sharelistResult = await sharelist({shareid, shorturl: shortSurl, sekey: randsk});
        const { list = {} } = sharelistResult;
        const { fs_id, path, server_filename } = list[0];

        // 要依次转存
        const transferResult = await transfer({ shareid, from: uk, sekey: randsk, fsidlist: JSON.stringify([fs_id]) });
        // 获取转存后的文件fsid
        const nowlistResult = await nowfsid(encodeURIComponent(server_filename));
        const { list: nowList = [{}] } = nowlistResult;

        const pwd = generatePWD();
        const shareResult = await newshare({fid_list: JSON.stringify([nowList[0].fs_id]), pwd});
        const { shorturl } = shareResult;
        const movie = {
            name,
            shareUrl: shorturl,
            password: pwd,
            keyword: desc
        };
        renamelist.push({fs_id: nowList[0].fs_id, fs_path: nowList[0].path, server_filename});
        sharefilelist.push(movie);
        __addMovie(movie);
    }));

    return { sharefilelist, renamelist };
}

async function renameFile(renamelist) {
    // 要获取内部文件
    const innerFilelist = [];
    await Promise.all(renamelist.map(async (file = {}) => {
        const f_dir = file.fs_path;
        const n_name = file.server_filename.replace(replaceName, appName);

        await rename({
            filelist: JSON.stringify([{
                path: f_dir,
                newname: n_name
            }])
        });

        // 拿里面的文件
        const dirInfo = await dirlist(encodeURIComponent(f_dir.replace(replaceName, appName)));
        const { errno, list } = dirInfo;
        if (!errno) {
            list.forEach(item => {
                const { path, server_filename } = item;
                innerFilelist.push({
                    path,
                    newname: server_filename.replace(replaceName, appName)
                });
            });
        }
    }));

    await rename({
        filelist: JSON.stringify(innerFilelist)
    });
}



exports.getMovie = async (ctx, userMes) => {
    const keyword = userMes || ctx.request.query.keyword;
    const wordReg = new RegExp(keyword, 'i')
    let localMovies = await Movies.find({
        name: wordReg
    }).exec() || [];

    if (!localMovies.length) {
        const shareLinks = await startCrawl(keyword);
        const { sharefilelist, renamelist } = await transferAndSave(shareLinks);
        localMovies = sharefilelist;
        renameFile(renamelist)
    };

    return {
        retcode: 0,
        localMovies
    };
}