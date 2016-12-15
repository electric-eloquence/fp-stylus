'use strict';

const conf = global.conf;
const gulp = require('gulp');
const plugins = require('gulp-load-plugins')();
const runSequence = require('run-sequence');

const appDir = global.appDir;
const utils = require(`${appDir}/core/lib/utils`);
const utilsTask = require(`${appDir}/tasker/utils`);

const cssBldDir = utils.pathResolve(conf.ui.paths.source.cssBld);
const cssSrcDir = utils.pathResolve(conf.ui.paths.source.cssSrc);

gulp.task('stylus', function () {
  return gulp.src(cssSrcDir + '/stylus/*.styl')
    .pipe(plugins.stylus({
      linenos: true
    }))
    .on('error', utilsTask.handleError)
    .pipe(gulp.dest(cssBldDir));
});

// This runs the CSS processor without outputting line comments.
// You probably want this to process CSS destined for production.
gulp.task('stylus:no-comments', function () {
  return gulp.src(cssSrcDir + '/stylus/*.styl')
    .pipe(plugins.stylus({
      linenos: false
    }))
    .on('error', utilsTask.handleError)
    .pipe(gulp.dest(cssBldDir));
});

gulp.task('stylus:frontend-copy', function (cb) {
  runSequence(
    'stylus:compile-no-comments',
    'patternlab:copy-styles',
    cb
  );
});

gulp.task('stylus:watch', function () {
  gulp.watch('stylus/**', {cwd: cssSrcDir}, ['stylus']);
});
