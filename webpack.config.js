require('dotenv').config();
const path = require('path');
const webpack = require('webpack');

const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');
const WebpackNotifierPlugin = require('webpack-notifier');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const StatsWriterPlugin = require("webpack-stats-plugin").StatsWriterPlugin;

const production = process.env.NODE_ENV === 'production';
const hmr = process.argv.includes('--hmr');
const browserSync = process.argv.includes('--browsersync');

const webpackDevServerPort = parseInt(process.env.WEBPACKDEVSERVER_PORT, 10);
const browserSyncPort = parseInt(process.env.BROWSERSYNC_PORT, 10);
const targetPort = browserSync ? browserSyncPort : webpackDevServerPort;

module.exports = {
  entry: {
    app: [
      './assets/js/app.js',
      './assets/sass/app.scss'
    ]
  },
  output: {
    path: __dirname + '/public',
    filename: production ? 'dist/js/[name].[chunkhash].js' : 'js/[name].js',
    publicPath: hmr ? `http://localhost:${targetPort}/` : '/'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader?cacheDirectory'
      },
      {
        test: /\.(png|jpg|gif)$/,
        loader: 'file-loader',
        options: {
          name: 'images/[name].[ext]?[hash]',
          publicPath: '/'
        }
      },
      {
        test: /\.(woff2?|ttf|eot|svg|otf)$/,
        loader: 'file-loader',
        options: {
          name: 'fonts/[name].[ext]?[hash]'
        }
      }
    ]
  },
  plugins: [
    new CopyWebpackPlugin([
      { from: 'node_modules/bootstrap-sass/assets/fonts/bootstrap', to: 'fonts' },
      { from: 'node_modules/font-awesome/fonts', to: 'fonts' },
      { from: 'node_modules/slick-carousel/slick/fonts', to: 'fonts' },
      { from: 'node_modules/slick-carousel/slick/ajax-loader.gif', to: 'images' }
    ]),
    new FriendlyErrorsWebpackPlugin(),
    new webpack.LoaderOptionsPlugin({
      minimize: production,
      options: {
        postcss: [
          require('autoprefixer')
        ],
        context: __dirname,
        output: { path: './' }
      }
    }),
    new WebpackNotifierPlugin()
  ],
  performance: {
    hints: false
  },
  devtool: production ? '#source-map' : '#inline-source-map'
};

if (production) {
  module.exports.module.rules.push({
    test: /\.scss$/,
    loader: ExtractTextPlugin.extract({
      fallbackLoader: 'style-loader',
      loader: [
        'css-loader',
        'postcss-loader',
        'resolve-url-loader',
        'sass-loader?sourceMap&precision=8'
      ]
    })
  });

  module.exports.plugins = (module.exports.plugins || []).concat([
    new CleanWebpackPlugin(['dist'], {
      root: __dirname + '/public'
    }),
    new ExtractTextPlugin('dist/css/[name].[chunkhash].css'),
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: true,
      compress: {
        warnings: false
      }
    }),
    new StatsWriterPlugin({
      filename: "dist/manifest.json",
      transform: function (data, opts) {
        return JSON.stringify({
          js: data.assetsByChunkName.app[0],
          css: data.assetsByChunkName.app[1]
        }, null, 2);
      }
    })
  ]);
}
else {
  module.exports.module.rules.push({
    test: /\.scss$/,
    loader: [
      'style-loader',
      'css-loader',
      'postcss-loader',
      'resolve-url-loader',
      'sass-loader?sourceMap&precision=8'
    ]
  });

  if (hmr) {
    module.exports.entry.app.push(
      `webpack-dev-server/client?http://localhost:${targetPort}/`,
      'webpack/hot/dev-server'
    );

    module.exports.plugins = (module.exports.plugins || []).concat([
      new webpack.HotModuleReplacementPlugin(),
      new webpack.NoEmitOnErrorsPlugin()
    ]);
  }
}
