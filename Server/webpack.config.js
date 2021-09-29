var webpack = require('webpack');
var path = require('path');
var fs = require('fs');
var UglifyJSPlugin = require('uglifyjs-webpack-plugin');

var nodeModules = {};
fs.readdirSync('node_modules')
    .filter(function (x) {
        return ['.bin'].indexOf(x) === -1;
    })
    .forEach(function (mod) {
        nodeModules[mod] = 'commonjs ' + mod;
    });

module.exports = {
    entry: './src/server.js',
    target: 'node',
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'Alumni.js',
        publicPath:path.join(__dirname, 'dist'),
    },
    module: {
        rules: [
            {
                test: /\.(woff|woff2|eot|ttf|svg|jpg|png|ico)(\?.+)?$/,
                loader: 'file-loader',
                options: {
                    name: '[name].[ext]',
                }
           },
        ]
    },
    externals: nodeModules,
    plugins: [
        new webpack.IgnorePlugin(/\.(css|less)$/),
        new UglifyJSPlugin({
            cache: true,
            parallel: true,
            uglifyOptions: {
                compress: true,
                ecma: 6,
                mangle: true
            },
            extractComments: true,
            sourceMap: true
        }),
    ],
    devtool: 'sourcemap'
}