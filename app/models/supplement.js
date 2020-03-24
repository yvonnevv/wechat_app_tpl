'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SupplementSchema = new Schema({
    userDesc: String,
    userName: String
});

const Supplement = mongoose.model('Supplement', SupplementSchema);

module.exports = Supplement;