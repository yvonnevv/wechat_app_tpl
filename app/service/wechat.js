'use strict';
const sha1 = require('sha1');
const {
	WECHAT_CONFIG
} = require('./config');
const Movies = require('../controllers/movies');
const Supplement = require('../controllers/supplement');

class Wechat {
    constructor() {
        this.token = WECHAT_CONFIG.token;
        this.userInfoMap = {};
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

    async __sendMovie(userMes) {
        let replyContent = '';
        const result = await Movies.getMovie(ctx, userMes);
        delete this.userInfoMap[userName];
        const { retcode, localMovies } = result;
        if (retcode) replyContent = '啊哦，查询失败，请重试';
        if (!localMovies.length) {
            replyContent = '啊哦，没有找到你想要的内容呢';
        } else {
            localMovies.forEach(movie => {
                const { name, shareUrl, password } = movie;
                replyContent += `${name}链接：${shareUrl} 提取码：${password}`;
                replyContent += `\n`;
            });
        }

        return replyContent;
    }

    async __customAdd(userName, userMes) {
        Supplement.add(userName, userMes);
        return '[GoForIt]已提交，小编会尽快处理！';
    }

    async __customDel(userMes) {
        if (!/^http:\/\/pan\.baidu\.com\/s\/1/.test(userMes))
            return '[OMG]请输入正确格式！'
        const { retcode } = Movies.customDel(null, userMes);
        switch(retcode) {
            case 0:
                return '[OMG]已处理，请重新获取!';
            case 1:
                return '[Doge]没有找到这个文件，请重新获取！';
            case 2:
                return '[Doge]没有失效呢!';
        }
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
            Content
        } = xml.xml;

        const userName = FromUserName[0];
        const userMes = Content ? Content[0] : '';
        const type = MsgType ? MsgType[0] : ''; 
        const isNotText = '【收到不支持的消息类型，暂无法显示】';
        if (userMes === isNotText || !userMes.trim() || type !== 'text') return;

        let replyContent = '';
        if (this.userInfoMap[userName] == userMes) {
            replyContent = '已经在查询啦～请勿重复请求！';
        } else {
            const userMesHandleType = userMes.split('+');
            switch (userMesHandleType[0]) {
                case '补录':
                    replyContent = this.__customAdd(userMesHandleType[1]);
                    break;
                case '失效':
                    replyContent = this.__customDel(userMesHandleType[1]);
                    break;
                default:
                    replyContent = this.__sendMovie(userMes);
                    break;
            }
        }
        
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