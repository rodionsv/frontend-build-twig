'use strict';

import plugins       from 'gulp-load-plugins';
import yargs         from 'yargs';
import browser       from 'browser-sync';
import gulp          from 'gulp';
import rimraf        from 'rimraf';
import fs            from 'fs';
import webpackStream from 'webpack-stream';
import webpack2      from 'webpack';
import named         from 'vinyl-named';
import uncss         from 'uncss';
import autoprefixer  from 'autoprefixer';
import gcmq          from 'gulp-group-css-media-queries';

// Переменная для всех плагинов гальпа
const $ = plugins();
// Для настроек конфига, где пути для файлов и всё такое
const CONFIG = require('./config.js');

const compatibility = CONFIG.COMPATIBILITY;
const uncssOptions = CONFIG.UNCSS_OPTIONS_HTML;

// Берём пути и порт из переменной loadConfig
const PRODUCTION = !!(yargs.argv.production);

// Создаёт папку dist, запуская данные таски, sass в самом конце,
// потому что там работает ещё unCSS, который удаляет не используемые стили
gulp.task('build',
  gulp.series(clean, gulp.parallel(pages, javascript, images, copy), sass)
);

// Делаёт таск build, запускает локальный сервер и следит за изменениями файлов
gulp.task('default',
  gulp.series('build', server, watch)
);

// Таск на удаление папки dist
// Она будет удаляться каждый раз, когда будет запускаться сборка
function clean(done) {
  rimraf(CONFIG.PATHS_DIST, done);
}

// Копирование всех файлов в папку dist
// Игнорирует папку assets и всё что в ней, для них отдельные таски
function copy() {
  return gulp.src(CONFIG.PATHS_ASSETS)
    .pipe(gulp.dest(CONFIG.PATHS_DIST + '/assets'));
}

function pages() {
  return gulp.src('src/pages/*.twig')
      .pipe($.twig())
      .pipe(gulp.dest(CONFIG.PATHS_DIST));
}

// Собирает файлы SASS в CSS
// Если production, то минимайз для CSS файла
function sass() {

  const postCssPlugins = [
    // Autoprefixer
    autoprefixer({ browsers: compatibility }),

    // UnCSS - для удаления не используемых стилей в CSS, только если production
    PRODUCTION && uncss.postcssPlugin({
      html: uncssOptions
    }),
  ].filter(Boolean);

  return gulp.src('src/assets/scss/app.scss')
    .pipe($.sourcemaps.init())
    .pipe($.sass({
      includePaths: CONFIG.PATHS_SASS
    })
      .on('error', $.sass.logError))
    .pipe($.postcss(postCssPlugins))
    .pipe($.if(PRODUCTION, $.cleanCss({ compatibility: 'ie9' })))
    .pipe($.if(!PRODUCTION, $.sourcemaps.write()))
    .pipe(gcmq())
    .pipe(gulp.dest(CONFIG.PATHS_DIST + '/assets/css'))
    .pipe(browser.reload({ stream: true }));
}

let webpackConfig = {
  mode: (PRODUCTION ? 'production' : 'development'),
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [ "@babel/preset-env" ],
            compact: false
          }
        }
      }
    ]
  },
  plugins: [
    new webpack2.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery'
    }),
  ],
  devtool: !PRODUCTION && 'source-map'
};

// Комбинирует все js файлы в один без минимайз!
// Если production, то минимайз для js файлов
function javascript() {
  return gulp.src(CONFIG.PATHS_JS)
    .pipe(named())
    .pipe($.sourcemaps.init())
    .pipe(webpackStream(webpackConfig, webpack2))
    .pipe($.if(PRODUCTION, $.uglify()
      .on('error', e => { console.log(e); })
    ))
    .pipe($.if(!PRODUCTION, $.sourcemaps.write()))
    .pipe(gulp.dest(CONFIG.PATHS_DIST + '/assets/js'));
}

// Копирует все картинки в dist папку без imagemin!
// Если production, то использует imagemin
function images() {
  return gulp.src('src/assets/img/**/*')
    .pipe($.if(PRODUCTION, $.imagemin([
      $.imagemin.jpegtran({ progressive: true }),
    ])))
    .pipe(gulp.dest(CONFIG.PATHS_DIST + '/assets/img'));
}

// Таск для запуска локального сервера BrowserSync
function server(done) {
  browser.init({
    server: CONFIG.PATHS_DIST, port: CONFIG.PORT
  }, done);
}

// Таск для перезагрузки страницы BrowserSync
function reload(done) {
  browser.reload();
  done();
}

// Таск, чтобы следил за изменениями в файлах assets, pages, sass и js
function watch() {
  gulp.watch(CONFIG.PATHS_ASSETS, copy);
  gulp.watch('src/{layouts,pages,partials}/**/*.twig').on('all', gulp.series(pages, reload));
  gulp.watch('src/data/**/*.{js,json,yml}').on('all', gulp.series(pages, reload));
  gulp.watch('src/helpers/**/*.js').on('all', gulp.series(pages, reload));
  gulp.watch('src/assets/scss/**/*.scss').on('all', sass);
  gulp.watch('src/assets/js/**/*.js').on('all', gulp.series(javascript, reload));
  gulp.watch('src/assets/img/**/*').on('all', gulp.series(images, reload));
}
