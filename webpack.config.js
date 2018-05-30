const nodemon = require('gulp-nodemon')
const path = require('path')
const webpack = require('webpack')
const ProgressBarPlugin = require('progress-bar-webpack-plugin')

module.exports = {
  entry: './client/js/main.js',
  output: {
    path: path.resolve(__dirname, 'client'),
    filename: 'bundle.js'
  },
  devtool: 'eval', // DEBUG / SOURCEMAP
  plugins: [
    new webpack.ExtendedAPIPlugin(),
    new ProgressBarPlugin()
  ],
  watch: true
}

nodemon({
  script: './hosting/opeNodeHttp.js',
  ext: 'js',
  env: { 'NODE_ENV': 'debug' }
}).on('restart', () => {})
