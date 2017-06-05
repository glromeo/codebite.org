const express = require("express");

const cors = require("cors");

const app = express();
const SERVER_PORT = process.env.PAPERBOX_PORT || 28080;

/**********************************************************************************************************************
 * https://www.npmjs.com/package/cors
 **********************************************************************************************************************/
app.use(cors());
app.options('*', cors());

/**********************************************************************************************************************
 * https://github.com/expressjs/body-parser
 **********************************************************************************************************************/
const bodyParser = require('body-parser')

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

/**********************************************************************************************************************
 * routes
 **********************************************************************************************************************/
const storage = require("./storage/index.js");
app.use('/storage', storage.router);

const data = require("./data/index.js");
app.use('/data', data.router);

app.listen(SERVER_PORT, function () {
    console.log('paper-box services available on port:', SERVER_PORT)
});