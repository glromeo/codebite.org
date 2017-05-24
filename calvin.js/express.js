global.Promise = require("bluebird");

const express = require('express')

const path = require("path");
const serveIndex = require('serve-index');
const errorHandler = require('errorhandler');

const sassMiddleware = require('node-sass-middleware')
const transpileAnyMiddleware = require('transpile-any-middleware');

const babel = require("babel-core");
const babel_preset_env = require("babel-preset-env");

const app = express();

const fs = require("fs");

/**
 * Sass Middleware
 */
app.use('/styles', sassMiddleware({
    src: 'src/main/styles',
    dest: 'target/css',
    debug: true,
    sourceMap: true,
    sourceMapRoot: '/src/main',
    outputStyle: 'compressed',
}));
app.use('/styles', express.static(path.join(__dirname, 'target/css')));

/**
 * Babel Middleware
 */
app.use('/babel', transpileAnyMiddleware({
    src: 'src/main/es6',
    dest: 'target/lib',
    from: '*.js',
    to: '*.js',
    debug: true,
    force: false,
    transpiler: (function (options) {
        options.plugins.push("transform-es2015-modules-systemjs");

        return function (source, {req, file}) {
            console.log("user-agent:", req.headers['user-agent']);
            console.log("compiling:", file || req.path);
            return babel.transform(source, options);
        }
    })(JSON.parse(fs.readFileSync(".babelrc"))),
    headers: {
        "Content-Type": "application/javascript"
    }
}));
app.use('/babel', express.static(path.join(__dirname, 'target/lib')));

app.use('/mocha', transpileAnyMiddleware({
    src: 'src/test/mocha',
    dest: 'target/mocha',
    from: '*.js',
    to: '*.js',
    debug: true,
    force: false,
    transpiler: (function (options) {
        options.plugins.push("transform-es2015-modules-systemjs");
        return function (source, {req, file}) {
            console.log("user-agent:", req.headers['user-agent']);
            console.log("compiling:", file || req.path);
            return babel.transform(source, options);
        }
    })(JSON.parse(fs.readFileSync(".babelrc"))),
    headers: {
        "Content-Type": "application/javascript"
    }
}));
app.use('/mocha', express.static(path.join(__dirname, 'target/mocha')));

app.use('/benchmark', transpileAnyMiddleware({
    src: 'src/perf',
    dest: 'target/perf',
    from: '*.js',
    to: '*.js',
    debug: true,
    force: false,
    transpiler: (function (options) {
        options.plugins.push("transform-es2015-modules-systemjs");
        return function (source, {req, file}) {
            console.log("user-agent:", req.headers['user-agent']);
            console.log("compiling:", file || req.path);
            return babel.transform(source, options);
        }
    })(JSON.parse(fs.readFileSync(".babelrc"))),
    headers: {
        "Content-Type": "application/javascript"
    }
}));
app.use('/benchmark', express.static(path.join(__dirname, 'target/perf')));

/**
 * Static content & serve indices
 */
[
    '/node_modules',
    '/public',
    '/src/main',
    '/src/test',
    '/target',
    '/images',
].forEach(function (context) {
    app.use(context, express.static(path.join(__dirname, context)))
    app.use(context, serveIndex(path.join(__dirname, context)));
});

app.use(errorHandler());

const EXPRESS_PORT = 8080;

app.listen(EXPRESS_PORT, function () {
    console.log('showcase server listening on port: ' + EXPRESS_PORT);
});