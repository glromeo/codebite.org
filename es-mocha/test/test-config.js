loader.config({
    transpilers: {
        "lib/**/*.js": {
            src: "test/fixture/${path}/${basename}.src.${ext}",
            target: "test/work/${}",
            transpiler: function (source) {
                return {
                    code: source
                }
            }
        }
    }
});
