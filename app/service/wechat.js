'use strict';
const sha1 = require('sha1');
const {
    WECHAT_CONFIG
} = require('../../config/constants');

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
        // 用户openid
        const userName = FromUserName[0];
        const toUser = ToUserName[0];
        // 用户消息
        const userMes = Content ? Content[0] : '';
        /**
         * type 枚举
         * text 文本
         * imgae 图片
         * voice 语音
         * video 视频
         * shortvideo 小视频
         * location 定位
         * link 链接
         * event 事件
         */
        const type = MsgType ? MsgType[0] : ''; 
        // 用户发送表情包服务端会接收到到如下文本
        // const isNotText = '【收到不支持的消息类型，暂无法显示】';
        let replyContent = '';
        if (type === 'event' && Event[0] === 'subscribe') {
            replyContent = '谢谢你这么好看还关注我！'
        };
        if (type === 'text') {
            replyContent = `接受到文本消息${userMes}`
        };

        return `<xml>
                <ToUserName><![CDATA[${userName}]]></ToUserName>
                <FromUserName><![CDATA[${toUser}]]></FromUserName>
                <CreateTime>${createTime}</CreateTime>
                <MsgType><![CDATA[text]]></MsgType>
                <Content><![CDATA[${replyContent}]]></Content>
            </xml>`
    }
}

module.exports = Wechat;