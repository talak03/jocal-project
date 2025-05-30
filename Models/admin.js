const mongoose = require('mongoose');
const { use } = require('react');

const adminSchema = new mongoose.Schema({

username: String,
password: String

 });

    module.exports = mongoose.model('admin', adminSchema);