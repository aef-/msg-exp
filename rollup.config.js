import resolve from 'rollup-plugin-node-resolve'
import babel from 'rollup-plugin-babel'

export default {
  input: './src/index.js',
  name: 'message',
  plugins: [
    babel({
      externalHelpers: true,
      exclude: 'node_modules/**'
    })
  ],
  sourcemap: true,
  output: {
    file: 'dist/bundle.js',
    format: 'umd'
  },
}
