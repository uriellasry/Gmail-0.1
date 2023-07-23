const path = require('path');
const JavaScriptObfuscator = require('webpack-obfuscator');

module.exports = {
  mode: 'production',  // Switch to 'production' for minification and optimization
  target: 'electron-main',  // Specify Electron build target
  entry: './main.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.js',  // Output file will have the same name as the entry file
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  plugins: [
    new JavaScriptObfuscator({
      rotateStringArray: true
    }, ['*.js'])
  ],
  node: {
    __dirname: false,  // Fix for node global objects
    __filename: false
  },
};
