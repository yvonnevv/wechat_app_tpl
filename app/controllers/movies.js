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

async function crawlAndSave(keyword) {
    let localMovies = [];
    const shareLinks = await startCrawl(keyword);
    let filelist = [], dirs = [], share_list = [];

    await Promise.all(shareLinks.map(async ({
        shareLink, name
    }) => {
        const surlArr = shareLink.split('/s/');
        const surl = surlArr[1];
        const shortSurl = surl.substring(1);
        const verifyResult = await verify({
            pwd: 'LXXH',
            surl: shortSurl
        });

        const { randsk } = JSON.parse(verifyResult.body);
        const infoResult = await shorturlinfo({
            shorturl: surl, spd: randsk
        });

        const { shareid, uk } = JSON.parse(infoResult.body);
        const listResult = await sharelist({
            shareid, shorturl: shortSurl, sekey: randsk
        });

        const { title, list } = JSON.parse(listResult.body);
        console.log('listResult.body', listResult.body);
        
        // 这个title就是名字
        const fsidlist = [];
        list.forEach(item => {
            fsidlist.push(+item.fs_id);
        });
        const transferResult = await transfer({
            shareid,
            from: uk,
            sekey: randsk,
            fsidlist: JSON.stringify(fsidlist)
        });
        const { errno, info } = JSON.parse(transferResult.body);
        if (!errno) {
            // 转存成功之后获取当前的fsid
            const titleArr = title.split('/');
            nowfsid(encodeURIComponent(titleArr[titleArr.length - 1])).then(res => {
                const { list } = JSON.parse(res.body);
                list.forEach(item => {
                    share_list.push({
                        name,
                        fs_id: item.fs_id
                    });
                })
            });
            info.forEach((iItem) => {
                const { path } = iItem;
                const fileName = path.substring(1);
                dirs.push(`/fortune${path}`);
                filelist.push({
                    path: `/fortune${path}`,
                    newname: fileName.replace('新剧分享', '来个电影')
                });
            });
        } else {
            ctx.body = {
                retcode: 1,
                result: {
                    localMovies
                }
            };
            return;
        }
    }));

    await Promise.all(dirs.map(async dir => {
        const dirInfo = await dirlist(encodeURIComponent(dir));
        const { errno, list } = JSON.parse(dirInfo.body);
        if (!errno) {
            list.forEach(item => {
                const { path, server_filename } = item;
                filelist.push({
                    path: path.replace('新剧分享', '来个电影'),
                    newname: server_filename.replace('新剧分享', '来个电影')
                });
            });
        }
    })); 
    
    // 这里可能要分两步重命名
    await rename({
        filelist: JSON.stringify(filelist)
    });

    // 每个文件都单独分享
    await Promise.all(share_list.map(async item => {
        const { name, fs_id } = item;
        const namearr = name.split('][');
        const pwd = generatePWD();
        const shareResult = await newshare({
            fid_list: JSON.stringify([fs_id]),
            pwd
        });
        console.log('shareResult', fs_id, pwd, JSON.parse(shareResult.body));
        
        const { shorturl } = JSON.parse(shareResult.body);
        const movie = {
            name: `${namearr[0]}][${namearr[1]}]`, 
            shareUrl: shorturl,
            password: pwd,
            keyword: namearr[2]
        };
        localMovies.push(movie);
        __addMovie(movie);
    }));

    return localMovies;
}

exports.getMovie = async (ctx, userMes) => {
    const keyword = userMes || ctx.request.query.keyword;
    const wordReg = new RegExp(keyword, 'i')
    let localMovies = await Movies.find({
        name: wordReg
    }).exec() || [];

    if (!localMovies.length) {
        localMovies = await crawlAndSave(keyword);
    };

    return {
        retcode: 0,
        localMovies
    };
}