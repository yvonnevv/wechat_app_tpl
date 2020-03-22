'use strict';

const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const MoviesSchema = new Schema({
    name: String,
    shareUrl: String,
    password: String,
    keyword: String,
    // 用户不精准搜索的字段
    userSearch: [String]
});

const Movies = mongoose.model('Movies', MoviesSchema);

module.exports = Movies;