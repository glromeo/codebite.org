const {
    ModuleNamespace,
    RegisterLoader,
    NodeESModuleLoader,
    fileUrlToPath,
    pathToFileUrl
} = require("./node-es-module-loader");

const {resolve, dirname, normalize} = require('path');
const fs = require('fs');
const TranspilerTemplate = require("core-transpile");

module.exports = class SimpleModuleLoader extends NodeESModuleLoader {

    constructor() {
        super(...arguments);
    }

    config(options) {
        console.log("loaded loader config", options);

        this.transpilers = new Map();

        if (options.transpilers) for (let glob of Object.keys(options.transpilers)) {

            const cfg = options.transpilers[glob];

            const transpiler = new TranspilerTemplate(Object.assign({
                match: glob,
            }, cfg));
            transpiler.transpile = cfg.transpiler.bind(transpiler);

            this.transpilers.set(glob, transpiler);
        }
    }

    /**
     *
     * @param key
     * @param parent
     * @returns {Promise}
     */
    [RegisterLoader.resolve](key, parent) {

        for (let [glob, transpiler] of this.transpilers) {

            let path = key;

            if (parent !== undefined && key[0] === '.') {
                path = transpiler.reverse(dirname(parent.path), path);
            }
            if (transpiler.matches(path)) {
                console.log("found match for:", glob);
                return transpiler.resolve(path).then(file => {
                    console.log("simple loader resolved to:", file.path);
                    return file;
                });
            }
        }

        return super[RegisterLoader.resolve](key, parent);
    }

    /**
     *
     * @param key
     * @param processAnonRegister
     * @returns {*}
     */
    [RegisterLoader.instantiate](key, processAnonRegister) {

        if (typeof key === "object") {
            let {path} = key;
            return new Promise((resolve, reject) => {
                fs.readFile(path, 'utf-8', function (err, code) {
                    if (err) {
                        reject(err);
                    }
                    (0, eval)(code);
                    processAnonRegister();
                    resolve();
                });
            });
        }

        return super[RegisterLoader.instantiate](key, processAnonRegister);
    }
}
