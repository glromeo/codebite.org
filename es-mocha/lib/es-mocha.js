import chokidar from "chokidar";

import fs from "fs";
import Mocha from "mocha";
import path from "path";

const root = path.resolve('.', 'test');
console.log("tests root:", root);

const runner = new Mocha(global.cli_arguments);

runner.suite.emit('pre-require', global, 'global-mocha-context', runner);

const home = path.resolve(root, 'modules');
const base = path.relative('.', home);
console.log("watch:", base);

const pattern = "**/*.js";
console.log("pattern:", pattern);

const watcher = chokidar.watch(pattern, {cwd: home});

let testConfig = path.resolve(root, 'test-config.js');
if (fs.existsSync(testConfig)) {
    loader.import(testConfig).catch(throwRejection);
}

watcher.on('all', (event, file) => {
    file = path.join(base, file);
    switch (event) {
        case 'add':
            loader.import(file).then(function () {
                runner.run();
            }).catch(function (err) {
                console.error(err);
                setTimeout(function () {
                    throw err;
                });
            });
            break;
    }
});
