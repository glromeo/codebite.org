import * as babel from "babel-core";
import * as fs from "fs";
import * as path from "path";

import SystemRegisterLoader from "system-register-loader/src/system-register-loader";
import TranspilerTemplate from "../lib/TranspilerTemplate";
import * as assert from "assert";

describe("system-register-loader", function () {

    const resources = path.resolve(__dirname, "resources");
    const work = path.resolve("work");

    let options = {
        source: resources,
        target: work
    };

    let transpiler = new TranspilerTemplate(options);

    const babelrc = JSON.parse(fs.readFileSync(".babelrc"));
    babelrc.plugins.push("transform-es2015-modules-systemjs");

    const resolveHook = SystemRegisterLoader.prototype["resolve"];
    SystemRegisterLoader.prototype["resolve"] = function (key, parent) {
        var resolved;
        if (fs.existsSync(key)) {
            resolved = resolveHook.call(this, key, parent || this.baseKey);
        } else {
            resolved = resolveHook.call(this, path.resolve('node_modules', key, "package.json"), parent || this.baseKey);
        }
        if (!resolved) {
            throw new RangeError('System.register loader does not resolve plain module names, resolving "' + key + '" to ' + parent);
        }
        return resolved;
    };

    const instantiateHook = SystemRegisterLoader.prototype[SystemRegisterLoader.prototype.instantiate];
    SystemRegisterLoader.prototype[SystemRegisterLoader.prototype.instantiate] = function (key, processAnonRegister) {
        console.log("instantiate", key, processAnonRegister);
        instantiateHook.call(this, key, processAnonRegister);
    };

    const loader = new SystemRegisterLoader();

    it("loads relative path", () => new Promise((resolve, reject) => {

        const transpiler = new class extends TranspilerTemplate {

            constructor() {
                super(options);
            }

            transpile(from, to) {
                return babel.transform(fs.readFileSync(from.path), babelrc);
            }

            ready(file) {
                loader.import(file.path).then(function (m) {
                    console.log(m);
                    resolve(m);
                }, function (e) {
                    console.error(e);
                    reject(m);
                });
            }

        }();

        transpiler.watch("**/*.js");


    }).then(function (m) {
        assert.equal(m.default.name, 'C');
        assert.ok(m.enumerable);

        return loader.import("chokidar").then(console.log.bind(console), console.error.bind(console))
    }))
})

