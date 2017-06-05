const express = require("express");
const router = express.Router();

router.get('/', function (req, res) {
    res.json({message: 'welcome to storage api!'});
});

const MongoClient = require('mongodb').MongoClient
    , assert = require('assert');

router.route('/reports').post(function (req, res) {

    throw "Not implemented yet";
});


exports.router = router;