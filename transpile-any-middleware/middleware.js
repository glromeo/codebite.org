"use strict";

global.Promise = require("bluebird");

var fsp = require('fs-promise');
var path = require("path");

module.exports = function (options) {

    var debug = options.debug;

    let root = options.root || path.resolve('.');

    let transpiler = typeof options === "function" ? options : options.transpiler;
    if (!transpiler) {
        throw new Error("you must specify a transpiler function");
    }

    let srcDir = path.resolve(root, options.src || path.dirname(options.from || '.'));
    let fromExt = path.extname((options.from || options.ext || '').replace('\\*', ''));

    let outDir = path.resolve(root, options.dest || path.dirname(options.to || '.'));
    let toExt = path.extname((options.to || options.ext || '').replace('\\*', ''));

    let sourceRoot = path.posix.dirname('/' + path.posix.relative(root, srcDir));

    if (options.clean) {
        let destPath = path.resolve(root, outDir);
        console.log("cleaning contents of dest path:", destPath);
        rmTree(destPath, toExt);
    }

    let mustTranspile = options.force ? function (srcStats, destStats) {
        return true;
    } : function (srcStats, destStats) {
        return !destStats || srcStats.mtime > destStats.mtime;
    };

    let transpile = options.offline ? function transpileOffline(srcFile, destFile, context) {

        return Promise.resolve(transpiler(srcFile, destFile, context)).then(out => {
            out.file = destFile;
            return out;
        });

    } : function transpileInline(srcFile, destFile, context) {

        return fsp.readFile(srcFile).then(source => transpiler(source, context)).then(out => {

            if (typeof out === "string") {
                out = {
                    code: out
                };
            }

            let map = out.map;
            if (map) {
                let mapFile = destFile + ".map";
                if (map.file === "unknown") {
                    map.file = path.basename(srcFile);
                    map.sourceRoot = sourceRoot;
                    map.sources[0] = path.resolve(sourceRoot, path.relative(root, srcFile));
                    out.code += '\n//# sourceMappingURL=' + map.file + ".map";
                }
                fsp.writeFile(mapFile, JSON.stringify(map)).then(() => {
                    console.log("written map file:", mapFile)
                }, (rejection) => {
                    console.log("error writing map file:", mapFile, JSON.stringify(rejection));
                });
            }

            let saved = fsp.writeFile(destFile, out.code);

            if (options.quick !== false) {
                return out;
            } else {
                return saved.then(() => out);
            }
        });

    };

    function statSrcFile(srcFile) {
        return fsp.stat(srcFile);
    }

    function statDestFile(destFile) {
        return fsp.ensureDir(path.dirname(destFile)).then(() => {
            return fsp.stat(destFile).then(destStats => {
                if (debug) console.log("found dest file:", destFile, "last-modified:", destStats.mtime.toUTCString());
                return destStats;
            }, () => {
                if (debug) console.log("dest file:", destFile, "not found");
                return false;
            })
        });
    }

    /**
     * Middleware Function
     */
    return function transpileAnyMiddleware(req, res, next) {

        let requestPath = req.path;
        if (path.extname(requestPath) !== toExt) {
            if (debug) console.log("skipped:", requestPath);
            next();
            return;
        }

        let relativePath = path.relative("/", requestPath);

        let srcFile = path.resolve(srcDir, relativePath.replace(toExt, fromExt));
        let destFile = path.resolve(outDir, relativePath);

        Promise.join(statSrcFile(srcFile), statDestFile(destFile), function (srcStats, destStats) {

            if (mustTranspile(srcStats, destStats)) {
                return transpile(srcFile, destFile, {req, res, srcFile, destFile}).then(out => {
                    if (debug) console.log("transpiled from:", srcFile, "to:", destFile);
                    out.mtime = new Date();
                    return out;
                });
            } else {
                return {
                    mtime: destStats.mtime,
                    file: destFile
                }
            }

        }).then(out => {

            let headers = Object.assign({
                "Cache-Control": "max-age=0",
                "Content-Type": "text/plain"
            }, options.headers || {}, out.headers || {});
            Object.keys(headers).forEach(name => {
                res.header(name, headers[name]);
            });

            res.header("Last-Modified", out.mtime.toUTCString());

            if (out.file) {
                console.log("reading transpiled file");
                return fsp.readFile(out.file);
            } else {
                console.log("providing code directly");
                return out.code;
            }

        }).then(code => {

            console.log("sending transpiled content");
            res.send(code);

        }).catch(function (rejection) {

            console.log("transpile failed:", rejection);
            res.status(500).send(rejection);
        });
    }
};

function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

function rmTree(dirPath, ext) {
    return fsp.readdir(dirPath).then(files => {
        var cleaned = Promise.resolve();
        files.filter(file => path.extname(file) == ext).forEach(file => {
            var filePath = path.resolve(dirPath, file);
            cleaned = cleaned.then(() => fsp.stat(filePath).then(stats => {
                if (stats.isFile()) {
                    return fsp.unlink(filePath);
                } else {
                    return rmTree(filePath, ext);
                }
            }));
        });
        return cleaned.then(() => fsp.rmdir(dirPath));
    }, err => {
        console.error("unable to clean:", dirPath, err);
    });
};
