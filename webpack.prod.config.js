const path = require('path');

module.exports = {
    mode: 'production',
    entry: './src/noise-to-scroll.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'noise-to-scroll.min.js',
        library: 'noiseToScroll',
        libraryTarget: 'umd'
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