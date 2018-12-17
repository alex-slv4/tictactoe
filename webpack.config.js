var HtmlWebpackPlugin = require('html-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var path = require('path');

module.exports = {
    entry: path.resolve(__dirname, "src/index.js"),
    mode: "development",
    output: {
        path: path.resolve(__dirname, 'bin'),
        filename: 'index_bundle.js'
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, "src/template.html")
        }),
        new CopyWebpackPlugin([{from: path.join(__dirname, 'node_modules', 'pixi.js', 'dist'), to: "lib"}], {})
    ]
};