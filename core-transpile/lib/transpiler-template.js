'use strict';

const chokidar = require("chokidar");
const path = require("path");
const fs = require("fs");
const fse = require("fs-extra");
const {dirname, resolve} = require("path");

const {Minimatch} = require("minimatch");

module.exports = class TranspilerTemplate {

    constructor({match = "*.*", source = ".", target = "."}) {
        this.minimatch = new Minimatch(match);
        this.base = match.split('**')[0];
        this.source = resolve(source);
        this.target = resolve(target);
    }

    log() {
        console.log(...arguments);
    }

    error() {
        console.error(...arguments);
    }

    matches(key) {
        return this.minimatch.match(key);
    }

    accept(key) {
        if (this.matches(key)) {
            let file = path.relative(this.base, key);
            return this.handle(file);
        }
    }

    sourceFileInfo(file) {

        file = resolve(this.source, file);

        return new Promise((resolve, reject) => {
            fs.stat(file, (err, stat) => {
                if (err && err.code === 'ENOENT') {
                    reject("file not found: " + file);
                } else if (stat.isDirectory()) {
                    reject("file is a directory: " + file);
                } else {
                    resolve(Object.assign({path: file}, stat));
                }
            });
        });
    }

    targetFileInfo(file, quick) {

        file = resolve(this.target, file);

        return new Promise((resolve, reject) => {
            let dir = dirname(file);
            if (!quick) try {
                fse.ensureDirSync(dir);
            } catch (e) {
                reject("unable to create dir: " + dir + ", error code: " + e);
            }
            fs.stat(file, (err, stat) => {
                if (!err) {
                    if (stat.isDirectory()) {
                        reject("file is a directory: " + file);
                    } else {
                        resolve(Object.assign({path: file}, stat));
                    }
                } else {
                    resolve({path: file});
                }
            });
        });
    }

    watch(pattern) {

        let watcher = chokidar.watch(pattern, {cwd: this.source});

        watcher.on('all', (event, file) => {
            switch (event) {
                case 'add':
                    this.handle(file);
                    break;
                case 'change':
                    break;
                case 'unlink':
                    this.targetFileInfo(resolve(this.target, file)).then(info => {
                        fs.unlinkSync(info.path);
                        this.removed(info);
                    }).catch(
                        this.error
                    );
                    break;
            }
        });

        (this.watchers = this.watchers || []).push(watcher);

        return watcher;
    }

    handle(file) {
        return this.locate(file).then(([from, to]) => {
            if (!this.mustTranspile(from, to)) {
                return to;
            } else {
                return Promise.resolve(this.transpile(from, to)).then(output => {
                    if (output === undefined) {
                        return to;
                    }
                    try {
                        this.save(output, from, to);
                        this.log("transpiled from:", from.path, "to:", to.path);
                    } catch (e) {
                        this.error("error writing transpiled file:", to.path, err.code);
                        throw e;
                    }
                    return Object.assign({path: to.path}, fs.statSync(to.path));
                });
            }
        }).then(file => {
            this.ready(file);
        }).catch(
            this.error
        );
    }

    locate(file) {
        return Promise.all([this.sourceFileInfo(file), this.targetFileInfo(file)]);
    }

    close() {
        if (this.watchers) for (let watcher of this.watchers) {
            watcher.close();
        }
        delete this.watchers;
    }

    mustTranspile(from, to) {
        return !to.mtime || from.mtime > to.mtime;
    }

    resolve() {

    }

    transpile(from, to) {
        this.error("ignored", from.path, "-> ", to.path);
    }

    transform(source) {
        return {}
    }

    save(output, from, to) {

        if (typeof output === "string") {
            output = {code: output};
        }

        const {code, map} = output;

        if (map && this.sourceMaps) {

            map.path = to.path + ".map";

            if (map.file === "unknown") {
                map.file = path.basename(from.path);
                map.sourceRoot = this.sourceRoot;
                map.sources[0] = resolve(this.sourceRoot, path.relative(this.source, from.path));

                output.code += '\n//# sourceMappingURL=' + map.file + ".map";
            }

            try {
                this.log("written map file:", map.path)
                this.error("error writing map file:", map.path, e);
            } catch (e) {
                err("error writing map file:", map.path, e);
            }
        }

        return fs.writeFileSync(to.path, code);
    }

    ready(file) {
        this.log("transpiled", file.path);
    }
}
