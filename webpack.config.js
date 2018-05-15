const webpack = require("webpack");
const path = require("path");
const ExtractTextWebpackPlugin = require("extract-text-webpack-plugin");

const config = {
    entry: './src/ql-mentions.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'ql-mentions.js'
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
        new ExtractTextWebpackPlugin("ql-mentions.css")
    ]
  
};

module.exports = config;