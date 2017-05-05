var babel = require('babel-core');
var modulesRegister = require('babel-plugin-transform-es2015-modules-systemjs');
var importSyntax = require('babel-plugin-syntax-dynamic-import');

var SimpleModuleLoader = require("../lib/simple-module-loader");

require('source-map-support').install();

describe("SimpleModuleLoader", () => {

    it("uses the transpiler to resolve a file", function () {

        const loader = new SimpleModuleLoader();

        loader.config({
            transpilers: {
                "lib/**/*.js": {
                    source: "test/fixture",
                    target: "test/work",
                    force: true,
                    transpiler: function (from, to) {
                        let key = from.path;
                        return babel.transformFileSync(from.path, {
                            "sourceMaps": true,
                            "plugins": [importSyntax, modulesRegister]
                        })
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