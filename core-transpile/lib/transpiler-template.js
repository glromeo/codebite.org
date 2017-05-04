'use strict';

const chokidar = require("chokidar");
const path = require("path");
const fs = require("fs");
const fse = require("fs-extra");
const {relative, basename, dirname, resolve} = require("path");

const {Minimatch} = require("minimatch");

class TranspilerTemplate {

    constructor({match = "*.*", source = ".", target = "."}) {
        this.minimatch = new Minimatch(match);
        this.base = match.split('**')[0];
        this.source = resolve(source);
        this.target = resolve(target);
    }

    error() {
        console.error(...arguments);
    }

    /**
     *
     * @param path
     * @returns {true if path is handled by this transpiler}
     */
    matches(path) {
        return this.minimatch.match(path);
    }

    /**
     *
     * @param path
     * @returns {Promise}
     */
    accept(path) {
        if (this.matches(path)) return this.resolve(path);
    }

    resolve(path) {
        return this.locate(relative(this.base, path)).then(([from, to]) => {
            if (this.mustTranspile(from, to)) {
                return Promise.resolve(this.transpile(from, to)).then(output => {
                    if (output === undefined) {
                        return to;
                    }
                    try {
                        this.save(output, from, to);
                        console.log("transpiled from:", from.path, "to:", to.path);
                    } catch (e) {
                        console.error("error writing transpiled file:", to.path, err.code);
                        throw e;
                    }
                    return Object.assign({path: to.path}, fs.statSync(to.path));
                });
            } else {
                return to;
            }
        });
    }

    locate(file) {
        return Promise.all([this.sourceFileInfo(file), this.targetFileInfo(file)]);
    }

    /**
     *
     * @param relativePath
     * @returns {Promise}
     */
    sourceFileInfo(relativePath) {

        const path = resolve(this.source, relativePath);

        return new Promise((resolve, reject) => {
            fs.stat(path, (err, stat) => {
                if (err && err.code === 'ENOENT') {
                    reject("file not found: " + path);
                } else if (stat.isDirectory()) {
                    reject("file is a directory: " + path);
                } else {
                    resolve(Object.assign({path: path}, stat));
                }
            });
        });
    }

    /**
     *
     * @param relativePath
     * @param quick
     * @returns {Promise}
     */
    targetFileInfo(relativePath, quick) {

        const path = resolve(this.target, relativePath);

        return new Promise((resolve, reject) => {
            let dir = dirname(path);
            if (!quick) try {
                fse.ensureDirSync(dir);
            } catch (e) {
                reject("unable to create dir: " + dir + ", error code: " + e);
            }
            fs.stat(path, (err, stat) => {
                if (!err) {
                    if (stat.isDirectory()) {
                        reject("file is a directory: " + path);
                    } else {
                        resolve(Object.assign({path: path}, stat));
                    }
                } else {
                    resolve({path: path});
                }
            });
        });
    }

    mustTranspile(from, to) {
        return !to.mtime || from.mtime > to.mtime;
    }

    transpile(from, to) {
        console.error("ignored", from.path, "-> ", to.path);
    }

    exec({code, map, ast}, path) {
        return true;
    }

    save(output, from, to) {

        if (typeof output === "string") {
            output = {code: output};
        }

        const {code, map} = output;

        if (map && this.sourceMaps) {

            map.path = to.path + ".map";

            if (map.file === "unknown") {
                map.file = basename(from.path);
                map.sourceRoot = this.sourceRoot;
                map.sources[0] = resolve(this.sourceRoot, relative(this.source, from.path));

                output.code += '\n//# sourceMappingURL=' + map.file + ".map";
            }

            try {
                console.log("written map file:", map.path);
                console.error("error writing map file:", map.path, e);
            } catch (e) {
                err("error writing map file:", map.path, e);
            }
        }

        return fs.writeFileSync(to.path, code);
    }

    ready(file) {
        console.log("transpiled", file.path);
    }

    /**
     *
     * @param pattern
     */
    watch(pattern) {

        let watcher = chokidar.watch(pattern, {cwd: this.source});

        watcher.on('all', (event, file) => {
            switch (event) {
                case 'add':
                    this.resolve(file).then(file => {
                        this.ready(file);
                    }).catch(error => {
                        console.error(error);
                    });
                    break;
                case 'change':
                    break;
                case 'unlink':
                    this.targetFileInfo(resolve(this.target, file)).then(info => {
                        fs.unlinkSync(info.path);
                        this.removed(info);
                    }).catch(error => {
                        console.error(error);
                    });
                    break;
            }
        });

        (this.watchers = this.watchers || []).push(watcher);

        return watcher;
    }

    close() {
        if (this.watchers) for (let watcher of this.watchers) {
            watcher.close();
        }
        delete this.watchers;
    }
}

module.exports = TranspilerTemplate;