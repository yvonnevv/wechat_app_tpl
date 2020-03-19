'use strict';
const sha1 = require('sha1');
const {
	WECHAT_CONFIG
} = require('./config');
const Movies = require('../controllers/movies');

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

    /**
     * 自动回复消息
     * @param {*} ctx 
     */
    async sendMes(ctx, isNow) {
        const xml = ctx.request.body;
        const createTime = Date.parse(new Date());
        const { 
            MsgType,
            ToUserName,
            FromUserName,
            Content
        } = xml.xml;

        const userMes = Content ? Content[0] : '';
        const type = MsgType ? MsgType[0] : ''; 
        const isNotText = '【收到不支持的消息类型，暂无法显示】';
        if (userMes === isNotText || !userMes.trim() || type !== 'text') return;

        let replyContent = '';
        
        if (isNow) {
            replyContent = '[OMG]马上就来！'
        } else {
            const result = await Movies.getMovie(ctx, userMes);
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