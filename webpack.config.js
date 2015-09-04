var path = require('path');
var webpack = require('webpack');
var BowerWebpackPlugin = require('bower-webpack-plugin');

module.exports = {
    // All source is relative to 'src' directory and bower/node modules
    resolve: {
        root: path.resolve('src'),
        modulesDirectories: ["node_modules", "bower_components"],
        extensions: ['', ".js", ".css", ".html", ".jade"]
    },
    entry: [ 'app', 'views/index.jade' ],
    output: {
        filename: 'bundle.js',
        path: path.join(__dirname, "dist"),
    },

    module: {
        loaders: [
            { test: /\.woff2$/,                      loader: "url-loader?limit=10000&mimetype=application/font-woff" },
            { test: /\.(woff|svg|ttf|eot)([\?]?.*)$/,loader: "file-loader?name=[name].[ext]"},
            { test: path.join(__dirname, 'js'),      loader: 'babel-loader'},
            { test: /\.less$/,                       loader: "style!css!less" },
            { test: /\.css$/,                        loader: "style!css" },
            { test: /\.png$/,                        loader: "url-loader?mimetype=image/png" },
            { test: /\.jade$/,                       loader: "jade-loader" },
            { test: /index\.jade$/,                  loader: "file-loader?name=[path][name].html&context=./src/views!jade-html-loader" },
        ]
    },
    plugins: [
       new BowerWebpackPlugin({
         excludes: /.*\.less/
       }),
       new webpack.ProvidePlugin({
         $:      "jquery",
         jQuery: "jquery",
         _:      "lodash",
         "window.jQuery": "jquery",
         "root.jQuery": "jquery",
       })
    ],
    node: {
         fs: "empty"  // required for jade-html-loader to work
    },
    stats: {
        colors: true
    },
};
