var HtmlWebpackPlugin = require('html-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var DisableOutputWebpackPlugin = require('disable-output-webpack-plugin');
var HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin');

var path = require('path');

module.exports = {
    entry: path.resolve(__dirname, "src/index.js"),
    mode: "development",
    output: {
        path: path.resolve(__dirname, 'bin'),
        filename: 'index_bundle.js'
    },
    plugins: [
        new DisableOutputWebpackPlugin(),

        new HtmlWebpackPlugin({
            filename: "index.html",
            template: path.resolve(__dirname, "src/template.html")
        }),
        new HtmlWebpackInlineSourcePlugin(),
        new CopyWebpackPlugin([
            {from: path.join(__dirname, 'node_modules', 'pixi.js', 'dist'), to: "lib"},
            {from: path.join(__dirname, 'src', 'index.js')}
            ], {})
    ]
};