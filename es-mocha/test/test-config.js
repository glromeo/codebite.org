const babel = require('babel-core');
const modulesRegister = require('babel-plugin-transform-es2015-modules-systemjs');
const importSyntax = require('babel-plugin-syntax-dynamic-import');
const path = require("path");

const SimpleModuleLoader = require('core-loader');

loader.config({
    transpilers: {
        "test/modules/**/*.js": {
            source: path.resolve(__dirname, "modules"),
            target: path.resolve(__dirname, "../work"),
            force: false,
            transpiler: function (from, to) {
                let key = from.path;
                return babel.transformFileSync(from.path, {
                    "sourceMaps": true,
                    "plugins": [importSyntax, modulesRegister]
                });
            }
        },
        "test/fixture/**/*.js": {
            source: path.resolve(__dirname, "fixture"),
            target: path.resolve(__dirname, "../work"),
            force: false,
            transpiler: function (from, to) {
                let key = from.path;
                return babel.transformFileSync(from.path, {
                    "sourceMaps": true,
                    "plugins": [importSyntax, modulesRegister]
                });
            }
        }
    }
});
