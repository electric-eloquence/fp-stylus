'use strict';

const gulp = require('gulp');
const plugins = require('gulp-load-plugins')();
const runSequence = require('run-sequence');

const appDir = global.appDir;
const conf = global.conf;

const utils = require(`${appDir}/core/lib/utils`);

const cssBldDir = utils.pathResolve(conf.ui.paths.source.cssBld);
const cssSrcDir = utils.pathResolve(conf.ui.paths.source.cssSrc);

function handleError(err) {
  utils.error(err.toString());
  this.emit('end');
}

gulp.task('stylus', function () {
  return gulp.src(cssSrcDir + '/stylus/*.styl')
    .pipe(plugins.stylus({
      linenos: true
    }))
    .on('error', handleError)
    .pipe(gulp.dest(cssBldDir));
});

gulp.task('stylus:once', ['stylus']);

// This runs the CSS processor without outputting line comments.
// You probably want this to process CSS destined for production.
gulp.task('stylus:no-comment', function () {
  return gulp.src(cssSrcDir + '/stylus/*.styl')
    .pipe(plugins.stylus({
      linenos: false
    }))
    .on('error', handleError)
    .pipe(gulp.dest(cssBldDir));
});

gulp.task('stylus:frontend-copy', function (cb) {
  runSequence(
    'stylus:no-comment',
    'patternlab:copy-styles',
    cb
  );
});

gulp.task('stylus:watch', function () {
  gulp.watch('stylus/**', {cwd: cssSrcDir}, ['stylus']);
});
