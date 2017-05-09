const {
    ModuleNamespace,
    RegisterLoader,
    NodeESModuleLoader,
    fileUrlToPath,
    pathToFileUrl
} = require("./node-es-module-loader");

const dirname = require('path').dirname;
const fs = require('fs');
const TranspilerTemplate = require("core-transpile");

const sourceMapFiles = new Map();

require('source-map-support').install({
    retrieveSourceMap: function (url) {
        let file = sourceMapFiles.get(url);
        if (file) {
            return {
                url: url,
                map: fs.readFileSync(file, 'utf-8')
            };
        } else {
            return null;
        }
    }
});

/**
 * TODO: Somewhere in NodeESModuleLoader it expects a string (file url?) or won't instantiate it... investigate!
 */
class Resolution extends String {

    constructor(path, transpiler) {

        super(pathToFileUrl(path));

        const dir = dirname(path);

        this.resolve = function (key) {
            return transpiler.resolve(transpiler.reverse(dir, key)).then(file => {
                return new Resolution(file.path, transpiler);
            });
        };

        this.instantiate = function (processAnonRegister) {
            return new Promise((resolve, reject) => {
                fs.readFile(path, 'utf-8', function (err, code) {
                    if (err) {
                        console.error("cannot read file:", path, err);
                        reject(err);
                    } else {
                        (0, eval)(code);
                        processAnonRegister();
                        resolve();
                    }
                });
            });
        }
    }
}

module.exports = class SimpleModuleLoader extends NodeESModuleLoader {

    constructor() {
        super(...arguments);
        this.trace = true;
        this.transpilers = new Map();
    }

    config(options) {
        if (options.transpilers) for (let glob of Object.keys(options.transpilers)) {

            const config = options.transpilers[glob];
            const transpile = config.transpiler;

            this.transpilers.set(glob, new class extends TranspilerTemplate {
                transpile(from, to) {
                    sourceMapFiles.set(from.path, to.path + ".map");
                    return transpile.call(this, from, to);
                }
            }(Object.assign({match: glob}, config)));

            console.log("configured transpiler for:", glob);
        }
        return this;
    }

    /**
     *
     * @param key
     * @param parentKey
     * @returns {Promise}
     */
    [RegisterLoader.resolve](key, parentKey) {

        if (parentKey instanceof Resolution) {
            return parentKey.resolve(key).catch(err => {
                console.log("parent error:", err);
                return this[RegisterLoader.resolve]("test/fixture/"+key+".js", parentKey.toString()); // TODO: generalize...
            }).catch(err => {
                console.log("default:", err);
                return super[RegisterLoader.resolve](key, parentKey);
            });
        }

        for (let [glob, transpiler] of this.transpilers) {
            console.log("trying:", glob, "for:", key);
            if (transpiler.matches(key)) {
                console.log("key:", key, "matched by:", glob);
                return transpiler.resolve(key).then(file => {
                    return new Resolution(file.path, transpiler);
                });
            }
        }

        return super[RegisterLoader.resolve](key, parentKey);
    }

    /**
     *
     * @param key
     * @param processAnonRegister
     * @returns {*}
     */
    [RegisterLoader.instantiate](key, processAnonRegister) {

        if (key instanceof Resolution) {
            return key.instantiate(processAnonRegister);
        }

        return super[RegisterLoader.instantiate](key, processAnonRegister);
    }
};
