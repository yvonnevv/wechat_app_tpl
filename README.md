# wechat-server
利用koa2 + mongodb搭建一套简易的 nodejs 微信公众号后台服务，用于为客户端提供数据请求的数据 api 接口

# 使用说明
- 安装 NodeJs  
  koa2 下，最好安装 node7.0 以上版本，不然会报错，因为低版本下 Koa2 部分 ES7 的语法会不支持
- 安装 MongoDB 数据库  
  可以参考官方文档：https://docs.mongodb.com/manual/installation/ ；OS X 系统下推荐使用Homebrew进行安装。
- 安装相关依赖
```
// 全局安装pm2
$ npm install pm2 -g
```
```
// 进入根目录
$ npm install
```
- 替换自己公众号配置
```
// 进入配置目录，替换相应配置
$ cd ./config/constants
```
- 开启服务
```
// 开启mongo
$ mongod
```
```
// 进入根目录
$ npm run dev
```
- 浏览器打开
127.0.0.1:8001

# 最后安利一下自己公众号






