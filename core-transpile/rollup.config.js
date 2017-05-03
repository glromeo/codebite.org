// locate modules using the Node resolution algorithm, for using third party modules in node_modules
import nodeResolve from 'rollup-plugin-node-resolve';

export default {
    entry: 'lib/transpiler-template.js',
    format: 'umd',
    moduleName: 'TranspilerTemplate',
    dest: 'dist/transpiler-template.js',

    plugins: [
        nodeResolve({
            module: false,
            jsnext: false,
        })
    ],

    // skip rollup warnings (specifically the eval warning)
    onwarn: function() {}
};