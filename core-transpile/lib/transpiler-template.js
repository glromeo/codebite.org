'use strict';

const chokidar = require("chokidar");
const path = require("path");
const fs = require("fs");
const {ensureDirSync} = require("fs-extra");
const {
    relative,
    basename,
    dirname,
    resolve,
    extname
} = require("path");

const {Minimatch} = require("minimatch");

class TranspilerTemplate {

    constructor({match = "*", source = ".", target = ".", force = false}) {
        this.minimatch = new Minimatch(match);
        this.base = match.replace(/\/?\*.*/, "");
        this.ext = extname(match);
        this.source = resolve(source);
        this.target = resolve(target);
        this.force = force;
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

    reverse(path, key) {
        key = key.replace(extname(key), '') + this.ext;
        if (key.startsWith("./")) {
            return this.base + "/" + relative(this.target, path) + key.substring(1);
        } else {
            return this.base + "/" + relative(this.target, path) + "/" + key;
        }
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

        path = relative(this.base, path);
        console.log("relative path:", path);

        return this.locate(path).then(([from, to]) => {
            if (this.force || this.mustTranspile(from, to)) {
                console.log("transpiling from:", from.path, "to:", to.path);
                return Promise.resolve(this.transpile(from, to)).then(output => {
                    if (output === undefined) {
                        return to;
                    }
                    try {
                        this.save(output, from, to);
                    } catch (e) {
                        console.error("error writing transpiled file:", to.path, e);
                        throw e;
                    }
                    return Object.assign({path: to.path}, fs.statSync(to.path));
                });
            } else {
                return to;
            }
        });
    }

    locate(path) {
        return Promise.all([this.sourceFileInfo(path), this.targetFileInfo(path)]);
    }

    /**
     *
     * @param relativePath
     * @returns {Promise}
     */
    sourceFileInfo(relativePath) {

        let path = resolve(this.source, relativePath);

        return new Promise((ok, fail) => {

            const dir = dirname(path);
            const name = basename(path, extname(path));

            fs.readdir(dir, (err, files) => {
                if (err) {
                    fail("cannot find source file: " + path);
                } else {
                    const found = files.filter(file => basename(file, extname(file)) === name);

                    if (found.length === 1) {

                        path = resolve(dir, found[0]);
                        console.log("reading stats for source file:", path);

                        fs.stat(path, (err, stats) => {
                            if (err && err.code === 'ENOENT') {
                                fail("source file not found: " + path);
                            } else if (stats.isDirectory()) {
                                fail("source file is a directory: " + path);
                            } else {
                                ok({path: path, stats: stats});
                            }
                        });

                    } else {
                        fail("multiple source files found: " + JSON.stringify(found));
                    }
                }
            })
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

        return new Promise((ok, fail) => {
            let dir = dirname(path);
            if (!quick) try {
                ensureDirSync(dir);
            } catch (e) {
                fail("unable to create target dir: " + dir + ", error code: " + e);
            }
            console.log("reading stats for target file:", path);
            fs.stat(path, (err, stats) => {
                if (!err) {
                    if (stats.isDirectory()) {
                        fail("target file is a directory: " + path);
                    } else {
                        ok(Object.assign({path: path, stats: stats}));
                    }
                } else {
                    ok({path: path});
                }
            });
        });
    }

    mustTranspile(from, to) {
        return to.stats === undefined || from.stats.mtime > to.stats.mtime;
    }

    transpile(from, to) {
        console.error("ignored", from.path, "-> ", to.path);
    }

    save(output, from, to) {

        if (typeof output === "string") {
            output = {code: output};
        }

        const {code, map} = output;

        if (map) {

            map.path = to.path + ".map";

            if (map.file === "unknown") {
                map.file = basename(from.path);
                map.sourceRoot = this.sourceRoot;
                map.sources[0] = resolve(this.sourceRoot, relative(this.source, from.path));
            }

            fs.writeFile(map.path, JSON.stringify(map), (err) => {
                if (err) {
                    this.error("error writing map file:", map.path, err);
                } else {
                    console.log("written map file:", map.path);
                }
            })
            return fs.writeFileSync(to.path, code + '\n//# sourceMappingURL=' + to.path + ".map" + "\n//# sourceURL=" + from.path);
        } else {
            return fs.writeFileSync(to.path, code + "\n//# sourceURL=" + from.path);
        }
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