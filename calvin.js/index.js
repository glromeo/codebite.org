global.Promise = require("bluebird");

const express = require('express')

const app = express();
const path = require("path");
const serveIndex = require('serve-index');
const errorHandler = require('errorhandler');

const sassMiddleware = require('node-sass-middleware')
const transpileAnyMiddleware = require('transpile-any-middleware');

const babel = require("babel-core");
const babel_preset_env = require("babel-preset-env");

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
    src: 'src/main/babel',
    from: '*.js',
    dest: 'target/lib',
    to: '*.js',
    debug: true,
    force: true,
    transpiler: function (source, {req, file}) {
        console.log("user-agent:", req.headers['user-agent']);
        console.log("compiling: ", file);
        return {
            code,
            map,
            ast
        } = babel.transform(source, {
            sourceMaps: true,
            presets: [
                ["env", {
                    targets: {"chrome": 56}
                }]
            ],
            plugins: ["transform-decorators-legacy", "transform-es2015-modules-systemjs"]
        });
    },
    headers: {
        "Content-Type": "application/javascript"
    }
}));
app.use('/babel', express.static(path.join(__dirname, 'target/lib')));

/**
 * Static content & serve indices
 */
[
    '/node_modules',
    '/public',
    '/src/main',
    '/target',
    '/images',
].forEach(function (context) {
    app.use(context, express.static(path.join(__dirname, context)))
    app.use(context, serveIndex(path.join(__dirname, context)));
});

app.use(function (req, res, next) {
    var filename = path.basename(req.url);
    var extension = path.extname(filename);
    if (extension === '.css')
        console.log("The file " + filename + " was requested.");
    next();
});


app.use(errorHandler());

app.get('/', function (req, res) {
    res.send('Hello World!');
})

const EXPRESS_PORT = 8080;

app.listen(EXPRESS_PORT, function () {
    console.log('showcase server listening on port: ' + EXPRESS_PORT);
})