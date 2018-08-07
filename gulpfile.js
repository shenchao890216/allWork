const gulp = require('gulp')
const gulpColor = require('gulp-color')
const gulpCssNano = require('gulp-cssnano')
const gulpRequirejsOptimize = require('gulp-requirejs-optimize')
const gulpSass = require('gulp-sass')
const gulpPlumber = require('gulp-plumber')
const gulpAutoprefixer = require('gulp-autoprefixer')
const gulpImageMin = require('gulp-imagemin')
const gulpFilter = require('gulp-filter')
const gulpMd5Assets = require('gulp-md5-assets')
const gulpWatch = require('gulp-watch')
const runSequence = require('run-sequence')
const fancyLog = require('fancy-log')
const webpack = require('webpack')
const webpackStream = require('webpack-stream')
const vinylNamed = require('vinyl-named')
const through2 = require('through2')
const path = require('path')

/* 配置. */
const CONFIG = {
  srcStylesPath: 'source/scss',
  srcScriptsPath: 'source/scripts',
  srcImagesPath: 'source/images',
  destStylesPath: 'public/static/styles',
  destScriptsPath: 'public/static/scripts',
  destImagesPath: 'public/static/images',
  viewPath: 'application/views/**/*.html'
}

/* 任务 - scripts. */
gulp.task('scripts', function () {
  return createScripts(CONFIG.srcScriptsPath + '/!(_)**/!(_)*.js')
})

/* 任务 - scss. */
gulp.task('scss', function () {
  return createScss(CONFIG.srcStylesPath + '/**/*.scss', CONFIG.destStylesPath)
})

/* 任务 - images. */
gulp.task('images', function () {
  return gulp.src(CONFIG.srcImagesPath + '/**/*')
    .pipe(gulpImageMin())
    .pipe(gulp.dest(CONFIG.destImagesPath))
})

/* 任务 - build. */
gulp.task('build', function (callback) {
  runSequence('scripts', 'scss', 'images', callback)
})

/* 任务 - default. */
gulp.task('default', function() {
  let isSuccess = true

  gulpWatch(CONFIG.srcScriptsPath + '/**/*.js', function (event) {
    let srcFilePath = ''
    const changeFilePath = event.path

    if (changeFilePath.search(/\/_/) > -1) {
      if (changeFilePath.search(/\/scripts\/common/) > -1) {
        srcFilePath = CONFIG.srcScriptsPath + '/**/*.js'
      } else {
        let relativePath = path.relative(CONFIG.srcScriptsPath, changeFilePath)
        let basePath = path.resolve(CONFIG.srcScriptsPath, relativePath.split('/')[0])

        srcFilePath = basePath + '/**/*.js'
      }
    } else {
      srcFilePath = changeFilePath
    }

    createScripts(srcFilePath)
  })

  gulpWatch(CONFIG.srcStylesPath + '/**/*.scss', function (event) {
    const relativePath = path.relative('source/scss', event.path)

    createScss(event.path, path.join(CONFIG.destStylesPath, path.dirname(relativePath)))
  })

  gulpWatch(CONFIG.srcImagesPath + '/**/*', function () {
    return gulp.src(CONFIG.srcImagesPath + '/**/*')
      .pipe(gulpImageMin())
      .pipe(gulp.dest(CONFIG.destImagesPath))
  })
})

/* scripts任务. */
function createScripts(srcPath) {
  let isSuccess = true

  return gulp.src(srcPath)
    .pipe(gulpPlumber())
    .pipe(gulpFilter(function (file) {
      return !/\/_/.test(file.path)
    }))
    .pipe(vinylNamed(function (file) {
      let relativePath = path.relative(CONFIG.srcScriptsPath, file.path)
      return relativePath.slice(0, relativePath.lastIndexOf('.'))
    }))
    .pipe(webpackStream({
      module: {
        rules: [{
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['babel-preset-env'],
              cacheDirectory: true
            }
          }
        }]
      },
      mode: 'production'
    }, webpack))
    .on('error', function (e) {
      isSuccess = false
      console.log(gulpColor('编译错误: ' + e.error, 'RED'))
    })
    .pipe(gulp.dest(CONFIG.destScriptsPath))
    .pipe(gulpMd5Assets(8, CONFIG.viewPath))
    .pipe(through2.obj(function (file, enc, callback) {
      isSuccess && (
        fancyLog(gulpColor('编译成功 ' + path.relative('public', file.path) + ' ✔', 'GREEN'))
      )

      callback()
    }))
}

/* scss任务. */
function createScss(srcPath, destPath) {
  return gulp.src(srcPath)
    .pipe(gulpPlumber())
    .pipe(gulpSass({
      outputStyle: 'compressed'
    }))
    .on('error', gulpSass.logError)
    .pipe(gulpAutoprefixer({
      browsers: ['> 1%', 'last 2 versions', 'Firefox ESR'],
      cascade: false
    }))
    .pipe(gulpCssNano({
      safe: true,
      autoprefixer: false
    }))
    .pipe(gulp.dest(destPath))
    .pipe(gulpMd5Assets(8, CONFIG.viewPath))
    .pipe(through2.obj(function (file, enc, callback) {
      fancyLog(gulpColor('编译成功 ' + path.relative('public', file.path) + ' ✔', 'GREEN'))

      callback()
    }))
}
