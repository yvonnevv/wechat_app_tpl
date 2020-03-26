'use strict';
const sha1 = require('sha1');
const {
    WECHAT_CONFIG
} = require('./config');
const Movies = require('../controllers/movies');
const Supplement = require('../controllers/supplement');
const Recommend = require('../controllers/recommend');

class Wechat {
    constructor() {
        this.token = WECHAT_CONFIG.token;
    }

    auth(ctx) {
        const {
			signature,
			timestamp,
            nonce,
            echostr
		} = ctx.query;
		const arr = [this.token, timestamp, nonce].sort().join('');
        const result = sha1(arr);

		return result === signature ? echostr : 'dismatch';
    }

    async __sendMovie(userMes, userName) {
        let replyContent = '';
        const result = await Movies.getMovie(null, userMes, userName);
        const { retcode, localMovies } = result;
        if (retcode) replyContent = '啊哦，查询失败，请重试';
        if (!localMovies.length) {
            replyContent = '啊哦，没有找到你想要的内容呢。可回复补录+片名，小编会尽快处理';
        } else {
            localMovies.forEach(movie => {
                const { name, shareUrl, password } = movie;
                replyContent += `${name}链接：${shareUrl} 提取码：${password}`;
                replyContent += `\n`;
            });
        }

        return replyContent;
    }

    __customAdd(userName, userMes) {
        Supplement.add(userName, userMes);
        return '[GoForIt]已提交，小编会尽快处理！';
    }

    async __customDel(userMes) {
        if (!/^http(s?):\/\/pan\.baidu\.com\/s\/1/.test(userMes))
            return '[OMG]请输入正确格式！'
        const { retcode } = await Movies.customDel(null, userMes);
        switch(retcode) {
            case 0:
                return '[OMG]已处理，请重新获取!';
            case 1:
                return '[Doge]没有找到这个文件，请重新获取！';
            case 2:
                return '[Doge]没有失效呢!';
        }
    }

    async __randomRecommend(tag) {
        const { 
            retcode,
            titleText,
            summary,
            tagText 
        } = await Recommend.recommend(tag);
        if (retcode) return '啊哦，该类目下没有推荐呢'
        return `${titleText}（${tagText}）\n\n${summary}`
    }

    /**
     * 自动回复消息
     * @param {*} ctx 
     */
    async sendMes(ctx) {
        const xml = ctx.request.body;
        const createTime = Date.parse(new Date());
        const { 
            MsgType,
            ToUserName,
            FromUserName,
            Content,
            Event
        } = xml.xml;

        const userName = FromUserName[0];
        const userMes = Content ? Content[0] : '';
        const type = MsgType ? MsgType[0] : ''; 
        const isNotText = '【收到不支持的消息类型，暂无法显示】';
        let replyContent = '';
        // 关注
        if (type === 'event' && Event[0] === 'subscribe') {
            replyContent = '靴靴关注[Wow]！点击菜单查看更多操作哟~'
        };
        if (type === 'text') {
            if (userMes === isNotText || !userMes.trim()) return;
            let plusFlag = '+';
            if (~userMes.indexOf('＋')) {
                plusFlag = '＋'
            };
            const userMesHandleType = userMes.split(plusFlag)[0].trim();
            const userMesInfo = userMes.split(plusFlag)[1] ? userMes.split(plusFlag)[1].trim() : userMes;
            switch (userMesHandleType) {
                case '补录':
                    replyContent = this.__customAdd(userName, userMesInfo);
                    break;
                case '失效':
                    replyContent = await this.__customDel(userMesInfo);
                    break;
                case '求片':
                    replyContent = await this.__sendMovie(userMesInfo, userName);
                    break;
                default: {
                    if (~userMesHandleType.indexOf('推荐')) {
                        const tag = userMesHandleType.substring(2);
                        replyContent = await this.__randomRecommend(tag);
                    } else {
                        replyContent = '回复：求片+片名。例如求片+阿凡达[Smart](点击菜单查看更多操作)' 
                    }
                }
            }
        };

        return `<xml>
                <ToUserName><![CDATA[${FromUserName[0]}]]></ToUserName>
                <FromUserName><![CDATA[${ToUserName[0]}]]></FromUserName>
                <CreateTime>${createTime}</CreateTime>
                <MsgType><![CDATA[text]]></MsgType>
                <Content><![CDATA[${replyContent}]]></Content>
            </xml>`
    }
}

module.exports = Wechat;