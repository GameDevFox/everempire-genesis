const webpack = require('webpack');

module.exports = {
    target: 'node',
    module: {
        loaders: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'eslint-loader',
                enforce: 'pre'
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loaders: 'babel-loader'
            },
        ]
    },
    entry: './src/index.js',
    output: {
        filename: 'dist/index.js'
    }
};