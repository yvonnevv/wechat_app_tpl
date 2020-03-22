'use strict'

const Router = require('koa-router')
const Movies = require('../app/controllers/movies')
const Wechat = require('../app/service/wechat');

module.exports = function(){
	const router = new Router();
	const wechat = new Wechat();

  	router.get('/', async ctx => {
		const result = wechat.auth(ctx);
		ctx.body = result;
	});

	router.post('/', async ctx => {
		const result = await wechat.sendMes(ctx);
		ctx.body = result;
	})
	  
	router.get('/api/movie', async ctx => {
		const result  = await Movies.getMovie(ctx);
		ctx.body = result;
	});

	router.get('/api/auto', async ctx => {
		Movies.autoGetMoives(ctx);
		ctx.body = {
			retcode: 0
		};
	});

	router.get('/api/test', async ctx => {
		Movies.testIp(ctx);
		ctx.body = {
			retcode: 0
		};
	});

	router.get('/api/testname', async ctx => {
		Movies.testRename(ctx);
		ctx.body = {
			retcode: 0
		};
	});

	return router;
}