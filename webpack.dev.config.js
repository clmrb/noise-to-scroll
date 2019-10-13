const path = require('path');

module.exports = {
    mode: 'development',
    devtool: "eval-source-map",
    entry: './src/noise-to-scroll.js',
    output: {
        publicPath: "/",
        path: path.resolve(__dirname, 'dist'),
        filename: 'noise-to-scroll.js',
        library: 'noiseToScroll',
        libraryTarget: 'umd'
    },
    devServer: {
        contentBase: __dirname
    },
    module: {
        rules: [
            {
                test: /\.m?js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ]
    }
};