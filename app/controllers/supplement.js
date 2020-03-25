'use strict';

const mongoose =  require('mongoose');
const Supplement = mongoose.model('Supplement');

/**
 * 用户补录
 */
exports.add = (userName, userDesc) => {
    const newSupplement = new Supplement({
        userName,
        userDesc
    });
    newSupplement.save();
}