const express = require("express");
const path = require("path");
const serveIndex = require("serve-index");

const app = express();

app.use(transpileAnyMiddleware({
    src: 'src/main/babel',
    from: '*.js',
    dest: 'target/lib',
    to: '*.js',
    debug: true,
    force: true,
    transpiler: function (source, {req, file}) {
        console.log("user-agent:", req.headers['user-agent']);
        console.log("compiling:", file || req.path);
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

app.use(express.static(path.join(__dirname, 'target/lib')));

app.use(express.static(path.join(__dirname, 'target/lib')));
