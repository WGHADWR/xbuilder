const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')

const output_path = 'dist'

module.exports = {
  mode: 'production',

  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, output_path),
    filename: 'index.js'
  },

  resolve: {
    extensions: ['.js'] // , '.json']
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          { loader: 'babel-loader' }
        ]
      }
      /*,
      {
        test: /\.json$/,
        loader: 'json-loader'
      }*/
    ]
  },

  plugins: [
    new CopyWebpackPlugin([{
      from: path.resolve(__dirname, './src/*.json'),
      to: path.resolve(__dirname, output_path),
      flatten: true
    }])
    // }, {
    //   from: path.resolve(__dirname, './scripts'),
    //   to: path.resolve(__dirname, output_path, 'scripts')
    // }])
  ],

  target: 'node',
  context: __dirname,
  node: {
    __filename: false,
    __dirname: false
  }

};
