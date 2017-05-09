import nodeResolve from "rollup-plugin-node-resolve";

export default {
    entry: 'src/node-es-module-loader.js',
    format: 'umd',
    moduleName: 'NodeESModuleLoader',
    dest: 'lib/node-es-module-loader.js',
    sourceMap: true,
    plugins: [
        nodeResolve()
    ]
};