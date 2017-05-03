#!/usr/bin/env node
const SimpleModuleLoader = require('core-loader');
const path = require('path');

global.loader = new SimpleModuleLoader();

global.cli_arguments = {};

let current = undefined;

for (let i = 2; i < process.argv.length; i++) {
    let arg = process.argv[i];
    if (arg.startsWith('--')) {
        current = arg.substring(2);
    } else if (current) {
        global.cli_arguments[current] = arg;
        current = undefined;
    }
}

delete global.cli_arguments.timeout;

loader.require = require;

global.throwRejection = function (err) {
    setTimeout(function () {
        throw err;
    });
};

loader.import(path.resolve(__dirname, "./es-mocha.js")).then(function (m) {
    console.log("tests started...");
}).catch(throwRejection);