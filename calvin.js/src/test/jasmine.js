System.register(["jspm"], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var jspm_1;
    var SystemJS;
    return {
        setters:[
            function (jspm_1_1) {
                jspm_1 = jspm_1_1;
            }],
        execute: function() {
            SystemJS = new jspm_1.default.Loader();
            global.System = global.SystemJS = SystemJS; // For middleware
            global.helperPromises = [];
        }
    }
});
//# sourceMappingURL=jasmine.js.map