'use strict'

const Router = require('koa-router')
const Wechat = require('../app/service/wechat');

module.exports = function(){
	const router = new Router();
	const wechat = new Wechat();

	/**
	 * 微信公众号验证
	 */
  	router.get('/', async ctx => {
		const result = wechat.auth(ctx);
		ctx.body = result;
	});
  
	/**
	 * 微信公众号处理消息
	 */
	router.post('/', async ctx => {
		const result = await wechat.sendMes(ctx);
		ctx.body = result;
	});

	return router;
}