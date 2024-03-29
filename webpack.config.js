var path               = require('path');
var webpack            = require('webpack');
var BowerWebpackPlugin = require('bower-webpack-plugin');
var buildPath          = path.resolve(__dirname, 'public', 'build');
var moduleDirectories  = ["node_modules", "bower_components"];

var config = {
    resolve: {
        root: path.resolve('public/'),
        modulesDirectories: moduleDirectories,
        extensions: ['', ".js", ".css", ".html", ".jade"]
    },
    entry: [
      'main.js',
      './public/views/index.jade',
    ],
    output: {
        filename: 'bundle.js',
        path: path.join(__dirname, "dist"),
    },

    module: {
        loaders: [
            { test: /\.(woff|woff2|svg|ttf|eot)([\?]?.*)$/,loader: "file-loader?name=[name].[ext]"},
            { test: path.join(__dirname, 'js'),            loader: 'babel-loader', excludes: [moduleDirectories]},
            { test: /\.less$/,                             loader: "style!css!less" },
            { test: /\.css$/,                              loader: "style!css" },
            { test: /\.png$/,                              loader: "url-loader?mimetype=image/png" },
            { test: /\.jade$/,                             loader: "jade-loader" },
            { test: /index\.jade$/,                        loader: "file-loader?name=[name].html&./public/views!jade-html-loader" },
        ]
    },
    plugins: [
       new BowerWebpackPlugin({
         excludes: /.*\.less/
       }),
       new webpack.ProvidePlugin({
         $               : "jquery",
         jQuery          : "jquery",
         "window.jQuery" : "jquery",
         "window.$"      : "jquery",
         "root.jQuery"   : "jquery",
         _               : "lodash",
       })
    ],
    node:    {fs: "empty"},  // required for jade-html-loader to work
    stats:   {colors: true},
    //devtool: 'eval-source-map',
    context: __dirname,
};

module.exports = config;
