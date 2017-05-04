import nodeResolve from 'rollup-plugin-node-resolve';

export default {
  entry: 'lib/es-module-loader.src.js',
  format: 'umd',
  moduleName: 'EsModuleLoader',
  dest: 'lib/es-module-loader.js',

  plugins: [
    nodeResolve({
      module: false,
      jsnext: false,
    })
  ],

  // skip rollup warnings (specifically the eval warning)
  onwarn: function() {}
};