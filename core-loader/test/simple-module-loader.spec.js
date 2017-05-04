var babel = require('babel-core');
var modulesRegister = require('babel-plugin-transform-es2015-modules-systemjs');
var importSyntax = require('babel-plugin-syntax-dynamic-import');

var SimpleModuleLoader = require("../lib/simple-module-loader");

describe("SimpleModuleLoader", () => {

    it("uses the transpiler to resolve a file", function () {

        const loader = new SimpleModuleLoader();

        loader.config({
            transpilers: {
                "lib/**/*.js": {
                    source: "test/fixture",
                    target: "test/work",
                    transpiler: function (from, to) {
                        let key = from.path;
                        return babel.transformFileSync(from.path, {
                            compact: false,
                            filename: key + '!transpiled',
                            sourceFileName: key,
                            moduleIds: false,
                            sourceMaps: 'both',
                            plugins: [importSyntax, modulesRegister],
                            extends: loader.rcPath
                        })
                    }
                }
            }
        });

        loader.import("lib/module_alpha/alpha.js").then(console.log.bind(console)).catch(console.error.bind(console));
    });
});