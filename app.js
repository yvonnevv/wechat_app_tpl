'use strict'

const fs = require('fs')
const path = require('path')
const mongoose = require('mongoose')

const { ENV } = require('./app/service/config');

const tunnel = require('tunnel-ssh');

//===== db connection =====

const dburi = 'mongodb://localhost:27017/movies'

if (ENV === 'development') {
  const config = {
    username:'ec2-user',
    host: '18.163.62.102',
    privateKey: fs.readFileSync('/Users/chenxinyi/Desktop/wechat_app.pem'),
    port: 22,
    dstHost: 'localhost',
    dstPort: 27017
  };

  tunnel(config, function (error, server) {
    if(error){
        console.log("SSH connection error: " + error);
    }
    /**
     * mongoose连接数据库
     * @type {[type]}
     */
    mongoose.Promise = require('bluebird')
    mongoose.connect(dburi, {
      useMongoClient: true
    })

    const db = mongoose.connection;
    db.on('error', console.error.bind(console, 'DB connection error:'));
    db.once('open', function() {
        console.log("DB connection successful");
    });
  });
} else {
  mongoose.connect(dburi, {
    useMongoClient: true
  })
}    

/**
 * 获取数据库表对应的js对象所在的路径
 * @type {[type]}
 */
const models_path = path.join(__dirname, '/app/models')

/**
 * 已递归的形式，读取models文件夹下的js模型文件，并require
 * @param  {[type]} modelPath [description]
 * @return {[type]}           [description]
 */
var walk = function(modelPath) {
  fs
    .readdirSync(modelPath)
    .forEach(function(file) {
      var filePath = path.join(modelPath, '/' + file)
      var stat = fs.statSync(filePath)

      if (stat.isFile()) {
        if (/(.*)\.(js|coffee)/.test(file)) {
          require(filePath)
        }
      }
      else if (stat.isDirectory()) {
        walk(filePath)
      }
    })
}
walk(models_path)

require('babel-register')
const Koa = require('koa')
const logger = require('koa-logger')
const session = require('koa-session')
const xmlParser = require('koa-xml-body');
const app = new Koa()

app.use(logger())
app.use(session(app))
app.use(xmlParser())


/**
 * 使用路由转发请求
 * @type {[type]}
 */
const router = require('./config/router')()

app
  .use(router.routes())
  .use(router.allowedMethods());



app.listen(5000)
console.log('app started at port 5000...');