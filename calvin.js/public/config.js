System.config({

    baseURL: "/public",
    defaultJSExtensions: true,
    transpiler: true,
    paths: {
        "npm:*": "@jspm/npm/*",
        "github:*": "@jspm/github/*",
        "decorators/*": "/babel/decorators/*",
        "calvin:*": "/babel/calvin/*",
        "node_modules:*": "/node_modules/*"
    },

    meta: {
        "npm:jquery/jquery.min.js": {
            "format": "global",
            "exports": "$"
        }
    },

    map: {
        "jexl": "node_modules:jexl/lib",
        "bluebird": "npm:bluebird@3.4.7",
        "calvin": "../target/lib/calvin",
        "github:jspm/nodelibs-assert@0.1.0": {
            "assert": "npm:assert@1.4.1"
        },
        "github:jspm/nodelibs-buffer@0.1.0": {
            "buffer": "npm:buffer@3.6.0"
        },
        "github:jspm/nodelibs-process@0.1.2": {
            "process": "npm:process@0.11.9"
        },
        "github:jspm/nodelibs-util@0.1.0": {
            "util": "npm:util@0.10.3"
        },
        "github:jspm/nodelibs-vm@0.1.0": {
            "vm-browserify": "npm:vm-browserify@0.0.4"
        },
        "npm:assert@1.4.1": {
            "assert": "github:jspm/nodelibs-assert@0.1.0",
            "buffer": "github:jspm/nodelibs-buffer@0.1.0",
            "process": "github:jspm/nodelibs-process@0.1.2",
            "util": "npm:util@0.10.3"
        },
        "npm:bluebird@3.4.7": {
            "process": "github:jspm/nodelibs-process@0.1.2"
        },
        "npm:buffer@3.6.0": {
            "base64-js": "npm:base64-js@0.0.8",
            "child_process": "github:jspm/nodelibs-child_process@0.1.0",
            "fs": "github:jspm/nodelibs-fs@0.1.2",
            "ieee754": "npm:ieee754@1.1.8",
            "isarray": "npm:isarray@1.0.0",
            "process": "github:jspm/nodelibs-process@0.1.2"
        },
        "npm:inherits@2.0.1": {
            "util": "github:jspm/nodelibs-util@0.1.0"
        },
        "npm:isarray@1.0.0": {
            "systemjs-json": "github:systemjs/plugin-json@0.1.2"
        },
        "npm:process@0.11.9": {
            "assert": "github:jspm/nodelibs-assert@0.1.0",
            "fs": "github:jspm/nodelibs-fs@0.1.2",
            "vm": "github:jspm/nodelibs-vm@0.1.0"
        },
        "npm:util@0.10.3": {
            "inherits": "npm:inherits@2.0.1",
            "process": "github:jspm/nodelibs-process@0.1.2"
        },
        "npm:vm-browserify@0.0.4": {
            "indexof": "npm:indexof@0.0.1"
        }
    }
});
