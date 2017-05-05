import nodeResolve from "rollup-plugin-node-resolve";
import cleanup from "rollup-plugin-cleanup";

export default {
    entry: 'src/node-es-module-loader.js',
    format: 'umd',
    moduleName: 'NodeESModuleLoader',
    dest: 'lib/node-es-module-loader.js',

    plugins: [
        nodeResolve(),
        cleanup()
    ],

    // skip rollup warnings (specifically the eval warning)
    onwarn: function () {
    }
};