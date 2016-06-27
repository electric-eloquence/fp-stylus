'use strict';

var conf = global.conf;
var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var runSequence = require('run-sequence');
var utilsGulp = require('../../../gulp/utils');

gulp.task('stylus', function () {
  return gulp.src('./' + conf.src + '/css-processors/stylus/*.styl')
    .pipe(plugins.stylus({
      linenos: true
    }))
    .on('error', utilsGulp.handleError)
    .pipe(gulp.dest('./' + conf.src + '/_styles'));
});

// This runs the CSS processor without outputting line comments.
// You probably want this to process CSS destined for production.
gulp.task('stylus:no-comments', function () {
  return gulp.src('./' + conf.src + '/css-processors/stylus/*.styl')
    .pipe(plugins.stylus({
      linenos: false
    }))
    .on('error', utilsGulp.handleError)
    .pipe(gulp.dest('./' + conf.src + '/_styles'));
});

gulp.task('stylus:frontend-copy', function (cb) {
  runSequence(
    'stylus:compile-no-comments',
    'patternlab:copy-styles',
    cb
  );
});

gulp.task('stylus:watch', function () {
  gulp.watch('./' + conf.src + '/css-processors/stylus/**/*.styl', ['stylus']);
});
