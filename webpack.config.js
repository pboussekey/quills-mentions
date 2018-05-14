const webpack = require("webpack");
const path = require("path");
const ExtractTextWebpackPlugin = require("extract-text-webpack-plugin");

const config = {
    entry: './src/quill-mentions.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'quill-mentions.js'
    },
    module: {
        rules: [{
          test: /\.js$/,
          exclude: /node_modules/,
          loader: "babel-loader"
        },
       {
        test: /\.scss$/,
        use: ExtractTextWebpackPlugin.extract({
          fallback: 'style-loader',
          use: ['css-loader', 'sass-loader', 'postcss-loader'],
        })
      }]
    },
    plugins: [
        new ExtractTextWebpackPlugin("ql-mention.css")
    ]
  
};

module.exports = config;