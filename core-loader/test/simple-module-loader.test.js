var babel = require('babel-core');
var modulesRegister = require('babel-plugin-transform-es2015-modules-systemjs');
var importSyntax = require('babel-plugin-syntax-dynamic-import');
var path = require("path");

var SimpleModuleLoader = require("../lib/simple-module-loader");

describe("SimpleModuleLoader", () => {

    it("uses the transpiler to resolve a file", function () {

        const loader = new SimpleModuleLoader();

        loader.config({
            transpilers: {
                "lib/**/*.js": {
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

        return loader.import("lib/module_alpha/alpha.js").then(m => {
            console.log(...arguments);
            m.HelloWorld();
        });
    });
});