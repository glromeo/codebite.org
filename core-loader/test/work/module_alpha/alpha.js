System.register(["./snake-case", "source-map-support/register"], function (_export, _context) {
    "use strict";

    var snakeCase;
    function HelloWorld() {
        return snakeCase("HelloWorld");
    }

    _export("HelloWorld", HelloWorld);

    return {
        setters: [function (_snakeCase) {
            snakeCase = _snakeCase.default;
        }, function (_sourceMapSupportRegister) {}],
        execute: function () {}
    };
});
//# sourceMappingURL=/Users/Gianluca/Workbench/Workspace/codebite.org/core-loader/test/work/module_alpha/alpha.js.map
//# sourceURL=/Users/Gianluca/Workbench/Workspace/codebite.org/core-loader/test/fixture/module_alpha/alpha.js