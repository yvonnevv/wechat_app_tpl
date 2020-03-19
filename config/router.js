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
		// await getMovie();
		const result = await wechat.sendMes(ctx);
		ctx.body = result;
	})
	  
	router.get('/api/movie', async ctx => {
		const result  = await Movies.getMovie(ctx);
		ctx.body = result;
	});

	return router;
}