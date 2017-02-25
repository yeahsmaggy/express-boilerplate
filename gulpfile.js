const gulp = require('gulp');
const gls = require('gulp-live-server');
const webpackDevServer = require('webpack-dev-server');

require('dotenv').config();

const statsOptions = {
  colors: true,
  hash: false,
  timings: true,
  chunks: false,
  chunkModules: false,
  modules: false
};

function getCompiler() {
  const config = require('./webpack.config.js');
  return require('webpack')(config);
}

function webpack(watch = false) {
  if (watch) {
    getCompiler().watch({}, (err, stats) => {
      console.log(stats.toString(statsOptions));
    });

    return;
  }

  getCompiler().run((err, stats) => {
    console.log(stats.toString(statsOptions));
  });
}

function serve() {
  // start express app
  let server = gls('bin/www', {env: {NODE_ENV: process.env.NODE_ENV}});
  server.start();

  // watcher for livereloading express server and browser
  gulp.watch(['app.js', 'routes/**/*', 'views/**/*'], function (file) {
    server.start.bind(server)();
    server.notify.apply(server, [file]);
  });

  if (process.env.NODE_ENV === 'developement') {
    // start webpack watcher
    return webpack(true);
  }

  // start webpack dev server
  const compiler = getCompiler();
  const expressPort = parseInt(process.env.PORT || '3000', 10);
  const devPort = parseInt(process.env.WEBPACKDEVSERVER_PORT || '5000', 10);

  new webpackDevServer(compiler, {
    historyApiFallback: true,
    noInfo: false,
    compress: true,
    hot: true,
    publicPath: compiler.options.output.publicPath,
    proxy: {
      '/': `http://localhost:${expressPort}`
    },
    stats: statsOptions
  }).listen(devPort);
}

gulp.task('dev', () => {
  process.env.NODE_ENV = 'developement';

  webpack();
});

gulp.task('watch', () => {
  process.env.NODE_ENV = 'developement';

  serve();
});

gulp.task('hot', () => {
  process.env.NODE_ENV = 'hot';

  serve();
});

gulp.task('production', () => {
  process.env.NODE_ENV = 'production';

  webpack();
});
