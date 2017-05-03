import nodeResolve from 'rollup-plugin-node-resolve';

export default {
  entry: 'src/simple-module-loader.js',
  format: 'umd',
  moduleName: 'SimpleModuleLoader',
  dest: 'lib/simple-module-loader.js',

  plugins: [
    nodeResolve({
      module: false,
      jsnext: false,
    })
  ],

  // skip rollup warnings (specifically the eval warning)
  onwarn: function() {}
};