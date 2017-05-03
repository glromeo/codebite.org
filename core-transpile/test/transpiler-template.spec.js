const assert = require("assert");
const chai = require("chai");
const fs = require("fs");
const fse = require("fs-extra");
const path = require("path");
const TranspilerTemplate = require("../lib/transpiler-template.js");

const chai_datetime = require("chai-datetime");

chai.use(chai_datetime);

describe("TranspilerTemplate", () => {

    assert.ok(fse.existsSync("node_modules"), "running at project root level");

    const resources = path.resolve("test/resources");
    const work = path.resolve("work");

    let options = {
        source: resources,
        target: work
    };
    let transpiler;

    describe("constructor", function () {
        it("resolves source and target to current working directory", function () {
            const helper = new TranspilerTemplate({source: "src", target: "out"});
            assert.equal(helper.source, path.resolve(".", "src"));
            assert.equal(helper.target, path.resolve(".", "out"));
        });
    })

    describe("match", function () {
        it("by default matches all files non recursively", function () {
            const tt = new TranspilerTemplate({});
            assert.ok(tt.matches("*.*"));
            assert.ok(tt.matches("name.ext"));
            assert.ok(!tt.matches("path/name.ext"));
        });
        it("matches local to parent", function () {
            const tt = new TranspilerTemplate({match: "path/subpath/*.*"});
            assert.ok(!tt.matches("file.ext"));
            assert.ok(!tt.matches("path/file.ext"));
            assert.ok(tt.matches("path/subpath/name.ext"));
        });
        it("matches according to base", function () {
            const tt = new class extends TranspilerTemplate {
                locate(file) {
                    assert.equal(file, "e/d/x.y");
                    return super.locate(file);
                }
                sourceFileInfo(file) {
                    assert.equal(path.relative(".", path.resolve(this.source, file)), "s/m/e/d/x.y");
                }
                targetFileInfo(file) {
                    assert.equal(path.relative(".", path.resolve(this.target, file)), "t/l/e/d/x.y");
                }
                error() {
                }
            }({match: "a/b/c/**/d/*.y", source: "s/m", target: "t/l"});
            return tt.accept("a/b/c/e/d/x.y");
        });
    });

    describe("sourceFileInfo", function () {

        before(function () {
            transpiler = new TranspilerTemplate(options);
        });

        it('fails if file not found (resolves path to src dir)', () => {
            let file = 'xyz';
            return transpiler.sourceFileInfo(file).then(resolve => {
                console.log("unexpected", resolve);
                assert.fail("rejection expected");
            }, rejection => {
                let expected = "file not found: " + path.resolve(resources, file);
                assert.equal(rejection, expected, "rejects with file not found");
            });
        });

        it('returns source file stat & other info if file present', () => {
            let srcFile = path.resolve(resources, 'sample.txt');
            return transpiler.sourceFileInfo(srcFile).then(function ({path, mtime}) {
                assert.equal(path, srcFile, "path is the source file absolute path");
                assert.ok(mtime, "has modification time");
            });
        });
    });

    describe("targetFileInfo", function () {

        before(function () {
            transpiler = new TranspilerTemplate(options);
        });

        beforeEach(function () {
            fse.removeSync(work);
            fse.mkdirSync(work);
        });

        afterEach(function () {
            fse.removeSync(work);
        });

        it('resolve to object with just path if file not found', () => {
            return transpiler.targetFileInfo('xyz').then(info => {
                assert.equal(1, Object.keys(info).length, "has only one property");
                assert.ok('path' in info, "info has path");
                assert.equal(info.path, path.resolve(work, "xyz"), "resolved to target dir");
            });
        });

        it('creates as many directories as necessary', () => {
            let base = path.resolve(work, "a");
            fs.mkdirSync(base);
            return transpiler.targetFileInfo('a/b/c/xyz').then(() => {
                assert.ok(fs.existsSync(path.resolve(base, "b/c")), "created two missing dir");
            });
        });

        it('fails if target file is a directory', () => {
            fs.mkdirSync(path.resolve(work, "xyz"));
            return transpiler.targetFileInfo('xyz').then(resolve => {
                console.log("unexpected", resolve);
                assert.fail("rejection expected");
            }, rejection => {
                assert.ok(rejection.startsWith("file is a directory:"));
            });
        });

        it('returns correct mtime', () => {
            let xyz = path.resolve(work, "xyz");
            fs.writeFileSync(xyz, "It's just a file!");
            return transpiler.targetFileInfo('xyz').then(info => {
                chai.assert.equalDate(info.mtime, fs.statSync(xyz).mtime);
            });
        });
    });

    describe("watch", function () {

        beforeEach(function () {
            fse.removeSync(work);
            fse.mkdirSync(work);
        });

        it('watch sets a pending watcher in the transpiler', function () {
            const watcher = transpiler.watch('.');
            assert.deepEqual(transpiler.watchers, [watcher], "only the watcher just created");
            transpiler.close();
            assert.ok(!transpiler.watchers, "no more watchers once closed");
        });

        it('watches using glob', function () {

            const EXPECTED_FILES = [
                "sample.txt",
                "dir/included.txt",
                "dir/inner/included.txt"
            ].length;

            transpiler = new class extends TranspilerTemplate {

                constructor() {
                    super(options);
                    this.pending = EXPECTED_FILES;
                    setTimeout(() => {
                        this.stop();
                        assert.equal(EXPECTED_FILES - this.pending, EXPECTED_FILES, "transpiled as many files as expected");
                    }, 2000);
                }

                transpile(from, to) {
                    assert.ok(path.isAbsolute(from.path), "from path is absolute");
                    assert.ok(from.path.startsWith(resources), "from path is in resources");
                    assert.ok(path.isAbsolute(to.path), "to path is absolute");
                    assert.ok(to.path.startsWith(work), "to path is in work");
                    return {
                        code: "Hi! " + this.pending
                    }
                }

                ready(file) {
                    console.log("ready:", file.path);
                    if (!--this.pending) this.stop();
                }
            };

            let watcher = transpiler.watch("**/*.txt");

            return new Promise(resolve => {
                transpiler.stop = resolve;
            }).catch(rejection => {
                fse.removeSync(work);
                assert.ok(false, rejection);
            });
        });

        it("watch deletes target file on source delete", function () {
            let count = 0;
            transpiler = new class extends TranspilerTemplate {
                constructor() {
                    super(options);
                }

                transpile() {
                    return ''; // if you don't implement a transpile method nothing happens!
                }

                ready(file) {
                    count++;
                    console.log("added:", file.path);
                }

                removed(file) {
                    console.log("removed:", file.path);
                    if (!--count) this.stop();
                }
            };

            transpiler.watch("*.test");

            fs.writeFileSync(path.resolve(resources, "one.test"), "one");
            fs.writeFileSync(path.resolve(resources, "two.test"), "two");

            setTimeout(function () {

                assert.equal(fs.readdirSync(work).length, 2, "has created two transpiled files");

                fs.unlinkSync(path.resolve(resources, "one.test"));
                fs.unlinkSync(path.resolve(resources, "two.test"));

            }, 100);

            return new Promise((resolve, reject) => {
                transpiler.stop = resolve;
            }).then(() => {
                fse.removeSync(work);
            });
        })
    });
})