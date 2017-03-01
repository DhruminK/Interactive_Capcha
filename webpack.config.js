var webpack = require('webpack');

module.exports = {
    entry: './assets/main.js',
    output: {
        filename: './public/bundle/bundle.min.js'
    },
    watch: true,
    module: {
        loaders: [{
            test: /\.js$/,
            loader: 'babel',
            query: {
                presets: ['es2015']
            }
        },
        {
            test: /\.json$/,
            loader: 'json'
        },
        {
            test: /\.css$/,
            loader: 'style!css'
        },
        {
            test: /\.(eot|svg|ttf|woff|woff2)$/,
            loader: 'file?name=public/bundle/fonts/[name].[ext]'
        }]
    },

    plugins: [
        new webpack.ProvidePlugin({
            $: "jquery"
        })
    ]
};
